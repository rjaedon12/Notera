"use client"

import { use, useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useStudySet, useUpdateProgress, useSaveSession, useCardProgress } from "@/hooks/useStudy"
import { MultipleChoice } from "@/components/study/multiple-choice"
import { StudyHeader } from "@/components/study/study-controls"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { shuffleArray } from "@/lib/utils"
import { Card as CardType } from "@/types"
import { CheckCircle, XCircle, Clock, ArrowRight, RotateCcw } from "lucide-react"

interface PageProps {
  params: Promise<{ setId: string }>
}

interface Question {
  id: string
  card: CardType
  promptType: "term" | "definition"
  options: string[]
  correctAnswer: string
}

export default function LearnPage({ params }: PageProps) {
  const { setId } = use(params)
  const router = useRouter()
  const { data: set, isLoading } = useStudySet(setId)
  const { data: progressData } = useCardProgress(setId)
  const updateProgress = useUpdateProgress()
  const saveSession = useSaveSession()

  const [promptType, setPromptType] = useState<"term" | "definition">("term")
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const [startTime] = useState(Date.now())
  const [isComplete, setIsComplete] = useState(false)
  const [weakestCards, setWeakestCards] = useState<string[]>([])

  // Generate questions based on cards and progress
  const generateQuestions = useMemo(() => {
    if (!set?.cards || set.cards.length < 4) return []

    // Sort cards by mastery level (lowest first)
    const sortedCards = [...set.cards].sort((a, b) => {
      const progressA = progressData?.[a.id]?.masteryLevel ?? 0
      const progressB = progressData?.[b.id]?.masteryLevel ?? 0
      return progressA - progressB
    })

    // Take more cards from weaker areas
    const prioritizedCards = [...sortedCards]

    return prioritizedCards.map((card) => {
      // Generate wrong options
      const otherCards = (set.cards || []).filter((c) => c.id !== card.id)
      const wrongOptions = shuffleArray(otherCards)
        .slice(0, 3)
        .map((c) => (promptType === "term" ? c.definition : c.term))

      const correctAnswer = promptType === "term" ? card.definition : card.term
      const options = shuffleArray([correctAnswer, ...wrongOptions])

      return {
        id: card.id,
        card,
        promptType,
        options,
        correctAnswer,
      }
    })
  }, [set?.cards, progressData, promptType])

  useEffect(() => {
    if (generateQuestions.length > 0) {
      setQuestions(shuffleArray(generateQuestions))
    }
  }, [generateQuestions])

  const currentQuestion = questions[currentIndex]
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0

  const handleSelect = async (answer: string) => {
    if (showResult) return
    setSelectedAnswer(answer)
    setShowResult(true)

    const isCorrect = answer === currentQuestion.correctAnswer

    if (isCorrect) {
      setCorrectCount((c) => c + 1)
    } else {
      setIncorrectCount((c) => c + 1)
      setWeakestCards((prev) => [...prev, currentQuestion.card.term])
    }

    // Update progress
    try {
      await updateProgress.mutateAsync({
        cardId: currentQuestion.id,
        correct: isCorrect,
      })
    } catch (error) {
      console.error("Failed to update progress:", error)
    }
  }

  const handleDontKnow = async () => {
    setSelectedAnswer("")
    setShowResult(true)
    setIncorrectCount((c) => c + 1)
    setWeakestCards((prev) => [...prev, currentQuestion.card.term])

    try {
      await updateProgress.mutateAsync({
        cardId: currentQuestion.id,
        correct: false,
      })
    } catch (error) {
      console.error("Failed to update progress:", error)
    }
  }

  const handleNext = async () => {
    if (currentIndex >= questions.length - 1) {
      // Session complete
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      try {
        await saveSession.mutateAsync({
          setId,
          mode: "learn",
          stats: {
            totalCards: questions.length,
            correctAnswers: correctCount + (selectedAnswer === currentQuestion?.correctAnswer ? 1 : 0),
            incorrectAnswers: incorrectCount + (selectedAnswer !== currentQuestion?.correctAnswer ? 1 : 0),
            timeSpent,
            accuracy: Math.round(((correctCount + (selectedAnswer === currentQuestion?.correctAnswer ? 1 : 0)) / questions.length) * 100),
            weakestCards: [...new Set(weakestCards)].slice(0, 5),
          },
        })
      } catch (error) {
        console.error("Failed to save session:", error)
      }
      setIsComplete(true)
    } else {
      setCurrentIndex((i) => i + 1)
      setSelectedAnswer(null)
      setShowResult(false)
    }
  }

  const handleRestart = () => {
    setQuestions(shuffleArray(generateQuestions))
    setCurrentIndex(0)
    setSelectedAnswer(null)
    setShowResult(false)
    setCorrectCount(0)
    setIncorrectCount(0)
    setWeakestCards([])
    setIsComplete(false)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Skeleton className="h-12 w-full mb-8" />
        <Skeleton className="h-40 w-full rounded-xl mb-4" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    )
  }

  if (!set || !set.cards || set.cards.length < 4) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Not enough cards</h1>
        <p className="text-muted-foreground mb-4">
          Learn mode requires at least 4 cards to generate multiple choice questions.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  // Completion Screen
  if (isComplete) {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const minutes = Math.floor(timeSpent / 60)
    const seconds = timeSpent % 60
    const accuracy = Math.round((correctCount / questions.length) * 100)

    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Session Complete!</h1>
            <p className="text-muted-foreground mb-6">Great job studying {set.title}</p>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{correctCount}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{incorrectCount}</div>
                <div className="text-sm text-muted-foreground">Incorrect</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
              <Clock className="h-4 w-4" />
              <span>{minutes}:{seconds.toString().padStart(2, '0')}</span>
            </div>

            {weakestCards.length > 0 && (
              <div className="bg-muted rounded-lg p-4 mb-6 text-left">
                <h3 className="font-medium mb-2">Focus on these terms:</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {[...new Set(weakestCards)].slice(0, 5).map((term, i) => (
                    <li key={i}>• {term}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleRestart}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Study Again
              </Button>
              <Button className="flex-1" onClick={() => router.push(`/sets/${setId}`)}>
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      <StudyHeader
        title={set.title}
        currentIndex={currentIndex}
        totalCards={questions.length}
        setId={setId}
        mode="learn"
      />

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {/* Prompt Type Toggle */}
        <div className="flex items-center justify-end gap-2 mb-6">
          <span className="text-sm text-muted-foreground">
            {promptType === "term" ? "Term → Definition" : "Definition → Term"}
          </span>
          <Switch
            checked={promptType === "definition"}
            onCheckedChange={(checked) => {
              setPromptType(checked ? "definition" : "term")
              handleRestart()
            }}
          />
        </div>

        {/* Question */}
        <MultipleChoice
          prompt={promptType === "term" ? currentQuestion.card.term : currentQuestion.card.definition}
          promptLabel={promptType === "term" ? "Term" : "Definition"}
          options={currentQuestion.options}
          selectedAnswer={selectedAnswer}
          correctAnswer={currentQuestion.correctAnswer}
          showResult={showResult}
          onSelect={handleSelect}
          onDontKnow={handleDontKnow}
        />

        {/* Next Button */}
        {showResult && (
          <div className="flex justify-center mt-6">
            <Button onClick={handleNext} className="gap-2">
              {currentIndex >= questions.length - 1 ? "Finish" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Score */}
        <div className="flex items-center justify-center gap-6 mt-8 text-sm">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{correctCount} correct</span>
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <XCircle className="h-4 w-4" />
            <span>{incorrectCount} incorrect</span>
          </div>
        </div>
      </div>
    </div>
  )
}
