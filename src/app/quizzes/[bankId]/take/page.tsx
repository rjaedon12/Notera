"use client"

import { useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  useQuestionBank,
  useCreateAttempt,
  useSubmitAnswer,
  useCompleteAttempt,
  useUpdateAnswerPoints,
} from "@/hooks/useQuiz"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  Home,
  ChevronRight,
  FileText,
  Calculator,
  MessageSquare,
} from "lucide-react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import type { Question } from "@/types"
import { QuizTimer } from "@/components/quiz-timer"
import { OpenResponseEditor } from "@/components/open-response-editor"
import { DesmosPanel } from "@/components/studyguide/DesmosPanel"
import { DesmosToggleButton } from "@/components/studyguide/DesmosToggleButton"
import { LatexRenderer } from "@/components/studyguide/LatexRenderer"

type QuizState = "ready" | "in-progress" | "self-grade" | "results" | "review"

interface AnswerRecord {
  questionId: string
  choiceId?: string
  openResponseText?: string
  isCorrect: boolean
  pointsEarned: number
}

interface QuestionInteractionState {
  selectedChoiceId: string | null
  openResponseText: string
  saved: boolean
  submitted: boolean
}

function createQuestionInteractionState(): QuestionInteractionState {
  return {
    selectedChoiceId: null,
    openResponseText: "",
    saved: false,
    submitted: false,
  }
}

function hasMeaningfulOpenResponse(html: string): boolean {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0
}

export default function TakeQuizPage({
  params,
}: {
  params: Promise<{ bankId: string }>
}) {
  const { bankId } = use(params)
  const router = useRouter()
  const { data: bank, isLoading } = useQuestionBank(bankId)
  const createAttempt = useCreateAttempt()
  const submitAnswer = useSubmitAnswer()
  const completeAttempt = useCompleteAttempt()
  const updateAnswerPoints = useUpdateAnswerPoints()

  const [state, setState] = useState<QuizState>("ready")
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionInteractionState>>({})
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const [desmosOpen, setDesmosOpen] = useState(false)

  // Self-grade state for open response questions
  const [selfGradeIndex, setSelfGradeIndex] = useState(0)
  const [selfGradePoints, setSelfGradePoints] = useState<Record<string, number>>({})

  const questions = bank?.questions || []
  const currentQuestion: Question | undefined = questions[currentIndex]
  const totalQuestions = questions.length
  const answeredCount = answers.length
  const timerMinutes = bank?.timerMinutes
  const desmosEnabled = bank?.desmosEnabled ?? false
  const feedbackMode = bank?.feedbackMode ?? "IMMEDIATE"
  const isImmediateFeedback = feedbackMode === "IMMEDIATE"

  const getQuestionState = useCallback(
    (questionId?: string) => {
      if (!questionId) return createQuestionInteractionState()
      return questionStates[questionId] ?? createQuestionInteractionState()
    },
    [questionStates]
  )

  const updateQuestionState = useCallback(
    (questionId: string, updates: Partial<QuestionInteractionState>) => {
      setQuestionStates((prev) => ({
        ...prev,
        [questionId]: {
          ...createQuestionInteractionState(),
          ...prev[questionId],
          ...updates,
        },
      }))
    },
    []
  )

  const currentQuestionState = getQuestionState(currentQuestion?.id)
  const selectedChoiceId = currentQuestionState.selectedChoiceId
  const openResponseText = currentQuestionState.openResponseText
  const submitted = currentQuestionState.submitted
  const isCurrentLocked = isImmediateFeedback && submitted

  const upsertAnswerRecord = useCallback((nextAnswer: AnswerRecord) => {
    setAnswers((prev) => {
      const existingIndex = prev.findIndex((answer) => answer.questionId === nextAnswer.questionId)
      if (existingIndex === -1) {
        return [...prev, nextAnswer]
      }

      return prev.map((answer, index) =>
        index === existingIndex ? nextAnswer : answer
      )
    })
  }, [])

  const hasResponse = useCallback((question: Question | undefined, questionState: QuestionInteractionState) => {
    if (!question) return false
    if (question.type === "OPEN_RESPONSE") {
      return hasMeaningfulOpenResponse(questionState.openResponseText)
    }
    return Boolean(questionState.selectedChoiceId)
  }, [])

  const isQuestionAnswered = useCallback(
    (question: Question) => {
      const persistedAnswer = answers.find((answer) => answer.questionId === question.id)
      if (persistedAnswer) return true

      if (!isImmediateFeedback) {
        return hasResponse(question, getQuestionState(question.id))
      }

      return false
    },
    [answers, getQuestionState, hasResponse, isImmediateFeedback]
  )

  const persistQuestionAnswer = useCallback(
    async (
      question: Question,
      questionState: QuestionInteractionState,
      options: { revealFeedback: boolean; silent?: boolean }
    ) => {
      if (!attemptId) return false
      if (!hasResponse(question, questionState)) return true

      try {
        const result = await submitAnswer.mutateAsync(
          question.type === "OPEN_RESPONSE"
            ? {
                attemptId,
                questionId: question.id,
                openResponseText: questionState.openResponseText,
              }
            : {
                attemptId,
                questionId: question.id,
                choiceId: questionState.selectedChoiceId || undefined,
              }
        )

        upsertAnswerRecord({
          questionId: question.id,
          choiceId: questionState.selectedChoiceId || undefined,
          openResponseText: questionState.openResponseText || undefined,
          isCorrect: result.isCorrect,
          pointsEarned: result.pointsEarned ?? 0,
        })

        updateQuestionState(question.id, {
          saved: true,
          submitted: options.revealFeedback,
        })

        return true
      } catch {
        if (!options.silent) {
          toast.error(options.revealFeedback ? "Failed to submit answer" : "Failed to save answer")
        }
        return false
      }
    },
    [attemptId, hasResponse, submitAnswer, updateQuestionState, upsertAnswerRecord]
  )

  const persistCurrentDraftIfNeeded = useCallback(async () => {
    if (isImmediateFeedback || !currentQuestion) return true
    if (currentQuestionState.saved) return true
    if (!hasResponse(currentQuestion, currentQuestionState)) return true

    return persistQuestionAnswer(currentQuestion, currentQuestionState, {
      revealFeedback: false,
    })
  }, [
    currentQuestion,
    currentQuestionState,
    hasResponse,
    isImmediateFeedback,
    persistQuestionAnswer,
  ])

  const navigateToQuestion = useCallback(
    async (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= totalQuestions) return

      const persisted = await persistCurrentDraftIfNeeded()
      if (!persisted) return

      setCurrentIndex(nextIndex)
    },
    [persistCurrentDraftIfNeeded, totalQuestions]
  )

  // Get open response questions that need grading
  const openResponseAnswers = answers.filter((a) => {
    const q = questions.find((q) => q.id === a.questionId)
    return q?.type === "OPEN_RESPONSE"
  })

  const startQuiz = useCallback(async () => {
    try {
      const attempt = await createAttempt.mutateAsync(bankId)
      setAttemptId(attempt.id)
      setState("in-progress")
      setCurrentIndex(0)
      setQuestionStates({})
      setAnswers([])
      setFinalScore(null)
      setSelfGradeIndex(0)
      setSelfGradePoints({})
    } catch {
      toast.error("Failed to start practice test")
    }
  }, [bankId, createAttempt])

  const handleSelectChoice = (choiceId: string) => {
    if (!currentQuestion || isCurrentLocked) return
    updateQuestionState(currentQuestion.id, {
      selectedChoiceId: choiceId,
      saved: false,
    })
  }

  const handleOpenResponseChange = (html: string) => {
    if (!currentQuestion || isCurrentLocked) return
    updateQuestionState(currentQuestion.id, {
      openResponseText: html,
      saved: false,
    })
  }

  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return
    if (!hasResponse(currentQuestion, currentQuestionState)) return

    await persistQuestionAnswer(currentQuestion, currentQuestionState, {
      revealFeedback: isImmediateFeedback,
      silent: false,
    })
  }

  const handleNext = async () => {
    if (currentIndex < totalQuestions - 1) {
      await navigateToQuestion(currentIndex + 1)
    } else {
      await handleFinish()
    }
  }

  const doComplete = async () => {
    if (!attemptId) return
    try {
      const result = await completeAttempt.mutateAsync(attemptId)
      setFinalScore(result.score)
      setState("results")
    } catch {
      toast.error("Failed to complete practice test")
    }
  }

  const handleFinish = async () => {
    const persisted = await persistCurrentDraftIfNeeded()
    if (!persisted) return

    const unansweredCount = questions.filter((question) => !isQuestionAnswered(question)).length
    if (unansweredCount > 0) {
      const shouldFinish = confirm(
        `You still have ${unansweredCount} unanswered question${unansweredCount === 1 ? "" : "s"}. Finish anyway?`
      )
      if (!shouldFinish) return
    }

    // If there are open response questions, go to self-grade first
    if (openResponseAnswers.length > 0) {
      setSelfGradeIndex(0)
      setState("self-grade")
      return
    }
    await doComplete()
  }

  const handleTimeUp = useCallback(async () => {
    toast.error("Time's up!")
    // Go directly to complete (skip self-grade on timeout for simplicity)
    if (!attemptId) return

    const persisted = await persistCurrentDraftIfNeeded()
    if (!persisted) return

    completeAttempt.mutateAsync(attemptId).then((result) => {
      setFinalScore(result.score)
      setState("results")
    }).catch(() => {
      toast.error("Failed to complete practice test")
    })
  }, [attemptId, completeAttempt, persistCurrentDraftIfNeeded])

  const handleSelfGrade = async (questionId: string, points: number) => {
    if (!attemptId) return
    setSelfGradePoints((prev) => ({ ...prev, [questionId]: points }))
    try {
      await updateAnswerPoints.mutateAsync({
        attemptId,
        questionId,
        pointsEarned: points,
      })
    } catch {
      toast.error("Failed to save grade")
    }

    if (selfGradeIndex < openResponseAnswers.length - 1) {
      setSelfGradeIndex((prev) => prev + 1)
    } else {
      await doComplete()
    }
  }

  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion?.id
  )
  const currentHasResponse = hasResponse(currentQuestion, currentQuestionState)
  // Total points
  const totalPoints = questions.reduce((sum, q) => sum + (q.pointValue ?? 1), 0)
  const earnedPoints = answers.reduce((sum, a) => {
    const override = selfGradePoints[a.questionId]
    return sum + (override != null ? override : a.pointsEarned)
  }, 0)

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading practice test...</div>
      </div>
    )
  }

  if (!bank || totalQuestions === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {!bank ? "Practice test not found" : "No questions in this test"}
          </h2>
          <Link href="/quizzes" className="text-blue-500 hover:underline">
            Back to Practice Tests
          </Link>
        </div>
      </div>
    )
  }

  // ─── Ready Screen ───
  if (state === "ready") {
    const mcCount = questions.filter((q) => q.type !== "OPEN_RESPONSE").length
    const orCount = questions.filter((q) => q.type === "OPEN_RESPONSE").length

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{bank.title}</h1>
            {bank.description && (
              <p className="text-muted-foreground mb-4">{bank.description}</p>
            )}
            <div className="text-sm text-muted-foreground mb-2 space-y-1">
              <div>
                {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} •{" "}
                {totalPoints} total point{totalPoints !== 1 ? "s" : ""}
              </div>
              <div className="flex items-center justify-center gap-3">
                {mcCount > 0 && <span>{mcCount} Multiple Choice</span>}
                {orCount > 0 && <span>{orCount} Open Response</span>}
              </div>
              {timerMinutes && (
                <div className="flex items-center justify-center gap-1 text-yellow-600 dark:text-yellow-400">
                  ⏱ {timerMinutes} minute{timerMinutes !== 1 ? "s" : ""} time limit
                </div>
              )}
              {desmosEnabled && (
                <div className="flex items-center justify-center gap-1">
                  <Calculator className="h-3.5 w-3.5" />
                  Desmos calculator available
                </div>
              )}
              <div>
                {isImmediateFeedback
                  ? "Answers are checked after each question, but you can move around freely."
                  : "Answers stay editable until you finish, and feedback is revealed at the end."}
              </div>
            </div>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline" onClick={() => router.push(`/quizzes/${bankId}`)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                size="lg"
                onClick={startQuiz}
                disabled={createAttempt.isPending}
              >
                {createAttempt.isPending ? "Starting..." : "Start Test"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Self-Grade Screen (for open response) ───
  if (state === "self-grade") {
    const gradeAnswer = openResponseAnswers[selfGradeIndex]
    const gradeQuestion = questions.find((q) => q.id === gradeAnswer?.questionId)
    if (!gradeQuestion || !gradeAnswer) return null

    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        <div className="bg-background border-b border-border px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Self-Assessment: Question {selfGradeIndex + 1} of {openResponseAnswers.length}
            </span>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left: Question + Example Answer */}
          <div className="w-1/2 border-r border-border p-8 overflow-y-auto">
            <div className="max-w-lg mx-auto">
              <h2 className="text-xl font-semibold mb-4 leading-relaxed">
                <LatexRenderer content={gradeQuestion.prompt} className="block" />
              </h2>
              {gradeQuestion.exampleAnswer && (
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">
                    Example Answer
                  </div>
                  <div className="text-sm leading-relaxed">
                    <LatexRenderer content={gradeQuestion.exampleAnswer} className="block" />
                  </div>
                </div>
              )}
              <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  Explanation
                </div>
                <div className="text-sm leading-relaxed">
                  <LatexRenderer content={gradeQuestion.explanation} className="block" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Your response + Points slider */}
          <div className="w-1/2 p-8 overflow-y-auto">
            <div className="max-w-lg mx-auto">
              <div className="text-sm font-medium text-muted-foreground mb-2">Your Response</div>
              <div
                className="p-4 rounded-lg border bg-muted/30 text-sm prose prose-sm dark:prose-invert max-w-none mb-6"
                dangerouslySetInnerHTML={{ __html: gradeAnswer.openResponseText || "<em>No response</em>" }}
              />

              <div className="space-y-3">
                <Label className="text-base font-semibold">
                  How many points would you give yourself? (out of {gradeQuestion.pointValue})
                </Label>
                <div className="text-2xl font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] text-center">
                  {selfGradePoints[gradeQuestion.id] ?? 0}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[#6E6E73]">0</span>
                  <input
                    type="range"
                    min={0}
                    max={gradeQuestion.pointValue}
                    step={1}
                    value={selfGradePoints[gradeQuestion.id] ?? 0}
                    onChange={(e) =>
                      setSelfGradePoints((prev) => ({
                        ...prev,
                        [gradeQuestion.id]: Number(e.target.value),
                      }))
                    }
                    disabled={updateAnswerPoints.isPending}
                    className="flex-1 h-2 appearance-none rounded-full bg-[#E8E8ED] cursor-pointer
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#0071E3] [&::-webkit-slider-thumb]:shadow-md
                      [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#0071E3] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md
                      [&::-moz-range-progress]:bg-[#0071E3] [&::-moz-range-progress]:rounded-full"
                    style={{
                      background: `linear-gradient(to right, #0071E3 ${
                        ((selfGradePoints[gradeQuestion.id] ?? 0) / gradeQuestion.pointValue) * 100
                      }%, #E8E8ED ${
                        ((selfGradePoints[gradeQuestion.id] ?? 0) / gradeQuestion.pointValue) * 100
                      }%)`,
                    }}
                  />
                  <span className="text-sm text-[#6E6E73]">{gradeQuestion.pointValue}</span>
                </div>
                <Button
                  onClick={() =>
                    handleSelfGrade(
                      gradeQuestion.id,
                      selfGradePoints[gradeQuestion.id] ?? 0
                    )
                  }
                  disabled={updateAnswerPoints.isPending}
                  className="w-full mt-2"
                >
                  {updateAnswerPoints.isPending ? "Saving..." : "Confirm Score"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Results Screen ───
  if (state === "results") {
    const percentage = Math.round(finalScore || 0)

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <div
              className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6",
                percentage >= 70
                  ? "bg-green-100 dark:bg-green-900/30"
                  : percentage >= 50
                  ? "bg-yellow-100 dark:bg-yellow-900/30"
                  : "bg-red-100 dark:bg-red-900/30"
              )}
            >
              <Trophy
                className={cn(
                  "h-10 w-10",
                  percentage >= 70
                    ? "text-green-600 dark:text-green-400"
                    : percentage >= 50
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                )}
              />
            </div>

            <h1 className="text-2xl font-bold mb-1">Test Complete!</h1>
            <p className="text-muted-foreground mb-6">{bank.title}</p>

            <div
              className={cn(
                "text-5xl font-bold mb-2",
                percentage >= 70
                  ? "text-green-600 dark:text-green-400"
                  : percentage >= 50
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {percentage}%
            </div>
            <p className="text-muted-foreground mb-8">
              {earnedPoints} of {totalPoints} points
            </p>

            {/* Answer Summary */}
            <div className="flex justify-center gap-1.5 mb-8 flex-wrap">
              {questions.map((question, index) => {
                const answer = answers.find((entry) => entry.questionId === question.id)
                const pts = answer
                  ? (selfGradePoints[question.id] ?? answer.pointsEarned)
                  : 0
                const maxPts = question.pointValue ?? 1
                const full = pts >= maxPts
                const partial = pts > 0 && pts < maxPts
                return (
                  <div
                    key={question.id}
                    className={cn(
                      "h-3 w-3 rounded-full",
                      full
                        ? "bg-green-500"
                        : partial
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    )}
                    title={`Q${index + 1}: ${pts}/${maxPts} pts`}
                  />
                )
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push("/quizzes")}>
                <Home className="h-4 w-4 mr-1" />
                Practice Tests
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentIndex(0)
                  setState("review")
                }}
              >
                Review Answers
              </Button>
              <Button onClick={startQuiz}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Review Mode ───
  if (state === "review") {
    const reviewQuestion = questions[currentIndex]
    const reviewAnswer = answers.find((a) => a.questionId === reviewQuestion?.id)

    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        <div className="bg-background border-b border-border px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Reviewing Question {currentIndex + 1} of {totalQuestions}
              <span className="ml-2 text-xs">
                ({reviewQuestion?.pointValue ?? 1} pt{(reviewQuestion?.pointValue ?? 1) !== 1 ? "s" : ""})
              </span>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setState("results")}
            >
              Back to Results
            </Button>
          </div>
          <div className="max-w-5xl mx-auto mt-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex-1 flex">
          {/* Left Panel */}
          <div className="w-1/2 border-r border-border p-8 overflow-y-auto">
            <div className="max-w-lg mx-auto">
              {reviewQuestion?.passage && (
                <div className="bg-muted/50 p-4 rounded-lg mb-6 text-sm leading-relaxed italic">
                  <LatexRenderer content={reviewQuestion.passage} className="block" />
                </div>
              )}
              {reviewQuestion?.imageUrl && (
                <img
                  src={reviewQuestion.imageUrl}
                  alt="Question"
                  className="max-h-48 rounded-lg border mb-6"
                />
              )}
              <h2 className="text-xl font-semibold leading-relaxed">
                <LatexRenderer content={reviewQuestion?.prompt ?? ""} className="block" />
              </h2>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-1/2 p-8 overflow-y-auto">
            <div className="max-w-lg mx-auto space-y-3">
              {reviewQuestion?.type === "OPEN_RESPONSE" ? (
                <>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Your Response</div>
                  <div
                    className="p-4 rounded-lg border bg-muted/30 text-sm prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: reviewAnswer?.openResponseText || "<em>No response</em>" }}
                  />
                  {reviewQuestion.exampleAnswer && (
                    <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                        Example Answer
                      </div>
                      <div className="text-sm leading-relaxed">
                        <LatexRenderer content={reviewQuestion.exampleAnswer} className="block" />
                      </div>
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    Self-assessed: {selfGradePoints[reviewQuestion.id] ?? reviewAnswer?.pointsEarned ?? 0} / {reviewQuestion.pointValue} pts
                  </div>
                </>
              ) : (
                reviewQuestion?.choices?.map((choice, ci) => {
                  const isSelected = reviewAnswer?.choiceId === choice.id
                  const isCorrectChoice = choice.isCorrect
                  return (
                    <div
                      key={choice.id}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                        isCorrectChoice
                          ? "border-green-400 bg-green-50 dark:bg-green-900/20"
                          : isSelected
                          ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                          : "border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-full text-sm font-bold shrink-0",
                          isCorrectChoice
                            ? "bg-green-500 text-white"
                            : isSelected
                            ? "bg-red-500 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {String.fromCharCode(65 + ci)}
                      </div>
                      <span className="flex-1">
                        <LatexRenderer content={choice.text} className="block" />
                      </span>
                      {isCorrectChoice && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                      {isSelected && !isCorrectChoice && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
                    </div>
                  )
                })
              )}

              {/* Explanation */}
              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  Explanation
                </div>
                <div className="text-sm leading-relaxed">
                  <LatexRenderer content={reviewQuestion?.explanation ?? ""} className="block" />
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((p) => p - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                {currentIndex < totalQuestions - 1 ? (
                  <Button onClick={() => setCurrentIndex((p) => p + 1)}>
                    Next
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={() => setState("results")}>
                    Back to Results
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── In-Progress (Taking Test) ───
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Top Progress Bar */}
      <div className="bg-background border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to exit? Your progress will be lost.")) {
                  router.push(`/quizzes/${bankId}`)
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Exit
            </Button>
            <span className="text-sm font-medium">
              Question {currentIndex + 1}{" "}
              <span className="text-muted-foreground">of {totalQuestions}</span>
              <span className="text-xs text-muted-foreground ml-2">
                ({currentQuestion?.pointValue ?? 1} pt{(currentQuestion?.pointValue ?? 1) !== 1 ? "s" : ""})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {timerMinutes && (
              <QuizTimer totalMinutes={timerMinutes} onTimeUp={handleTimeUp} />
            )}
            <span className="text-sm text-muted-foreground">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto mt-2">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{
                width: `${((answeredCount) / totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Split Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel — Question Stem */}
        <div
          className="border-r border-border p-8 overflow-y-auto bg-background"
          style={{
            width: desmosOpen ? '35%' : '50%',
            flexShrink: desmosOpen ? 1 : 0,
            flexGrow: 0,
            minWidth: '200px',
            transition: 'width 300ms ease-in-out',
          }}
        >
          <div className="max-w-lg mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
              Question {currentIndex + 1}
              {currentQuestion?.type === "OPEN_RESPONSE" && (
                <span className="flex items-center gap-1 text-xs">
                  <MessageSquare className="h-3 w-3" />
                  Open Response
                </span>
              )}
            </div>

            {currentQuestion?.passage && (
              <div className="bg-muted/50 p-5 rounded-lg mb-6 text-sm leading-relaxed border-l-4 border-purple-400">
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Reading Passage
                </div>
                <LatexRenderer content={currentQuestion.passage} className="block" />
              </div>
            )}

            {currentQuestion?.imageUrl && (
              <div className="mb-6">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question illustration"
                  className="max-h-56 rounded-lg border shadow-sm"
                />
              </div>
            )}

            <h2 className="text-xl font-semibold leading-relaxed">
              <LatexRenderer content={currentQuestion?.prompt ?? ""} className="block" />
            </h2>
          </div>
        </div>

        {/* Center Panel — Answer Area */}
        <div
          className="p-8 overflow-y-auto bg-muted/30"
          style={{
            width: desmosOpen ? '35%' : '50%',
            flexShrink: desmosOpen ? 1 : 0,
            flexGrow: 0,
            minWidth: '200px',
            transition: 'width 300ms ease-in-out',
          }}
        >
          <div className="max-w-lg mx-auto">
            {currentQuestion?.type === "OPEN_RESPONSE" ? (
              <>
                <div className="text-sm font-medium text-muted-foreground mb-4">
                  {isCurrentLocked
                    ? "Your response"
                    : isImmediateFeedback
                    ? "Write your response"
                    : currentQuestionState.saved
                    ? "Your saved response"
                    : "Write your response"}
                </div>
                <OpenResponseEditor
                  key={currentQuestion?.id}
                  value={openResponseText}
                  onChange={handleOpenResponseChange}
                  readOnly={isCurrentLocked}
                  placeholder="Type your response here. Use the toolbar for formatting and math equations..."
                />

                {/* Show example answer + explanation after submit */}
                {isImmediateFeedback && submitted && (
                  <div className="space-y-4 mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {currentQuestion.exampleAnswer && (
                      <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                          Example Answer
                        </div>
                        <div className="text-sm leading-relaxed">
                          <LatexRenderer content={currentQuestion.exampleAnswer} className="block" />
                        </div>
                      </div>
                    )}
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                        Explanation
                      </div>
                      <div className="text-sm leading-relaxed">
                        <LatexRenderer content={currentQuestion.explanation} className="block" />
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="text-sm font-medium text-muted-foreground mb-4">
                  {isImmediateFeedback && submitted ? "Result" : "Select your answer"}
                </div>

                <div className="space-y-3">
                  {currentQuestion?.choices?.map((choice, ci) => {
                    const isSelected = selectedChoiceId === choice.id
                    const isCorrectChoice = choice.isCorrect

                    let borderClass = "border-border hover:border-purple-400 cursor-pointer"
                    let bgClass = "bg-background"

                    if (isImmediateFeedback && submitted) {
                      borderClass = "border-border cursor-default"
                      if (isCorrectChoice) {
                        borderClass = "border-green-400"
                        bgClass = "bg-green-50 dark:bg-green-900/20"
                      } else if (isSelected && !isCorrectChoice) {
                        borderClass = "border-red-400"
                        bgClass = "bg-red-50 dark:bg-red-900/20"
                      }
                    } else if (isSelected) {
                      borderClass = "border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800 cursor-pointer"
                      bgClass = "bg-purple-50 dark:bg-purple-900/20"
                    }

                    return (
                      <button
                        key={choice.id}
                        onClick={() => handleSelectChoice(choice.id)}
                        disabled={isCurrentLocked}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                          borderClass,
                          bgClass
                        )}
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold shrink-0 transition-colors",
                            isImmediateFeedback && submitted && isCorrectChoice
                              ? "bg-green-500 text-white"
                              : isImmediateFeedback && submitted && isSelected && !isCorrectChoice
                              ? "bg-red-500 text-white"
                              : isSelected
                              ? "bg-purple-500 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {String.fromCharCode(65 + ci)}
                        </div>
                        <span className="flex-1 text-[15px]">
                          <LatexRenderer content={choice.text} className="block" />
                        </span>
                        {isImmediateFeedback && submitted && isCorrectChoice && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                        )}
                        {isImmediateFeedback && submitted && isSelected && !isCorrectChoice && (
                          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Explanation (shown after submit) */}
                {isImmediateFeedback && submitted && (
                  <div className="mt-6 p-5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2 mb-2">
                      {currentAnswer?.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span
                        className={cn(
                          "font-semibold text-sm",
                          currentAnswer?.isCorrect
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                        )}
                      >
                        {currentAnswer?.isCorrect ? "Correct!" : "Incorrect"}
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed">
                      <LatexRenderer content={currentQuestion?.explanation ?? ""} className="block" />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              {!isImmediateFeedback && (
                <p className="text-xs text-muted-foreground">
                  Saved answers can be changed until you finish the test.
                </p>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  variant="outline"
                  disabled={currentIndex === 0 || submitAnswer.isPending}
                  onClick={() => {
                    void navigateToQuestion(currentIndex - 1)
                  }}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>

                <div className="flex flex-wrap items-center gap-3 ml-auto">
                  <Button
                    onClick={() => {
                      void handleSubmitAnswer()
                    }}
                    disabled={
                      !currentHasResponse ||
                      submitAnswer.isPending ||
                      (isImmediateFeedback ? submitted : currentQuestionState.saved)
                    }
                    className="min-w-[140px]"
                  >
                    {isImmediateFeedback
                      ? submitAnswer.isPending
                        ? "Checking..."
                        : submitted
                        ? "Answer Submitted"
                        : "Submit Answer"
                      : submitAnswer.isPending
                      ? "Saving..."
                      : currentQuestionState.saved
                      ? "Answer Saved"
                      : "Save Answer"}
                  </Button>

                  {currentIndex < totalQuestions - 1 ? (
                    <Button
                      onClick={() => {
                        void handleNext()
                      }}
                      disabled={submitAnswer.isPending}
                    >
                      Next Question
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        void handleFinish()
                      }}
                      disabled={completeAttempt.isPending || submitAnswer.isPending}
                    >
                      {completeAttempt.isPending ? "Finishing..." : "Finish Test"}
                      <Trophy className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Question Dots Navigator */}
            <div className="flex justify-center gap-1.5 mt-8 flex-wrap">
              {questions.map((q, i) => {
                const ans = answers.find((a) => a.questionId === q.id)
                const answered = isQuestionAnswered(q)
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      void navigateToQuestion(i)
                    }}
                    className={cn(
                      "h-3 w-3 rounded-full transition-all",
                      i === currentIndex
                        ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-background"
                        : "",
                      isImmediateFeedback
                        ? ans
                          ? ans.isCorrect || (q.type === "OPEN_RESPONSE" && ans.openResponseText)
                            ? q.type === "OPEN_RESPONSE"
                              ? "bg-blue-500"
                              : ans.isCorrect
                              ? "bg-green-500"
                              : "bg-red-500"
                            : "bg-red-500"
                          : i === currentIndex
                          ? "bg-purple-500"
                          : "bg-muted-foreground/30"
                        : answered
                          ? q.type === "OPEN_RESPONSE"
                            ? "bg-blue-500"
                            : "bg-blue-500"
                        : i === currentIndex
                        ? "bg-purple-500"
                        : "bg-muted-foreground/30"
                    )}
                    title={`Question ${i + 1}`}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Panel — Desmos Calculator (slides in as third column) */}
        {/* TODO: Add responsive breakpoint check — if viewport width < ~1024px,
           fall back to existing overlay behavior instead of inline panel */}
        {desmosEnabled && (
          <div
            className="overflow-hidden border-l border-[#E8E8ED]"
            style={{
              width: desmosOpen ? '30%' : '0%',
              minWidth: desmosOpen ? '320px' : '0px',
              flexShrink: 0,
              flexGrow: 0,
              transition: 'width 300ms ease-in-out, min-width 300ms ease-in-out',
            }}
          >
            <DesmosPanel isOpen={desmosOpen} onClose={() => setDesmosOpen(false)} inline />
          </div>
        )}
      </div>

      {/* Desmos Toggle Button */}
      {desmosEnabled && (
        <DesmosToggleButton isOpen={desmosOpen} onClick={() => setDesmosOpen(!desmosOpen)} />
      )}
    </div>
  )
}
