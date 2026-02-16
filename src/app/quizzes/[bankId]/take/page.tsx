"use client"

import { useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  useQuestionBank,
  useCreateAttempt,
  useSubmitAnswer,
  useCompleteAttempt,
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import type { Question, QuestionChoice } from "@/types"

type QuizState = "ready" | "in-progress" | "review" | "results"

interface AnswerRecord {
  questionId: string
  choiceId: string
  isCorrect: boolean
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

  const [state, setState] = useState<QuizState>("ready")
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<AnswerRecord[]>([])
  const [finalScore, setFinalScore] = useState<number | null>(null)

  const questions = bank?.questions || []
  const currentQuestion: Question | undefined = questions[currentIndex]
  const totalQuestions = questions.length
  const answeredCount = answers.length

  const startQuiz = useCallback(async () => {
    try {
      const attempt = await createAttempt.mutateAsync(bankId)
      setAttemptId(attempt.id)
      setState("in-progress")
      setCurrentIndex(0)
      setSelectedChoiceId(null)
      setSubmitted(false)
      setAnswers([])
      setFinalScore(null)
    } catch {
      toast.error("Failed to start quiz")
    }
  }, [bankId, createAttempt])

  const handleSelectChoice = (choiceId: string) => {
    if (submitted) return
    setSelectedChoiceId(choiceId)
  }

  const handleSubmitAnswer = async () => {
    if (!selectedChoiceId || !currentQuestion || !attemptId) return

    try {
      const result = await submitAnswer.mutateAsync({
        attemptId,
        questionId: currentQuestion.id,
        choiceId: selectedChoiceId,
      })

      setAnswers((prev) => [
        ...prev,
        {
          questionId: currentQuestion.id,
          choiceId: selectedChoiceId,
          isCorrect: result.isCorrect,
        },
      ])
      setSubmitted(true)
    } catch {
      toast.error("Failed to submit answer")
    }
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1)
      setSelectedChoiceId(null)
      setSubmitted(false)
    } else {
      // Last question — complete the quiz
      handleComplete()
    }
  }

  const handleComplete = async () => {
    if (!attemptId) return
    try {
      const result = await completeAttempt.mutateAsync(attemptId)
      setFinalScore(result.score)
      setState("results")
    } catch {
      toast.error("Failed to complete quiz")
    }
  }

  // Get the answer for current question (if submitted)
  const currentAnswer = answers.find(
    (a) => a.questionId === currentQuestion?.id
  )
  const selectedChoice = currentQuestion?.choices.find(
    (c) => c.id === selectedChoiceId
  )
  const correctChoice = currentQuestion?.choices.find((c) => c.isCorrect)

  // ─── Loading ───
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading quiz...</div>
      </div>
    )
  }

  if (!bank || totalQuestions === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            {!bank ? "Quiz not found" : "No questions in this bank"}
          </h2>
          <Link href="/quizzes" className="text-blue-500 hover:underline">
            Back to Quizzes
          </Link>
        </div>
      </div>
    )
  }

  // ─── Ready Screen ───
  if (state === "ready") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Card className="max-w-lg w-full">
          <CardContent className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-6">
              <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">{bank.title}</h1>
            {bank.description && (
              <p className="text-muted-foreground mb-6">{bank.description}</p>
            )}
            <div className="text-sm text-muted-foreground mb-8">
              {totalQuestions} question{totalQuestions !== 1 ? "s" : ""} •
              Multiple Choice
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push(`/quizzes/${bankId}`)}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <Button
                size="lg"
                onClick={startQuiz}
                disabled={createAttempt.isPending}
              >
                {createAttempt.isPending ? "Starting..." : "Start Quiz"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ─── Results Screen ───
  if (state === "results") {
    const score = finalScore || 0
    const percentage = Math.round((score / totalQuestions) * 100)

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

            <h1 className="text-2xl font-bold mb-1">Quiz Complete!</h1>
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
              {score} of {totalQuestions} correct
            </p>

            {/* Answer Summary */}
            <div className="flex justify-center gap-1.5 mb-8 flex-wrap">
              {answers.map((a, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-3 w-3 rounded-full",
                    a.isCorrect
                      ? "bg-green-500"
                      : "bg-red-500"
                  )}
                  title={`Q${i + 1}: ${a.isCorrect ? "Correct" : "Incorrect"}`}
                />
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.push("/quizzes")}>
                <Home className="h-4 w-4 mr-1" />
                Quizzes
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setState("in-progress")
                  setCurrentIndex(0)
                  setSubmitted(true) // Show answers in review mode
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
    const reviewCorrect = reviewQuestion?.choices.find((c) => c.isCorrect)

    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Progress Bar */}
        <div className="bg-background border-b border-border px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Reviewing Question {currentIndex + 1} of {totalQuestions}
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

        {/* Split Panel */}
        <div className="flex-1 flex">
          {/* Left Panel — Question */}
          <div className="w-1/2 border-r border-border p-8 overflow-y-auto">
            <div className="max-w-lg mx-auto">
              {reviewQuestion?.passage && (
                <div className="bg-muted/50 p-4 rounded-lg mb-6 text-sm leading-relaxed italic">
                  {reviewQuestion.passage}
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
                {reviewQuestion?.prompt}
              </h2>
            </div>
          </div>

          {/* Right Panel — Choices + Explanation */}
          <div className="w-1/2 p-8 overflow-y-auto">
            <div className="max-w-lg mx-auto space-y-3">
              {reviewQuestion?.choices.map((choice, ci) => {
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
                    <span className="flex-1">{choice.text}</span>
                    {isCorrectChoice && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    )}
                    {isSelected && !isCorrectChoice && (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    )}
                  </div>
                )
              })}

              {/* Explanation */}
              <div className="mt-6 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                  Explanation
                </div>
                <p className="text-sm leading-relaxed">
                  {reviewQuestion?.explanation}
                </p>
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

  // ─── In-Progress (Taking Quiz) ───
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
            </span>
          </div>
          <div className="flex items-center gap-3">
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

      {/* Split Panel Layout (Albert.io style) */}
      <div className="flex-1 flex">
        {/* Left Panel — Question Stem */}
        <div className="w-1/2 border-r border-border p-8 overflow-y-auto bg-background">
          <div className="max-w-lg mx-auto">
            {/* Question number badge */}
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium mb-6">
              Question {currentIndex + 1}
            </div>

            {/* Passage */}
            {currentQuestion?.passage && (
              <div className="bg-muted/50 p-5 rounded-lg mb-6 text-sm leading-relaxed border-l-4 border-purple-400">
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Reading Passage
                </div>
                {currentQuestion.passage}
              </div>
            )}

            {/* Image */}
            {currentQuestion?.imageUrl && (
              <div className="mb-6">
                <img
                  src={currentQuestion.imageUrl}
                  alt="Question illustration"
                  className="max-h-56 rounded-lg border shadow-sm"
                />
              </div>
            )}

            {/* Prompt */}
            <h2 className="text-xl font-semibold leading-relaxed">
              {currentQuestion?.prompt}
            </h2>
          </div>
        </div>

        {/* Right Panel — Answer Choices */}
        <div className="w-1/2 p-8 overflow-y-auto bg-muted/30">
          <div className="max-w-lg mx-auto">
            <div className="text-sm font-medium text-muted-foreground mb-4">
              {submitted ? "Result" : "Select your answer"}
            </div>

            <div className="space-y-3">
              {currentQuestion?.choices.map((choice, ci) => {
                const isSelected = selectedChoiceId === choice.id
                const isCorrectChoice = choice.isCorrect

                let borderClass = "border-border hover:border-purple-400 cursor-pointer"
                let bgClass = "bg-background"

                if (submitted) {
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
                    disabled={submitted}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                      borderClass,
                      bgClass
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center h-9 w-9 rounded-full text-sm font-bold shrink-0 transition-colors",
                        submitted && isCorrectChoice
                          ? "bg-green-500 text-white"
                          : submitted && isSelected && !isCorrectChoice
                          ? "bg-red-500 text-white"
                          : isSelected
                          ? "bg-purple-500 text-white"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {String.fromCharCode(65 + ci)}
                    </div>
                    <span className="flex-1 text-[15px]">{choice.text}</span>
                    {submitted && isCorrectChoice && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    )}
                    {submitted && isSelected && !isCorrectChoice && (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Explanation (shown after submit) */}
            {submitted && (
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
                <p className="text-sm leading-relaxed">
                  {currentQuestion?.explanation}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => {
                  setCurrentIndex((p) => p - 1)
                  // Check if previous question was already answered
                  const prevQ = questions[currentIndex - 1]
                  const prevAnswer = answers.find(
                    (a) => a.questionId === prevQ?.id
                  )
                  if (prevAnswer) {
                    setSelectedChoiceId(prevAnswer.choiceId)
                    setSubmitted(true)
                  } else {
                    setSelectedChoiceId(null)
                    setSubmitted(false)
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {!submitted ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedChoiceId || submitAnswer.isPending}
                  className="min-w-[120px]"
                >
                  {submitAnswer.isPending ? "Checking..." : "Submit Answer"}
                </Button>
              ) : currentIndex < totalQuestions - 1 ? (
                <Button onClick={handleNext}>
                  Next Question
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleComplete} disabled={completeAttempt.isPending}>
                  {completeAttempt.isPending ? "Finishing..." : "Finish Quiz"}
                  <Trophy className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Question Dots Navigator */}
            <div className="flex justify-center gap-1.5 mt-8 flex-wrap">
              {questions.map((q, i) => {
                const ans = answers.find((a) => a.questionId === q.id)
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(i)
                      if (ans) {
                        setSelectedChoiceId(ans.choiceId)
                        setSubmitted(true)
                      } else {
                        setSelectedChoiceId(null)
                        setSubmitted(false)
                      }
                    }}
                    className={cn(
                      "h-3 w-3 rounded-full transition-all",
                      i === currentIndex
                        ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-background"
                        : "",
                      ans
                        ? ans.isCorrect
                          ? "bg-green-500"
                          : "bg-red-500"
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
      </div>
    </div>
  )
}
