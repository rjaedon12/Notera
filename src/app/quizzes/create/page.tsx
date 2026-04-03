"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCreateQuestionBank } from "@/hooks/useQuiz"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
  ImageIcon,
  FileText,
  FileUp,
  Clock,
  Calculator,
} from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ImageUploader } from "@/components/image-uploader"
import { ImportQuestionsModal } from "@/components/import-questions-modal"
import type { ParsedQuestion } from "@/lib/question-parser"
import type { QuestionType } from "@/types"

interface ChoiceDraft {
  text: string
  isCorrect: boolean
}

interface QuestionDraft {
  prompt: string
  imageUrl: string
  passage: string
  explanation: string
  choices: ChoiceDraft[]
  showPassage: boolean
  showImage: boolean
  type: QuestionType
  pointValue: number
  exampleAnswer: string
}

function emptyChoice(): ChoiceDraft {
  return { text: "", isCorrect: false }
}

function emptyQuestion(type: QuestionType = "MULTIPLE_CHOICE"): QuestionDraft {
  return {
    prompt: "",
    imageUrl: "",
    passage: "",
    explanation: "",
    choices:
      type === "MULTIPLE_CHOICE"
        ? [
            { text: "", isCorrect: true },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
            { text: "", isCorrect: false },
          ]
        : [],
    showPassage: false,
    showImage: false,
    type,
    pointValue: 1,
    exampleAnswer: "",
  }
}

export default function CreateQuestionBankPage() {
  const router = useRouter()
  const createBank = useCreateQuestionBank()

  const [title, setTitle] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [timerMinutes, setTimerMinutes] = useState<string>("")
  const [desmosEnabled, setDesmosEnabled] = useState(false)
  const [questions, setQuestions] = useState<QuestionDraft[]>([emptyQuestion()])
  const [activeQ, setActiveQ] = useState(0)
  const [showImport, setShowImport] = useState(false)

  const updateQuestion = (index: number, updates: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q, i) => (i === index ? { ...q, ...updates } : q)))
  }

  const updateChoice = (qIndex: number, cIndex: number, updates: Partial<ChoiceDraft>) => {
    setQuestions((prev) =>
      prev.map((q, qi) =>
        qi === qIndex
          ? {
              ...q,
              choices: q.choices.map((c, ci) => (ci === cIndex ? { ...c, ...updates } : c)),
            }
          : q
      )
    )
  }

  const setCorrectChoice = (qIndex: number, cIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, qi) =>
        qi === qIndex
          ? {
              ...q,
              choices: q.choices.map((c, ci) => ({ ...c, isCorrect: ci === cIndex })),
            }
          : q
      )
    )
  }

  const addChoice = (qIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, qi) =>
        qi === qIndex && q.choices.length < 6
          ? { ...q, choices: [...q.choices, emptyChoice()] }
          : q
      )
    )
  }

  const removeChoice = (qIndex: number, cIndex: number) => {
    setQuestions((prev) =>
      prev.map((q, qi) => {
        if (qi !== qIndex || q.choices.length <= 2) return q
        const newChoices = q.choices.filter((_, ci) => ci !== cIndex)
        if (!newChoices.some((c) => c.isCorrect)) {
          newChoices[0].isCorrect = true
        }
        return { ...q, choices: newChoices }
      })
    )
  }

  const addQuestion = (type: QuestionType = "MULTIPLE_CHOICE") => {
    setQuestions((prev) => [...prev, emptyQuestion(type)])
    setActiveQ(questions.length)
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return
    setQuestions((prev) => prev.filter((_, i) => i !== index))
    if (activeQ >= questions.length - 1) {
      setActiveQ(Math.max(0, questions.length - 2))
    }
  }

  const handleImport = (parsed: ParsedQuestion[], mode: "MULTIPLE_CHOICE" | "OPEN_RESPONSE") => {
    const imported: QuestionDraft[] = parsed.map((p) => ({
      prompt: p.prompt,
      imageUrl: "",
      passage: "",
      explanation: "",
      choices: mode === "MULTIPLE_CHOICE" 
        ? p.choices.map((c) => ({ text: c.text, isCorrect: c.isCorrect }))
        : [],
      showPassage: false,
      showImage: false,
      type: mode,
      pointValue: 1,
      exampleAnswer: "",
    }))
    // Replace empty first question or append
    if (questions.length === 1 && !questions[0].prompt.trim()) {
      setQuestions(imported)
    } else {
      setQuestions((prev) => [...prev, ...imported])
    }
    setActiveQ(questions.length === 1 && !questions[0].prompt.trim() ? 0 : questions.length)
    toast.success(`Imported ${imported.length} question${imported.length !== 1 ? "s" : ""}`)
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required")
      return
    }
    if (!subject.trim()) {
      toast.error("Subject is required")
      return
    }

    const filledQuestions = questions.filter((q) => q.prompt.trim())

    for (let i = 0; i < filledQuestions.length; i++) {
      const q = filledQuestions[i]
      const displayIndex = questions.indexOf(q)
      if (!q.explanation.trim()) {
        toast.error(`Question ${displayIndex + 1}: Explanation is required`)
        setActiveQ(displayIndex)
        return
      }
      if (q.type === "MULTIPLE_CHOICE") {
        const filledChoices = q.choices.filter((c) => c.text.trim())
        if (filledChoices.length < 2) {
          toast.error(`Question ${displayIndex + 1}: At least 2 choices are required`)
          setActiveQ(displayIndex)
          return
        }
        if (!filledChoices.some((c) => c.isCorrect)) {
          toast.error(`Question ${displayIndex + 1}: Mark one choice as correct`)
          setActiveQ(displayIndex)
          return
        }
      }
    }

    try {
      const bank = await createBank.mutateAsync({
        title: title.trim(),
        subject: subject.trim(),
        description: description.trim() || undefined,
        isPublic,
        timerMinutes: timerMinutes ? Number(timerMinutes) : null,
        desmosEnabled,
        questions: filledQuestions.map((q) => {
          if (q.type === "OPEN_RESPONSE") {
            return {
              prompt: q.prompt.trim(),
              imageUrl: q.imageUrl.trim() || undefined,
              passage: q.passage.trim() || undefined,
              explanation: q.explanation.trim(),
              type: "OPEN_RESPONSE",
              pointValue: q.pointValue,
              exampleAnswer: q.exampleAnswer.trim() || undefined,
            }
          }
          const filledChoices = q.choices.filter((c) => c.text.trim())
          const correctChoiceIndex = filledChoices.findIndex((c) => c.isCorrect)
          return {
            prompt: q.prompt.trim(),
            imageUrl: q.imageUrl.trim() || undefined,
            passage: q.passage.trim() || undefined,
            explanation: q.explanation.trim(),
            type: "MULTIPLE_CHOICE",
            pointValue: q.pointValue,
            correctChoiceIndex,
            choices: filledChoices.map((c) => ({ text: c.text.trim() })),
          }
        }),
      })
      toast.success("Practice test created!")
      router.push(`/quizzes/${bank.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create practice test"
      toast.error(message)
    }
  }

  const q = questions[activeQ]

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/quizzes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Create Practice Test</h1>
      </div>

      {/* Bank Details */}
      <Card className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Unit 3 – Empires & Religions"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="e.g., World History"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="A short description of this practice test..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Settings row */}
          <div className="flex items-center gap-6 pt-2 flex-wrap">
            <div className="flex items-center gap-3">
              <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              <Label>Make public</Label>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm">Timer (minutes)</Label>
              <Input
                type="number"
                min={0}
                placeholder="None"
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(e.target.value)}
                className="w-24 h-8 text-sm"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={desmosEnabled} onCheckedChange={setDesmosEnabled} />
              <Label className="flex items-center gap-1">
                <Calculator className="h-4 w-4" />
                Desmos Calculator
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question Editor - Split Layout */}
      <div className="flex gap-4">
        {/* Question List Sidebar */}
        <div className="w-48 shrink-0 space-y-2">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Questions ({questions.length})
          </div>
          {questions.map((questionItem, i) => (
            <button
              key={i}
              onClick={() => setActiveQ(i)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                activeQ === i
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  : "hover:bg-muted text-foreground"
              )}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">
                {questionItem.prompt.trim() || `Question ${i + 1}`}
              </span>
              <span className="text-[10px] uppercase text-muted-foreground shrink-0">
                {questionItem.type === "OPEN_RESPONSE" ? "OR" : "MC"}
              </span>
            </button>
          ))}
          <div className="space-y-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => addQuestion("MULTIPLE_CHOICE")}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              MC Question
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => addQuestion("OPEN_RESPONSE")}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Open Response
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowImport(true)}
            >
              <FileUp className="h-3.5 w-3.5 mr-1" />
              Import from Text
            </Button>
          </div>
        </div>

        {/* Active Question Editor */}
        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">Question {activeQ + 1}</h3>
                <span
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    q.type === "OPEN_RESPONSE"
                      ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  )}
                >
                  {q.type === "OPEN_RESPONSE" ? "Open Response" : "Multiple Choice"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground">Points:</Label>
                <Input
                  type="number"
                  min={1}
                  value={q.pointValue}
                  onChange={(e) =>
                    updateQuestion(activeQ, { pointValue: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="w-16 h-8 text-sm"
                />
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeQuestion(activeQ)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </div>

            {/* Toggle buttons for optional fields */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={q.showImage ? "default" : "outline"}
                size="sm"
                onClick={() => updateQuestion(activeQ, { showImage: !q.showImage })}
              >
                <ImageIcon className="h-3.5 w-3.5 mr-1" />
                Image URL
              </Button>
              <Button
                variant={q.showPassage ? "default" : "outline"}
                size="sm"
                onClick={() => updateQuestion(activeQ, { showPassage: !q.showPassage })}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                Passage
              </Button>
            </div>

            <div className="space-y-4">
              {q.showPassage && (
                <div>
                  <Label>Passage / Stimulus</Label>
                  <Textarea
                    placeholder="Provide a reading passage or stimulus text for this question..."
                    value={q.passage}
                    onChange={(e) => updateQuestion(activeQ, { passage: e.target.value })}
                    className="mt-1"
                    rows={4}
                  />
                </div>
              )}

              {q.showImage && (
                <div>
                  <Label>Image</Label>
                  <ImageUploader
                    value={q.imageUrl}
                    onChange={(url) => updateQuestion(activeQ, { imageUrl: url })}
                  />
                </div>
              )}

              <div>
                <Label>Question Prompt</Label>
                <Textarea
                  placeholder="Enter your question here..."
                  value={q.prompt}
                  onChange={(e) => updateQuestion(activeQ, { prompt: e.target.value })}
                  className="mt-1"
                  rows={2}
                />
              </div>

              {/* Multiple Choice: Choices */}
              {q.type === "MULTIPLE_CHOICE" && (
                <div>
                  <Label className="mb-2 block">
                    Answer Choices{" "}
                    <span className="text-muted-foreground font-normal">
                      (click to mark correct)
                    </span>
                  </Label>
                  <div className="space-y-2">
                    {q.choices.map((choice, ci) => (
                      <div key={ci} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCorrectChoice(activeQ, ci)}
                          className="shrink-0"
                          title={choice.isCorrect ? "Correct answer" : "Click to mark as correct"}
                        >
                          {choice.isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground hover:text-green-400 transition-colors" />
                          )}
                        </button>
                        <span className="text-sm font-medium text-muted-foreground w-6">
                          {String.fromCharCode(65 + ci)}.
                        </span>
                        <Input
                          placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                          value={choice.text}
                          onChange={(e) =>
                            updateChoice(activeQ, ci, { text: e.target.value })
                          }
                          className={cn(
                            "flex-1",
                            choice.isCorrect && "border-green-300 dark:border-green-700"
                          )}
                        />
                        {q.choices.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeChoice(activeQ, ci)}
                            className="shrink-0 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {q.choices.length < 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addChoice(activeQ)}
                      className="mt-2"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Add Choice
                    </Button>
                  )}
                </div>
              )}

              {/* Open Response: Example Answer */}
              {q.type === "OPEN_RESPONSE" && (
                <div>
                  <Label>Example Answer (shown after student submits)</Label>
                  <Textarea
                    placeholder="Provide an example of a strong response..."
                    value={q.exampleAnswer}
                    onChange={(e) => updateQuestion(activeQ, { exampleAnswer: e.target.value })}
                    className="mt-1"
                    rows={4}
                  />
                </div>
              )}

              {/* Explanation */}
              <div>
                <Label>Explanation</Label>
                <Textarea
                  placeholder="Explain why the correct answer is correct..."
                  value={q.explanation}
                  onChange={(e) =>
                    updateQuestion(activeQ, { explanation: e.target.value })
                  }
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3 mt-6">
        <Link href="/quizzes">
          <Button variant="outline">Cancel</Button>
        </Link>
        <Button onClick={handleSubmit} disabled={createBank.isPending}>
          {createBank.isPending ? "Creating..." : "Create Practice Test"}
        </Button>
      </div>

      {/* Import Modal */}
      <ImportQuestionsModal
        open={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />
    </div>
  )
}
