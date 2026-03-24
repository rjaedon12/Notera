"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useStudySet } from "@/hooks/useStudy"
import { StudyHeader } from "@/components/study/study-controls"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle, RotateCcw } from "lucide-react"

interface PageProps {
  params: Promise<{ setId: string }>
}

interface SRSCardItem {
  flashcard: { id: string; front: string; back: string }
  progress: {
    id: string
    userId: string
    flashcardId: string
    due: string
    stability: number
    difficulty: number
    elapsedDays: number
    scheduledDays: number
    reps: number
    lapses: number
    state: number
    lastReview: string | null
  } | null
}

type RatingValue = 1 | 2 | 3 | 4

const RATING_CONFIG: {
  value: RatingValue
  label: string
  color: string
  bgColor: string
  hoverColor: string
}[] = [
  { value: 1, label: "Again", color: "text-red-400", bgColor: "bg-red-500/15 border-red-500/30", hoverColor: "hover:bg-red-500/25" },
  { value: 2, label: "Hard", color: "text-orange-400", bgColor: "bg-orange-500/15 border-orange-500/30", hoverColor: "hover:bg-orange-500/25" },
  { value: 3, label: "Good", color: "text-green-400", bgColor: "bg-green-500/15 border-green-500/30", hoverColor: "hover:bg-green-500/25" },
  { value: 4, label: "Easy", color: "text-[#C8FF57]", bgColor: "bg-[#C8FF57]/15 border-[#C8FF57]/30", hoverColor: "hover:bg-[#C8FF57]/25" },
]

export default function LearnPage({ params }: PageProps) {
  const { setId } = use(params)
  const router = useRouter()
  const { data: set, isLoading: isSetLoading } = useStudySet(setId)

  const [queue, setQueue] = useState<SRSCardItem[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Rating breakdown tracking
  const [ratingCounts, setRatingCounts] = useState<Record<RatingValue, number>>({
    1: 0, 2: 0, 3: 0, 4: 0,
  })
  const totalReviewed = ratingCounts[1] + ratingCounts[2] + ratingCounts[3] + ratingCounts[4]

  const fetchDueCards = useCallback(async () => {
    setIsLoadingCards(true)
    setFetchError(null)
    try {
      const res = await fetch(`/api/srs/due?setId=${setId}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to fetch cards")
      }
      const data: { cards: SRSCardItem[] } = await res.json()
      setQueue(data.cards)
      setCurrentIndex(0)
      setIsRevealed(false)
      if (data.cards.length === 0) {
        setIsComplete(true)
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load cards")
    } finally {
      setIsLoadingCards(false)
    }
  }, [setId])

  useEffect(() => {
    fetchDueCards()
  }, [fetchDueCards])

  const handleReveal = () => {
    setIsRevealed(true)
  }

  const handleRate = async (rating: RatingValue) => {
    if (isSubmitting) return
    const currentCard = queue[currentIndex]
    if (!currentCard) return

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/srs/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flashcardId: currentCard.flashcard.id,
          rating,
        }),
      })
      if (!res.ok) {
        console.error("Failed to submit review")
      }
    } catch (err) {
      console.error("Review submission error:", err)
    } finally {
      setIsSubmitting(false)
    }

    // Track the rating
    setRatingCounts((prev) => ({ ...prev, [rating]: prev[rating] + 1 }))

    // Advance to next card or complete
    if (currentIndex >= queue.length - 1) {
      setIsComplete(true)
    } else {
      setCurrentIndex((i) => i + 1)
      setIsRevealed(false)
    }
  }

  const handleRestart = () => {
    setRatingCounts({ 1: 0, 2: 0, 3: 0, 4: 0 })
    setIsComplete(false)
    fetchDueCards()
  }

  // --- Loading state ---
  if (isSetLoading || isLoadingCards) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0C0C0E] flex flex-col">
        <div className="flex items-center justify-between py-4 px-4 border-b border-border">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl px-4 space-y-6">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // --- Error state ---
  if (fetchError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0C0C0E] flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-card border border-border">
          <CardContent className="p-8 text-center">
            <p className="text-red-400 mb-4">{fetchError}</p>
            <Button onClick={() => router.push(`/sets/${setId}`)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Completion screen ---
  if (isComplete) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0C0C0E] flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-card border border-border">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-[#C8FF57]/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-[#C8FF57]" />
            </div>
            <h1
              className="text-2xl mb-2 text-white"
              style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}
            >
              Session Complete!
            </h1>
            <p className="text-muted-foreground mb-6">
              {totalReviewed === 0
                ? "No cards were due for review. Check back later!"
                : `You reviewed ${totalReviewed} card${totalReviewed !== 1 ? "s" : ""}.`}
            </p>

            {totalReviewed > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-6">
                {RATING_CONFIG.map(({ value, label, color }) => (
                  <div key={value} className="text-center">
                    <div className={`text-xl font-bold ${color}`}>
                      {ratingCounts[value]}
                    </div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleRestart}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Study Again
              </Button>
              <Button
                className="flex-1 bg-[#C8FF57] text-black hover:bg-[#C8FF57]/90"
                onClick={() => router.push(`/sets/${setId}`)}
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- No cards in set ---
  if (!set || queue.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-[#0C0C0E] flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-card border border-border">
          <CardContent className="p-8 text-center">
            <h1
              className="text-2xl mb-4 text-white"
              style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}
            >
              All caught up!
            </h1>
            <p className="text-muted-foreground mb-4">
              No cards are due for review right now. Come back later!
            </p>
            <Button onClick={() => router.push(`/sets/${setId}`)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Active review ---
  const currentCard = queue[currentIndex]
  const progressPct = queue.length > 0 ? ((currentIndex) / queue.length) * 100 : 0

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#0C0C0E] flex flex-col">
      <StudyHeader
        title={set?.title ?? "Learn"}
        currentIndex={currentIndex}
        totalCards={queue.length}
        setId={setId}
        mode="learn"
      />

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-muted">
        <div
          className="h-full bg-[#C8FF57] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Card position indicator */}
        <p
          className="text-sm text-muted-foreground mb-4"
          style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}
        >
          Card {currentIndex + 1} of {queue.length}
        </p>

        {/* Flashcard surface */}
        <Card className="w-full max-w-2xl bg-card border border-border">
          <CardContent className="p-8 min-h-[280px] flex flex-col items-center justify-center">
            {/* Front (term) */}
            <p
              className="text-xs uppercase tracking-wider text-muted-foreground mb-3"
              style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}
            >
              Term
            </p>
            <p
              className="text-2xl text-center text-white leading-relaxed"
              style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic" }}
            >
              {currentCard.flashcard.front}
            </p>

            {/* Divider + Back (definition) */}
            {isRevealed && (
              <>
                <div className="w-full border-t border-border my-6" />
                <p
                  className="text-xs uppercase tracking-wider text-muted-foreground mb-3"
                  style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}
                >
                  Definition
                </p>
                <p
                  className="text-xl text-center text-white/90 leading-relaxed"
                  style={{ fontFamily: "Instrument Serif, serif", fontStyle: "italic" }}
                >
                  {currentCard.flashcard.back}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="w-full max-w-2xl mt-6">
          {!isRevealed ? (
            <Button
              onClick={handleReveal}
              className="w-full h-14 text-lg bg-[#C8FF57] text-black hover:bg-[#C8FF57]/90"
              style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}
            >
              Show Answer
            </Button>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {RATING_CONFIG.map(({ value, label, bgColor, hoverColor, color }) => (
                <button
                  key={value}
                  onClick={() => handleRate(value)}
                  disabled={isSubmitting}
                  className={`
                    h-14 rounded-lg border transition-colors
                    ${bgColor} ${hoverColor}
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex flex-col items-center justify-center
                  `}
                  style={{ fontFamily: "DM Sans, sans-serif", fontWeight: 600 }}
                >
                  <span className={`text-sm ${color}`}>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
