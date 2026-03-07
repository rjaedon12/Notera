"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useCallback } from "react"
import {
  Brain, RotateCcw, CheckCircle2, XCircle, ChevronRight,
  Loader2, Sparkles, BookOpen, ArrowRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface ReviewCard {
  id: string
  term: string
  definition: string
  setId: string
  setTitle: string
  easeFactor: number
  interval: number
  nextReviewAt: string
}

export default function DailyReviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 })

  const { data: dueCards = [], isLoading } = useQuery<ReviewCard[]>({
    queryKey: ["dailyReview"],
    queryFn: async () => {
      const res = await fetch("/api/daily-review")
      if (!res.ok) throw new Error("Failed to fetch review cards")
      return res.json()
    },
    enabled: !!session,
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ cardId, quality }: { cardId: string; quality: number }) => {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, quality }),
      })
      if (!res.ok) throw new Error("Failed to submit review")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyReview"] })
    },
  })

  const handleRate = useCallback((quality: number) => {
    const card = dueCards[currentIndex]
    if (!card) return

    reviewMutation.mutate({ cardId: card.id, quality })
    setCompleted(prev => [...prev, card.id])
    setSessionStats(prev => ({
      correct: prev.correct + (quality >= 3 ? 1 : 0),
      incorrect: prev.incorrect + (quality < 3 ? 1 : 0),
    }))
    setShowAnswer(false)

    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, dueCards, reviewMutation])

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const remainingCards = dueCards.filter(c => !completed.includes(c.id))
  const isFinished = completed.length >= dueCards.length && dueCards.length > 0
  const currentCard = dueCards[currentIndex]

  // Completion screen
  if (isFinished) {
    const accuracy = sessionStats.correct + sessionStats.incorrect > 0
      ? Math.round((sessionStats.correct / (sessionStats.correct + sessionStats.incorrect)) * 100)
      : 0

    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border p-10" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
          <Sparkles className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-3 font-heading">Review Complete!</h1>
          <p className="text-muted-foreground mb-8">Great job finishing your daily review session.</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl p-4" style={{ background: "var(--glass-fill)" }}>
              <p className="text-2xl font-bold text-foreground">{completed.length}</p>
              <p className="text-sm text-muted-foreground">Cards Reviewed</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--glass-fill)" }}>
              <p className="text-2xl font-bold text-green-500">{sessionStats.correct}</p>
              <p className="text-sm text-muted-foreground">Correct</p>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--glass-fill)" }}>
              <p className="text-2xl font-bold text-foreground">{accuracy}%</p>
              <p className="text-sm text-muted-foreground">Accuracy</p>
            </div>
          </div>

          <button
            onClick={() => router.push("/library")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "var(--primary)" }}
          >
            Back to Library <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (dueCards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="rounded-2xl border p-10" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-foreground mb-3 font-heading">All Caught Up!</h1>
          <p className="text-muted-foreground mb-6">No cards are due for review right now. Check back later!</p>
          <button
            onClick={() => router.push("/library")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium text-white transition-all"
            style={{ background: "var(--primary)" }}
          >
            <BookOpen className="h-4 w-4" /> Study More Cards
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-heading">Daily Review</h1>
        <p className="text-muted-foreground mt-1">
          {remainingCards.length} card{remainingCards.length !== 1 ? "s" : ""} due for review
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full" style={{ background: "var(--glass-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(completed.length / dueCards.length) * 100}%`,
            background: "var(--primary)",
          }}
        />
      </div>

      {/* Card */}
      {currentCard && (
        <div
          className="rounded-2xl border p-8 min-h-[300px] flex flex-col items-center justify-center cursor-pointer select-none"
          style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
          onClick={() => !showAnswer && setShowAnswer(true)}
        >
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
            {currentCard.setTitle}
          </p>

          {!showAnswer ? (
            <>
              <p className="text-xl font-semibold text-foreground text-center mb-6">{currentCard.term}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                Tap to reveal <ChevronRight className="h-4 w-4" />
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">Term</p>
              <p className="text-lg font-medium text-foreground text-center mb-4">{currentCard.term}</p>
              <div className="w-16 h-px my-2" style={{ background: "var(--glass-border)" }} />
              <p className="text-sm text-muted-foreground mb-2 mt-2">Definition</p>
              <p className="text-lg text-foreground text-center">{currentCard.definition}</p>
            </>
          )}
        </div>
      )}

      {/* Rating buttons */}
      {showAnswer && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">How well did you know this?</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRate(1)}
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
            >
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-foreground">Forgot</span>
            </button>
            <button
              onClick={() => handleRate(3)}
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
            >
              <RotateCcw className="h-5 w-5 text-yellow-500" />
              <span className="text-foreground">Hard</span>
            </button>
            <button
              onClick={() => handleRate(5)}
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02]"
              style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
            >
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-foreground">Easy</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
