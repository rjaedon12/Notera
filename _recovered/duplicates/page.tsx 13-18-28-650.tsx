"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useStudySet, useUpdateProgress, useToggleStar } from "@/hooks/useStudy"
import { FlipCard } from "@/components/study/flip-card"
import { StudyHeader, FlashcardControls, ProgressRating } from "@/components/study/study-controls"
import { Skeleton } from "@/components/ui/skeleton"
import { shuffleArray, getHint, speakText } from "@/lib/utils"
import { Card } from "@/types"

interface PageProps {
  params: Promise<{ setId: string }>
}

export default function FlashcardsPage({ params }: PageProps) {
  const { setId } = use(params)
  const { data: set, isLoading } = useStudySet(setId)
  const updateProgress = useUpdateProgress()
  const toggleStar = useToggleStar()

  const [cards, setCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [trackProgress, setTrackProgress] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [hint, setHint] = useState("")

  // Initialize cards
  useEffect(() => {
    if (set?.cards) {
      setCards([...set.cards])
    }
  }, [set])

  const currentCard = cards[currentIndex]

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        goToPrevious()
      } else if (e.key === "ArrowRight") {
        goToNext()
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault()
        handleFlip()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, cards.length, isFlipped])

  // Autoplay
  useEffect(() => {
    if (!isPlaying || !currentCard) return

    const timer = setInterval(() => {
      if (!isFlipped) {
        setIsFlipped(true)
      } else {
        if (currentIndex < cards.length - 1) {
          setCurrentIndex(currentIndex + 1)
          setIsFlipped(false)
          setShowHint(false)
        } else {
          setIsPlaying(false)
        }
      }
    }, 3000)

    return () => clearInterval(timer)
  }, [isPlaying, isFlipped, currentIndex, cards.length, currentCard])

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
    if (!isFlipped && trackProgress) {
      setShowRating(true)
    }
  }

  const goToNext = useCallback(() => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setIsFlipped(false)
      setShowRating(false)
      setShowHint(false)
    }
  }, [currentIndex, cards.length])

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setIsFlipped(false)
      setShowRating(false)
      setShowHint(false)
    }
  }, [currentIndex])

  const handleShuffle = () => {
    if (isShuffled) {
      setCards(set?.cards || [])
    } else {
      setCards(shuffleArray(cards))
    }
    setIsShuffled(!isShuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
    setShowRating(false)
    setShowHint(false)
  }

  const handleSpeak = () => {
    if (currentCard) {
      speakText(isFlipped ? currentCard.definition : currentCard.term)
    }
  }

  const handleStar = async () => {
    if (currentCard) {
      try {
        await toggleStar.mutateAsync({ 
          cardId: currentCard.id, 
          starred: !currentCard.isStarred 
        })
        // Update local state
        setCards(cards.map(c => 
          c.id === currentCard.id 
            ? { ...c, isStarred: !c.isStarred } 
            : c
        ))
      } catch (error) {
        console.error("Failed to star card:", error)
      }
    }
  }

  const handleHint = () => {
    if (currentCard && !isFlipped) {
      setHint(getHint(currentCard.definition))
      setShowHint(true)
    }
  }

  const handleRate = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (currentCard) {
      const correct = rating === 'good' || rating === 'easy'
      try {
        await updateProgress.mutateAsync({ cardId: currentCard.id, correct })
      } catch (error) {
        console.error("Failed to update progress:", error)
      }
    }
    setShowRating(false)
    goToNext()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-12 w-full mb-8" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    )
  }

  if (!set || !currentCard) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No cards found</h1>
        <p className="text-muted-foreground">This set doesn't have any cards yet.</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <StudyHeader
        title={set.title}
        currentIndex={currentIndex}
        totalCards={cards.length}
        setId={setId}
        mode="flashcards"
      />

      <div className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        {/* Flashcard */}
        <div className="mb-6">
          <FlipCard
            front={currentCard.term}
            back={currentCard.definition}
            isFlipped={isFlipped}
            onFlip={handleFlip}
          />
        </div>

        {/* Rating (when track progress is on) */}
        {showRating && trackProgress && (
          <ProgressRating onRate={handleRate} />
        )}

        {/* Controls */}
        <FlashcardControls
          onPrevious={goToPrevious}
          onNext={goToNext}
          onFlip={handleFlip}
          onShuffle={handleShuffle}
          onSpeak={handleSpeak}
          onStar={handleStar}
          onHint={handleHint}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          trackProgress={trackProgress}
          onToggleTrackProgress={setTrackProgress}
          isStarred={currentCard.isStarred || false}
          canGoPrevious={currentIndex > 0}
          canGoNext={currentIndex < cards.length - 1}
          showHint={showHint}
          hint={hint}
        />
      </div>
    </div>
  )
}
