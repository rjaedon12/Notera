"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useStudySet, useSaveMatchScore } from "@/hooks/useStudy"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { shuffleArray, cn, formatTime } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Trophy, RotateCcw, Clock, Zap } from "lucide-react"

interface PageProps {
  params: Promise<{ setId: string }>
}

interface MatchTile {
  id: string
  content: string
  type: "term" | "definition"
  cardId: string
  isMatched: boolean
  isSelected: boolean
  isWrong: boolean
}

export default function MatchPage({ params }: PageProps) {
  const { setId } = use(params)
  const router = useRouter()
  const { data: set, isLoading } = useStudySet(setId)
  const saveMatchScore = useSaveMatchScore()

  const [tiles, setTiles] = useState<MatchTile[]>([])
  const [selectedTile, setSelectedTile] = useState<MatchTile | null>(null)
  const [matchedPairs, setMatchedPairs] = useState(0)
  const [totalPairs, setTotalPairs] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [bestTime, setBestTime] = useState<number | null>(null)
  const [wrongAttempts, setWrongAttempts] = useState(0)

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRunning && !isComplete) {
      interval = setInterval(() => {
        setTimer((t) => t + 100)
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isRunning, isComplete])

  // Initialize game
  const initGame = useCallback(() => {
    if (!set?.cards) return

    // Take up to 6 cards for a manageable grid
    const selectedCards = shuffleArray([...set.cards]).slice(0, 6)
    setTotalPairs(selectedCards.length)
    setMatchedPairs(0)
    setWrongAttempts(0)

    // Create tiles for terms and definitions
    const termTiles: MatchTile[] = selectedCards.map((card) => ({
      id: `term-${card.id}`,
      content: card.term,
      type: "term",
      cardId: card.id,
      isMatched: false,
      isSelected: false,
      isWrong: false,
    }))

    const defTiles: MatchTile[] = selectedCards.map((card) => ({
      id: `def-${card.id}`,
      content: card.definition,
      type: "definition",
      cardId: card.id,
      isMatched: false,
      isSelected: false,
      isWrong: false,
    }))

    setTiles(shuffleArray([...termTiles, ...defTiles]))
    setSelectedTile(null)
    setTimer(0)
    setIsComplete(false)
    setIsRunning(true)
  }, [set?.cards])

  useEffect(() => {
    if (set?.cards && tiles.length === 0) {
      initGame()
    }
  }, [set, tiles.length, initGame])

  const handleTileClick = async (tile: MatchTile) => {
    if (tile.isMatched || tile.isWrong) return

    if (!selectedTile) {
      // First selection
      setSelectedTile(tile)
      setTiles((prev) =>
        prev.map((t) =>
          t.id === tile.id ? { ...t, isSelected: true } : t
        )
      )
    } else if (selectedTile.id === tile.id) {
      // Deselect
      setSelectedTile(null)
      setTiles((prev) =>
        prev.map((t) =>
          t.id === tile.id ? { ...t, isSelected: false } : t
        )
      )
    } else {
      // Second selection - check match
      const isMatch =
        selectedTile.cardId === tile.cardId &&
        selectedTile.type !== tile.type

      if (isMatch) {
        // Match found!
        setTiles((prev) =>
          prev.map((t) =>
            t.cardId === tile.cardId
              ? { ...t, isMatched: true, isSelected: false }
              : t
          )
        )
        setMatchedPairs((p) => p + 1)
        setSelectedTile(null)

        // Check for completion
        if (matchedPairs + 1 === totalPairs) {
          setIsRunning(false)
          setIsComplete(true)

          // Save score
          try {
            await saveMatchScore.mutateAsync({
              setId,
              time: timer,
            })
          } catch (error) {
            console.error("Failed to save match score:", error)
          }

          // Update best time
          if (!bestTime || timer < bestTime) {
            setBestTime(timer)
          }
        }
      } else {
        // No match - flash wrong
        setWrongAttempts((w) => w + 1)
        setTiles((prev) =>
          prev.map((t) =>
            t.id === selectedTile.id || t.id === tile.id
              ? { ...t, isWrong: true, isSelected: false }
              : t
          )
        )

        setTimeout(() => {
          setTiles((prev) =>
            prev.map((t) =>
              t.id === selectedTile.id || t.id === tile.id
                ? { ...t, isWrong: false }
                : t
            )
          )
        }, 500)

        setSelectedTile(null)
      }
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-12 w-full mb-8" />
        <div className="grid grid-cols-4 gap-4">
          {Array(12)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
        </div>
      </div>
    )
  }

  if (!set || !set.cards || set.cards.length < 4) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Not enough cards</h1>
        <p className="text-muted-foreground mb-4">
          Match mode requires at least 4 cards.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  // Completion Screen
  if (isComplete) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mx-auto mb-6"
        >
          <Trophy className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />
        </motion.div>

        <h1 className="text-2xl font-bold mb-2">Great job!</h1>
        <p className="text-muted-foreground mb-6">You matched all {totalPairs} pairs!</p>

        <div className="bg-muted rounded-xl p-6 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time
            </span>
            <span className="font-bold text-xl">{formatTime(timer)}</span>
          </div>
          {bestTime && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Best time
              </span>
              <span className="font-medium">{formatTime(bestTime)}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Wrong attempts</span>
            <span className="font-medium">{wrongAttempts}</span>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={initGame}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Play Again
          </Button>
          <Button onClick={() => router.push(`/sets/${setId}`)}>Done</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold">{set.title}</h1>
          <p className="text-muted-foreground text-sm">Match terms with definitions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            {matchedPairs} / {totalPairs} matched
          </div>
          <div className="flex items-center gap-2 font-mono text-lg font-bold">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {formatTime(timer)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        <AnimatePresence mode="popLayout">
          {tiles.map((tile) => (
            <motion.button
              key={tile.id}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: tile.isMatched ? 0 : 1,
                opacity: tile.isMatched ? 0 : 1,
              }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={() => handleTileClick(tile)}
              disabled={tile.isMatched}
              className={cn(
                "p-3 min-h-[80px] rounded-xl text-sm font-medium transition-all duration-200",
                "border-2 flex items-center justify-center text-center text-foreground",
                tile.isMatched && "invisible",
                tile.isSelected && "border-blue-500 bg-blue-50 dark:bg-blue-900/20",
                tile.isWrong && "border-red-500 bg-red-50 dark:bg-red-900/20 animate-shake",
                !tile.isSelected &&
                  !tile.isWrong &&
                  tile.type === "term" &&
                  "border-card-study-border bg-card-study hover:border-border",
                !tile.isSelected &&
                  !tile.isWrong &&
                  tile.type === "definition" &&
                  "border-card-study-border bg-card-study hover:border-border"
              )}
            >
              {tile.content}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-center">
        <Button variant="outline" onClick={initGame}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Restart
        </Button>
      </div>
    </div>
  )
}
