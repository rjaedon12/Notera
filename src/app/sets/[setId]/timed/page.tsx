"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useStudySet, useSaveTimedScore } from "@/hooks/useStudy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { shuffleArray, cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Zap, Trophy, RotateCcw, Clock, Flame, XCircle } from "lucide-react"
import { Card as CardType } from "@/types"

interface PageProps {
  params: Promise<{ setId: string }>
}

interface TimedQuestion {
  card: CardType
  promptType: "term" | "definition"
}

export default function TimedPage({ params }: PageProps) {
  const { setId } = use(params)
  const router = useRouter()
  const { data: set, isLoading } = useStudySet(setId)
  const saveTimedScore = useSaveTimedScore()

  // Game state
  const [isStarted, setIsStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [maxStreak, setMaxStreak] = useState(0)
  const [questions, setQuestions] = useState<TimedQuestion[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState("")
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null)
  const [wrongCards, setWrongCards] = useState<CardType[]>([])

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isStarted && !isComplete && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            setIsComplete(true)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isStarted, isComplete, timeLeft])

  // Save score when complete
  useEffect(() => {
    if (isComplete) {
      saveTimedScore
        .mutateAsync({
          setId,
          score,
          mode: "blast",
        })
        .catch((error) => {
          console.error("Failed to save timed score:", error)
        })
    }
  }, [isComplete, score, maxStreak, setId, saveTimedScore])

  // Generate questions
  const initGame = useCallback(() => {
    if (!set?.cards) return

    // Generate a large pool of questions (cycle through cards multiple times)
    const pool: TimedQuestion[] = []
    const promptTypes: ("term" | "definition")[] = ["term", "definition"]

    for (let i = 0; i < 3; i++) {
      for (const card of set.cards) {
        const promptType = promptTypes[Math.floor(Math.random() * 2)]
        pool.push({ card, promptType })
      }
    }

    setQuestions(shuffleArray(pool))
    setCurrentIndex(0)
    setScore(0)
    setStreak(0)
    setMaxStreak(0)
    setTimeLeft(60)
    setIsStarted(true)
    setIsComplete(false)
    setAnswer("")
    setShowResult(null)
    setWrongCards([])
  }, [set?.cards])

  const currentQuestion = questions[currentIndex]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentQuestion || showResult) return

    const correctAnswer =
      currentQuestion.promptType === "term"
        ? currentQuestion.card.definition
        : currentQuestion.card.term

    const isCorrect =
      answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()

    setShowResult(isCorrect ? "correct" : "wrong")

    if (isCorrect) {
      const points = Math.min(10 + streak * 2, 50) // Max 50 points per answer
      setScore((s) => s + points)
      setStreak((s) => {
        const newStreak = s + 1
        if (newStreak > maxStreak) setMaxStreak(newStreak)
        return newStreak
      })
      setTimeLeft((t) => Math.min(t + 2, 90)) // Bonus time, max 90 seconds
    } else {
      setStreak(0)
      setWrongCards((prev) => [...prev, currentQuestion.card])
    }

    // Move to next question after delay
    setTimeout(() => {
      setShowResult(null)
      setAnswer("")
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex((i) => i + 1)
      } else {
        // Recycle questions
        setQuestions(shuffleArray([...questions]))
        setCurrentIndex(0)
      }
    }, 500)
  }

  const handleSkip = () => {
    if (!currentQuestion) return
    setStreak(0)
    setWrongCards((prev) => [...prev, currentQuestion.card])
    setAnswer("")
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1)
    } else {
      setQuestions(shuffleArray([...questions]))
      setCurrentIndex(0)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Skeleton className="h-12 w-full mb-8" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    )
  }

  if (!set || !set.cards || set.cards.length < 4) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Not enough cards</h1>
        <p className="text-muted-foreground mb-4">
          Timed mode requires at least 4 cards.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  // Start Screen
  if (!isStarted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6"
        >
          <Zap className="h-10 w-10 text-orange-600" />
        </motion.div>

        <h1 className="text-2xl font-bold mb-2">Blast Mode</h1>
        <p className="text-muted-foreground mb-6">
          Answer as many questions as you can before time runs out! Build
          streaks for bonus points.
        </p>

        <div className="bg-muted rounded-xl p-6 mb-6 text-left space-y-3">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span>60 seconds</span>
          </div>
          <div className="flex items-center gap-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <span>Streaks multiply points</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Correct answers add +2 seconds</span>
          </div>
        </div>

        <Button onClick={initGame} size="lg" className="gap-2">
          <Zap className="h-5 w-5" />
          Start Blast
        </Button>
      </div>
    )
  }

  // Results Screen
  if (isComplete) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-6"
        >
          <Trophy className="h-10 w-10 text-yellow-600" />
        </motion.div>

        <h1 className="text-2xl font-bold mb-2">Time's Up!</h1>
        <p className="text-5xl font-bold text-orange-600 mb-2">{score}</p>
        <p className="text-muted-foreground mb-6">points</p>

        <div className="bg-muted rounded-xl p-6 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-2">
              <Flame className="h-4 w-4" />
              Max streak
            </span>
            <span className="font-bold text-xl">{maxStreak}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Questions answered</span>
            <span className="font-medium">{currentIndex}</span>
          </div>
          {wrongCards.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Missed
              </span>
              <span className="font-medium text-red-600">
                {wrongCards.length}
              </span>
            </div>
          )}
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

  // Game Screen
  const prompt =
    currentQuestion?.promptType === "term"
      ? currentQuestion.card.term
      : currentQuestion?.card.definition

  return (
    <div className="container mx-auto px-4 py-8 max-w-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="text-3xl font-bold">{score}</div>
          {streak > 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full text-orange-600 text-sm font-medium"
            >
              <Flame className="h-4 w-4" />
              {streak}x
            </motion.div>
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-2 text-2xl font-mono font-bold",
            timeLeft <= 10 && "text-red-600 animate-pulse"
          )}
        >
          <Clock className="h-5 w-5" />
          {timeLeft}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-orange-500"
          initial={{ width: "100%" }}
          animate={{ width: `${(timeLeft / 60) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "bg-white rounded-xl border-2 p-6 mb-6 text-center",
            showResult === "correct" && "border-green-500 bg-green-50",
            showResult === "wrong" && "border-red-500 bg-red-50"
          )}
        >
          <p className="text-xs text-muted-foreground uppercase mb-2">
            {currentQuestion?.promptType === "term" ? "Term" : "Definition"}
          </p>
          <p className="text-xl font-medium">{prompt}</p>
        </motion.div>
      </AnimatePresence>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          autoFocus
          placeholder="Type your answer..."
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={!!showResult}
          className="text-lg py-6"
        />
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleSkip}
            disabled={!!showResult}
            className="flex-1"
          >
            Skip
          </Button>
          <Button type="submit" disabled={!answer.trim() || !!showResult} className="flex-1">
            Submit
          </Button>
        </div>
      </form>
    </div>
  )
}
