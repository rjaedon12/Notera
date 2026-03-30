"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useCallback, useRef, useEffect } from "react"
import {
  RotateCcw, CheckCircle2, XCircle,
  Loader2, Sparkles, BookOpen, ArrowRight, Send
} from "lucide-react"
import { cn } from "@/lib/utils"
import { matchAnswer, type MatchResult } from "@/lib/levenshtein"

interface ReviewCard {
  id: string
  term: string
  definition: string
  setId: string
  setTitle: string
  easeFactor: number
  interval: number
  nextReviewAt: string | null
}

/** Detect if a string contains CJK characters (Chinese, Japanese, Korean). */
function hasCJK(s: string): boolean {
  return /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(s)
}

/** Should this card skip fuzzy matching and go straight to self-rate? */
function shouldSelfRate(card: ReviewCard): boolean {
  return card.definition.length > 80 || hasCJK(card.definition)
}

export default function DailyReviewPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [completed, setCompleted] = useState<string[]>([])
  const [sessionStats, setSessionStats] = useState({ correct: 0, incorrect: 0 })
  const [userAnswer, setUserAnswer] = useState("")
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null)
  const [selfRateMode, setSelfRateMode] = useState(false)

  const { data: rawCards, isLoading } = useQuery({
    queryKey: ["dailyReview"],
    queryFn: async (): Promise<ReviewCard[]> => {
      const res = await fetch("/api/daily-review")
      if (!res.ok) throw new Error("Failed to fetch review cards")
      const json = await res.json()
      const all = [...(json.dueCards ?? []), ...(json.newCards ?? [])]
      return all.map((c: Record<string, unknown>) => ({
        id: c.id as string,
        term: c.term as string,
        definition: c.definition as string,
        setId: (c.setId ?? (c.set as Record<string, unknown>)?.id) as string,
        setTitle: ((c.set as Record<string, unknown>)?.title ?? "") as string,
        easeFactor: ((c.progress as Record<string, unknown>)?.easeFactor ?? 2.5) as number,
        interval: ((c.progress as Record<string, unknown>)?.interval ?? 0) as number,
        nextReviewAt: ((c.progress as Record<string, unknown>)?.nextReviewAt ?? null) as string | null,
      }))
    },
    enabled: !!session,
    retry: false,
  })
  // Snapshot cards on first load so invalidation doesn't reset the list mid-session
  const [cards, setCards] = useState<ReviewCard[]>([])
  useEffect(() => {
    if (rawCards && rawCards.length > 0 && cards.length === 0) {
      setCards(rawCards)
    }
  }, [rawCards, cards.length])
  const dueCards = cards.length > 0 ? cards : (rawCards ?? [])

  // Auto-focus input when a new card appears
  useEffect(() => {
    if (!showAnswer && inputRef.current) {
      inputRef.current.focus()
    }
  }, [currentIndex, showAnswer])

  // Check if current card should suggest self-rate (CJK / long definitions)
  const currentCardNeedsSelfRate = dueCards[currentIndex] ? shouldSelfRate(dueCards[currentIndex]) : false

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

  const handleCheck = useCallback(() => {
    const card = dueCards[currentIndex]
    if (!card || showAnswer) return

    if (selfRateMode) {
      // Skip fuzzy match — just reveal
      setMatchResult(null)
    } else {
      const result = matchAnswer(userAnswer, card.definition)
      setMatchResult(result)
    }
    setShowAnswer(true)
  }, [currentIndex, dueCards, showAnswer, selfRateMode, userAnswer])

  const handleSelfRate = useCallback(() => {
    setSelfRateMode(true)
    setShowAnswer(true)
    setMatchResult(null)
  }, [])

  const handleRate = useCallback((quality: number) => {
    const card = dueCards[currentIndex]
    if (!card || completed.includes(card.id)) return

    reviewMutation.mutate({ cardId: card.id, quality })

    const newCompleted = [...completed, card.id]
    setCompleted(newCompleted)
    setSessionStats(prev => ({
      correct: prev.correct + (quality >= 3 ? 1 : 0),
      incorrect: prev.incorrect + (quality < 3 ? 1 : 0),
    }))

    if (newCompleted.length >= dueCards.length) {
      setShowAnswer(false)
      setUserAnswer("")
      setMatchResult(null)
      setSelfRateMode(false)
      return
    }

    // Move to next un-reviewed card
    setShowAnswer(false)
    setUserAnswer("")
    setMatchResult(null)
    setSelfRateMode(false)
    let nextIdx = currentIndex + 1
    while (nextIdx < dueCards.length && newCompleted.includes(dueCards[nextIdx].id)) {
      nextIdx++
    }
    if (nextIdx < dueCards.length) {
      setCurrentIndex(nextIdx)
    }
  }, [currentIndex, dueCards, reviewMutation, completed])

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
  const isCorrect = matchResult === "exact" || matchResult === "close"

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading">Daily Review</h1>
          <p className="text-muted-foreground mt-1">
            {remainingCards.length} card{remainingCards.length !== 1 ? "s" : ""} remaining
          </p>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          {completed.length + 1} / {dueCards.length}
        </div>
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
          className={cn(
            "rounded-2xl border p-8 min-h-[300px] flex flex-col items-center justify-center select-none transition-all duration-300",
            showAnswer && matchResult !== null && isCorrect && "ring-2 ring-green-500/40",
            showAnswer && matchResult !== null && !isCorrect && "ring-2 ring-red-500/40",
          )}
          style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
        >
          <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">
            {currentCard.setTitle}
          </p>

          {!showAnswer ? (
            <>
              <p className="text-xl font-semibold text-foreground text-center mb-6">{currentCard.term}</p>

              {/* Answer input */}
              <div className="w-full max-w-sm space-y-3">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && userAnswer.trim()) handleCheck()
                    }}
                    placeholder="Type the definition..."
                    className="w-full px-4 py-3 pr-12 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary)]"
                    style={{
                      borderColor: "var(--glass-border)",
                      background: "var(--glass-fill)",
                      color: "var(--foreground)",
                    }}

                  />
                  <button
                    onClick={handleCheck}
                    disabled={!userAnswer.trim() && !selfRateMode}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all disabled:opacity-30"
                    style={{ color: "var(--primary)" }}
                    title="Check answer"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleCheck}
                    disabled={!userAnswer.trim() && !selfRateMode}
                    className="px-5 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
                    style={{ background: "var(--primary)" }}
                  >
                    {selfRateMode ? "Reveal Answer" : "Check"}
                  </button>
                  {!selfRateMode && (
                    <button
                      onClick={handleSelfRate}
                      className={cn("text-xs transition-all hover:underline", currentCardNeedsSelfRate && "font-medium")}
                      style={{ color: currentCardNeedsSelfRate ? "var(--primary)" : "var(--muted-foreground)" }}
                    >
                      {currentCardNeedsSelfRate ? "Skip typing — I\u2019ll self-rate" : "I\u2019ll self-rate this one"}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="w-full space-y-4 animate-[fadeIn_0.3s_ease-out]">
              {/* User's answer feedback (only if they typed) */}
              {matchResult !== null && (
                <div className={cn(
                  "rounded-xl px-4 py-3 text-center text-sm font-medium",
                  isCorrect ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400",
                )}>
                  {isCorrect
                    ? matchResult === "exact" ? "Correct!" : "Close enough!"
                    : "Not quite"}
                  <span className="block text-xs mt-0.5 opacity-70">
                    Your answer: {userAnswer}
                  </span>
                </div>
              )}

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Term</p>
                <p className="text-lg font-medium text-foreground">{currentCard.term}</p>
              </div>

              <div className="w-16 h-px mx-auto" style={{ background: "var(--glass-border)" }} />

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Definition</p>
                <p className={cn(
                  "text-lg rounded-xl px-4 py-2 inline-block",
                  matchResult !== null && isCorrect && "bg-green-500/10 text-green-700 dark:text-green-300",
                  matchResult !== null && !isCorrect && "bg-red-500/10 text-red-700 dark:text-red-300",
                  matchResult === null && "text-foreground",
                )}>
                  {currentCard.definition}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rating buttons */}
      {showAnswer && currentCard && (
        <div className="space-y-3 animate-[fadeIn_0.3s_ease-out_0.1s_both]">
          <p className="text-sm text-muted-foreground text-center">
            {matchResult !== null
              ? isCorrect ? "Nice recall! How easy was it?" : "How well did you actually know this?"
              : "How well did you know this?"}
          </p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRate(1)}
              disabled={reviewMutation.isPending}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50",
                matchResult !== null && !isCorrect && !selfRateMode && "ring-2 ring-red-500/50 scale-[1.02]",
              )}
              style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
            >
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="text-foreground">Forgot</span>
              {matchResult !== null && !isCorrect && !selfRateMode && (
                <span className="text-[10px] text-red-500 -mt-0.5">Suggested</span>
              )}
            </button>
            <button
              onClick={() => handleRate(3)}
              disabled={reviewMutation.isPending}
              className="flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50"
              style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
            >
              <RotateCcw className="h-5 w-5 text-yellow-500" />
              <span className="text-foreground">Hard</span>
            </button>
            <button
              onClick={() => handleRate(5)}
              disabled={reviewMutation.isPending}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-3 rounded-xl border text-sm font-medium transition-all hover:scale-[1.02] disabled:opacity-50",
                matchResult !== null && isCorrect && !selfRateMode && "ring-2 ring-green-500/50 scale-[1.02]",
              )}
              style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
            >
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-foreground">Easy</span>
              {matchResult !== null && isCorrect && !selfRateMode && (
                <span className="text-[10px] text-green-500 -mt-0.5">Suggested</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
