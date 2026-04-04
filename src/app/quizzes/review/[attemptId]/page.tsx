"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LatexRenderer } from "@/components/studyguide/LatexRenderer"

interface Choice {
  id: string
  text: string
  isCorrect: boolean
  orderIndex: number
}

interface Question {
  id: string
  prompt: string
  imageUrl?: string | null
  passage?: string | null
  explanation: string
  type: "MULTIPLE_CHOICE" | "OPEN_RESPONSE"
  pointValue: number
  exampleAnswer?: string | null
  choices: Choice[]
}

interface AttemptAnswer {
  id: string
  isCorrect: boolean
  openResponseText?: string | null
  pointsEarned: number
  questionId: string
  choiceId?: string | null
  question: Question
  choice?: Choice | null
}

interface AttemptData {
  id: string
  score: number | null
  completedAt: string | null
  startedAt: string
  bank: { id: string; title: string; subject: string | null }
  answers: AttemptAnswer[]
}

function useAttemptReview(attemptId: string) {
  return useQuery<AttemptData>({
    queryKey: ["attemptReview", attemptId],
    queryFn: async () => {
      const res = await fetch(`/api/quizzes/attempts/${encodeURIComponent(attemptId)}`)
      if (!res.ok) throw new Error("Failed to load attempt")
      return res.json()
    },
  })
}

export default function ReviewAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = use(params)
  const router = useRouter()
  const { data: attempt, isLoading, error } = useAttemptReview(attemptId)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-muted-foreground">Loading review…</div>
      </div>
    )
  }

  if (error || !attempt) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <div className="text-destructive">Failed to load attempt data.</div>
        <Button variant="outline" onClick={() => router.push("/quizzes?tab=history")}>
          <Home className="h-4 w-4 mr-1" />
          Back to History
        </Button>
      </div>
    )
  }

  const answers = attempt.answers
  const totalQuestions = answers.length
  const currentAnswer = answers[currentIndex]
  const question = currentAnswer?.question

  if (!question) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <div className="text-muted-foreground">No questions found in this attempt.</div>
        <Button variant="outline" onClick={() => router.push("/quizzes?tab=history")}>
          <Home className="h-4 w-4 mr-1" />
          Back to History
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-background border-b border-border px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-sm font-medium">{attempt.bank.title}</h1>
            <span className="text-sm text-muted-foreground">
              Reviewing Question {currentIndex + 1} of {totalQuestions}
              <span className="ml-2 text-xs">
                ({question.pointValue ?? 1} pt{(question.pointValue ?? 1) !== 1 ? "s" : ""})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {attempt.score != null && (
              <span
                className={cn(
                  "text-lg font-bold",
                  attempt.score >= 70
                    ? "text-green-600 dark:text-green-400"
                    : attempt.score >= 50
                    ? "text-yellow-600 dark:text-yellow-400"
                    : "text-red-600 dark:text-red-400"
                )}
              >
                {Math.round(attempt.score)}%
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/quizzes?tab=history")}
            >
              <Home className="h-4 w-4 mr-1" />
              Back to History
            </Button>
          </div>
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

      {/* Content */}
      <div className="flex-1 flex">
        {/* Left Panel — Question */}
        <div className="w-1/2 border-r border-border p-8 overflow-y-auto">
          <div className="max-w-lg mx-auto">
            {question.passage && (
              <div className="bg-muted/50 p-4 rounded-lg mb-6 text-sm leading-relaxed italic">
                <LatexRenderer content={question.passage} className="block" />
              </div>
            )}
            {question.imageUrl && (
              <img
                src={question.imageUrl}
                alt="Question"
                className="max-h-48 rounded-lg border mb-6"
              />
            )}
            <h2 className="text-xl font-semibold leading-relaxed">
              <LatexRenderer content={question.prompt} className="block" />
            </h2>
          </div>
        </div>

        {/* Right Panel — Answers */}
        <div className="w-1/2 p-8 overflow-y-auto">
          <div className="max-w-lg mx-auto space-y-3">
            {question.type === "OPEN_RESPONSE" ? (
              <>
                <div className="text-sm font-medium text-muted-foreground mb-2">Your Response</div>
                <div
                  className="p-4 rounded-lg border bg-muted/30 text-sm prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: currentAnswer.openResponseText || "<em>No response</em>" }}
                />
                {question.exampleAnswer && (
                  <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="text-sm font-semibold text-green-700 dark:text-green-400 mb-1">
                      Example Answer
                    </div>
                    <div className="text-sm leading-relaxed">
                      <LatexRenderer content={question.exampleAnswer} className="block" />
                    </div>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Points: {currentAnswer.pointsEarned} / {question.pointValue}
                </div>
              </>
            ) : (
              question.choices.map((choice, ci) => {
                const isSelected = currentAnswer.choiceId === choice.id
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
                <LatexRenderer content={question.explanation ?? ""} className="block" />
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
                <Button onClick={() => router.push("/quizzes?tab=history")}>
                  Back to History
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
