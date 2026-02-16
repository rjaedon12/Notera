"use client"

import { use, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useStudySet, useSaveSession } from "@/hooks/useStudy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { shuffleArray, cn } from "@/lib/utils"
import { Card as CardType, TestQuestion, TestResult } from "@/types"
import { CheckCircle, XCircle, ArrowRight, RotateCcw, FileText } from "lucide-react"

interface PageProps {
  params: Promise<{ setId: string }>
}

type QuestionType = "multiple_choice" | "written"

export default function TestPage({ params }: PageProps) {
  const { setId } = use(params)
  const router = useRouter()
  const { data: set, isLoading } = useStudySet(setId)
  const saveSession = useSaveSession()

  // Config state
  const [isConfiguring, setIsConfiguring] = useState(true)
  const [questionCount, setQuestionCount] = useState(10)
  const [includeMultipleChoice, setIncludeMultipleChoice] = useState(true)
  const [includeWritten, setIncludeWritten] = useState(true)
  const [includeTermToDefinition, setIncludeTermToDefinition] = useState(true)
  const [includeDefinitionToTerm, setIncludeDefinitionToTerm] = useState(true)

  // Test state
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [results, setResults] = useState<TestResult[]>([])
  const [startTime, setStartTime] = useState(0)

  // Generate questions
  const generateQuestions = (cards: CardType[]): TestQuestion[] => {
    const types: QuestionType[] = []
    if (includeMultipleChoice) types.push("multiple_choice")
    if (includeWritten) types.push("written")
    if (types.length === 0) types.push("multiple_choice")

    const promptTypes: ("term" | "definition")[] = []
    if (includeTermToDefinition) promptTypes.push("term")
    if (includeDefinitionToTerm) promptTypes.push("definition")
    if (promptTypes.length === 0) promptTypes.push("term")

    const shuffledCards = shuffleArray([...cards])
    const selectedCards = shuffledCards.slice(0, Math.min(questionCount, cards.length))

    return selectedCards.map((card, index) => {
      const type = types[index % types.length]
      const promptType = promptTypes[index % promptTypes.length]
      const prompt = promptType === "term" ? card.term : card.definition
      const correctAnswer = promptType === "term" ? card.definition : card.term

      let options: string[] | undefined
      if (type === "multiple_choice") {
        const otherCards = cards.filter((c) => c.id !== card.id)
        const wrongAnswers = shuffleArray(otherCards)
          .slice(0, 3)
          .map((c) => (promptType === "term" ? c.definition : c.term))
        options = shuffleArray([correctAnswer, ...wrongAnswers])
      }

      return {
        id: `q-${index}`,
        type,
        prompt,
        promptType,
        correctAnswer,
        options,
        cardId: card.id,
      }
    })
  }

  const handleStartTest = () => {
    if (!set?.cards) return
    const newQuestions = generateQuestions(set.cards)
    setQuestions(newQuestions)
    setAnswers({})
    setIsSubmitted(false)
    setResults([])
    setStartTime(Date.now())
    setIsConfiguring(false)
  }

  const handleSubmit = async () => {
    const newResults: TestResult[] = questions.map((q) => {
      const userAnswer = answers[q.id] || ""
      const isCorrect =
        q.type === "written"
          ? userAnswer.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()
          : userAnswer === q.correctAnswer

      return {
        questionId: q.id,
        userAnswer,
        isCorrect,
        correctAnswer: q.correctAnswer,
      }
    })

    setResults(newResults)
    setIsSubmitted(true)

    // Save session
    const timeSpent = Math.floor((Date.now() - startTime) / 1000)
    const correctCount = newResults.filter((r) => r.isCorrect).length
    try {
      await saveSession.mutateAsync({
        setId,
        mode: "test",
        stats: {
          totalCards: questions.length,
          correctAnswers: correctCount,
          incorrectAnswers: questions.length - correctCount,
          timeSpent,
          accuracy: Math.round((correctCount / questions.length) * 100),
        },
      })
    } catch (error) {
      console.error("Failed to save session:", error)
    }
  }

  const handleRetake = () => {
    setIsConfiguring(true)
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
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
          Test mode requires at least 4 cards.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  // Configuration Screen
  if (isConfiguring) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <h1 className="text-2xl font-bold mb-2">Test Settings</h1>
        <p className="text-muted-foreground mb-8">{set.title}</p>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <Label>Number of questions</Label>
              <Input
                type="number"
                min={1}
                max={set.cards.length}
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 1)}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max: {set.cards.length} cards
              </p>
            </div>

            <div className="space-y-3">
              <Label>Question types</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Multiple choice</span>
                <Switch
                  checked={includeMultipleChoice}
                  onCheckedChange={setIncludeMultipleChoice}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Written</span>
                <Switch
                  checked={includeWritten}
                  onCheckedChange={setIncludeWritten}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Question direction</Label>
              <div className="flex items-center justify-between">
                <span className="text-sm">Term → Definition</span>
                <Switch
                  checked={includeTermToDefinition}
                  onCheckedChange={setIncludeTermToDefinition}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Definition → Term</span>
                <Switch
                  checked={includeDefinitionToTerm}
                  onCheckedChange={setIncludeDefinitionToTerm}
                />
              </div>
            </div>

            <Button onClick={handleStartTest} className="w-full">
              Start Test
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Results Screen
  if (isSubmitted) {
    const correctCount = results.filter((r) => r.isCorrect).length
    const accuracy = Math.round((correctCount / questions.length) * 100)

    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Test Complete!</h1>
          <p className="text-4xl font-bold text-blue-600 mb-2">{accuracy}%</p>
          <p className="text-muted-foreground">
            {correctCount} out of {questions.length} correct
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {questions.map((question, index) => {
            const result = results.find((r) => r.questionId === question.id)
            const isCorrect = result?.isCorrect

            return (
              <Card
                key={question.id}
                className={cn(
                  "border-2",
                  isCorrect ? "border-green-200" : "border-red-200"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-1">
                        {index + 1}. {question.prompt}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        Your answer: {result?.userAnswer || "(no answer)"}
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-600">
                          Correct answer: {question.correctAnswer}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={handleRetake}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Retake Test
          </Button>
          <Button onClick={() => router.push(`/sets/${setId}`)}>Done</Button>
        </div>
      </div>
    )
  }

  // Test Taking Screen
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">{set.title} - Test</h1>
        <span className="text-muted-foreground">
          {Object.keys(answers).length} / {questions.length} answered
        </span>
      </div>

      <div className="space-y-6 mb-8">
        {questions.map((question, index) => (
          <Card key={question.id}>
            <CardContent className="p-6">
              <p className="text-xs text-muted-foreground uppercase mb-2">
                {question.promptType === "term" ? "Term" : "Definition"}
              </p>
              <p className="font-medium text-lg mb-4">{question.prompt}</p>

              {question.type === "multiple_choice" && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <button
                      key={optIndex}
                      onClick={() =>
                        setAnswers({ ...answers, [question.id]: option })
                      }
                      className={cn(
                        "w-full text-left p-3 rounded-lg border-2 transition-all text-slate-900",
                        answers[question.id] === option
                          ? "border-primary bg-primary/10"
                          : "border-border bg-white hover:border-border/80"
                      )}
                    >
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-muted text-sm font-medium text-slate-900 mr-3">
                        {optIndex + 1}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "written" && (
                <Input
                  placeholder="Type your answer..."
                  value={answers[question.id] || ""}
                  onChange={(e) =>
                    setAnswers({ ...answers, [question.id]: e.target.value })
                  }
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button onClick={handleSubmit} size="lg" className="gap-2">
          Submit Test
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
