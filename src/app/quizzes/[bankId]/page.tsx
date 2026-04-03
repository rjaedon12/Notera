"use client"

import { useState, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  useQuestionBank,
  useDeleteQuestionBank,
  useAddQuestion,
  useDeleteQuestion,
  useUpdateQuestionBank,
  useUpdateQuestion,
} from "@/hooks/useQuiz"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  ArrowLeft,
  Play,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ImageIcon,
  FileText,
  Save,
  Pencil,
} from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import { ImageUploader } from "@/components/image-uploader"
import type { QuizFeedbackMode } from "@/types"

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
}

export default function QuestionBankPage({
  params,
}: {
  params: Promise<{ bankId: string }>
}) {
  const { bankId } = use(params)
  const router = useRouter()
  const { data: bank, isLoading } = useQuestionBank(bankId)
  const deleteBank = useDeleteQuestionBank()
  const addQuestion = useAddQuestion()
  const deleteQuestion = useDeleteQuestion()
  const updateBank = useUpdateQuestionBank()
  const updateQuestion = useUpdateQuestion()

  const [expandedQ, setExpandedQ] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showEditQuestionDialog, setShowEditQuestionDialog] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editSubject, setEditSubject] = useState("")
  const [editDesc, setEditDesc] = useState("")
  const [editPublic, setEditPublic] = useState(false)
  const [editTimerMinutes, setEditTimerMinutes] = useState<string>("")
  const [editDesmosEnabled, setEditDesmosEnabled] = useState(false)
  const [editFeedbackMode, setEditFeedbackMode] = useState<QuizFeedbackMode>("IMMEDIATE")

  // New question form
  const [newQ, setNewQ] = useState<QuestionDraft>({
    prompt: "",
    imageUrl: "",
    passage: "",
    explanation: "",
    choices: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    showPassage: false,
    showImage: false,
  })

  // Edit question form
  const [editQ, setEditQ] = useState<QuestionDraft>({
    prompt: "",
    imageUrl: "",
    passage: "",
    explanation: "",
    choices: [
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
    ],
    showPassage: false,
    showImage: false,
  })

  const openEditQuestionDialog = (questionId: string) => {
    const question = bank?.questions?.find((q) => q.id === questionId)
    if (!question) return
    
    setEditingQuestionId(questionId)
    setEditQ({
      prompt: question.prompt,
      imageUrl: question.imageUrl || "",
      passage: question.passage || "",
      explanation: question.explanation || "",
      choices: question.choices?.map((c) => ({
        text: c.text,
        isCorrect: c.isCorrect,
      })) || [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ],
      showPassage: !!question.passage,
      showImage: !!question.imageUrl,
    })
    setShowEditQuestionDialog(true)
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestionId) return
    
    if (!editQ.prompt.trim()) {
      toast.error("Question prompt is required")
      return
    }
    if (!editQ.explanation.trim()) {
      toast.error("Explanation is required")
      return
    }
    const filledChoices = editQ.choices.filter((c) => c.text.trim())
    if (filledChoices.length < 2) {
      toast.error("At least 2 choices are required")
      return
    }
    const hasCorrect = filledChoices.some((c) => c.isCorrect)
    if (!hasCorrect) {
      toast.error("Mark one choice as correct")
      return
    }

    try {
      const question = bank?.questions?.find((q) => q.id === editingQuestionId)
      await updateQuestion.mutateAsync({
        bankId,
        questionId: editingQuestionId,
        prompt: editQ.prompt.trim(),
        imageUrl: editQ.imageUrl.trim() || undefined,
        passage: editQ.passage.trim() || undefined,
        explanation: editQ.explanation.trim(),
        orderIndex: question?.orderIndex ?? 0,
        choices: filledChoices.map((c, i) => ({
          text: c.text.trim(),
          isCorrect: c.isCorrect,
          orderIndex: i,
        })),
      })
      toast.success("Question updated")
      setShowEditQuestionDialog(false)
      setEditingQuestionId(null)
    } catch {
      toast.error("Failed to update question")
    }
  }

  const handleDeleteBank = async () => {
    if (
      confirm(
        "Delete this question bank? All questions and attempt history will be permanently removed."
      )
    ) {
      try {
        await deleteBank.mutateAsync(bankId)
        toast.success("Question bank deleted")
        router.push("/quizzes")
      } catch {
        toast.error("Failed to delete")
      }
    }
  }

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm("Delete this question?")) {
      try {
        await deleteQuestion.mutateAsync({ bankId, questionId })
        toast.success("Question deleted")
      } catch {
        toast.error("Failed to delete question")
      }
    }
  }

  const handleAddQuestion = async () => {
    if (!newQ.prompt.trim()) {
      toast.error("Question prompt is required")
      return
    }
    if (!newQ.explanation.trim()) {
      toast.error("Explanation is required")
      return
    }
    const filledChoices = newQ.choices.filter((c) => c.text.trim())
    if (filledChoices.length < 2) {
      toast.error("At least 2 choices are required")
      return
    }
    const correctChoiceIndex = filledChoices.findIndex((c) => c.isCorrect)
    if (correctChoiceIndex === -1) {
      toast.error("Mark one choice as correct")
      return
    }

    try {
      await addQuestion.mutateAsync({
        bankId,
        prompt: newQ.prompt.trim(),
        imageUrl: newQ.imageUrl.trim() || undefined,
        passage: newQ.passage.trim() || undefined,
        explanation: newQ.explanation.trim(),
        correctChoiceIndex,
        orderIndex: bank?.questions?.length || 0,
        choices: filledChoices.map((c, i) => ({
          text: c.text.trim(),
          orderIndex: i,
        })),
      })
      toast.success("Question added")
      setShowAddDialog(false)
      setNewQ({
        prompt: "",
        imageUrl: "",
        passage: "",
        explanation: "",
        choices: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        showPassage: false,
        showImage: false,
      })
    } catch {
      toast.error("Failed to add question")
    }
  }

  const openEditDialog = () => {
    if (!bank) return
    setEditTitle(bank.title)
    setEditSubject(bank.subject || "")
    setEditDesc(bank.description || "")
    setEditPublic(bank.isPublic)
    setEditTimerMinutes(bank.timerMinutes != null ? String(bank.timerMinutes) : "")
    setEditDesmosEnabled(bank.desmosEnabled ?? false)
    setEditFeedbackMode(bank.feedbackMode ?? "IMMEDIATE")
    setShowEditDialog(true)
  }

  const handleUpdateBank = async () => {
    if (!editTitle.trim()) {
      toast.error("Title is required")
      return
    }
    if (!editSubject.trim()) {
      toast.error("Subject is required")
      return
    }
    try {
      await updateBank.mutateAsync({
        id: bankId,
        title: editTitle.trim(),
        subject: editSubject.trim(),
        description: editDesc.trim() || undefined,
        isPublic: editPublic,
        timerMinutes: editTimerMinutes ? parseInt(editTimerMinutes) : null,
        desmosEnabled: editDesmosEnabled,
        feedbackMode: editFeedbackMode,
      })
      toast.success("Updated")
      setShowEditDialog(false)
    } catch {
      toast.error("Failed to update")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-40 bg-muted rounded" />
        </div>
      </div>
    )
  }

  if (!bank) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-xl font-semibold">Question bank not found</h2>
        <Link href="/quizzes" className="text-blue-500 hover:underline mt-2 block">
          Back to Practice Tests
        </Link>
      </div>
    )
  }

  const questionCount = bank.questions?.length || 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Link href="/quizzes">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{bank.title}</h1>
          {bank.subject && (
            <p className="text-sm font-medium text-purple-600 dark:text-purple-400 mt-1">
              {bank.subject}
            </p>
          )}
          {bank.description && (
            <p className="text-muted-foreground mt-1">{bank.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant={bank.isPublic ? "default" : "secondary"}>
              {bank.isPublic ? "Public" : "Private"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {questionCount} question{questionCount !== 1 ? "s" : ""}
            </span>
            {bank.timerMinutes && (
              <span className="text-sm text-muted-foreground">
                ⏱ {bank.timerMinutes} min
              </span>
            )}
            {bank.desmosEnabled && (
              <Badge variant="outline" className="text-xs">Desmos</Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {bank.feedbackMode === "REVEAL_AT_END" ? "Reveal At Finish" : "Immediate Feedback"}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={openEditDialog}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteBank}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
          <Button
            size="sm"
            disabled={questionCount === 0}
            onClick={() => router.push(`/quizzes/${bankId}/take`)}
          >
            <Play className="h-4 w-4 mr-1" />
            Take Test
          </Button>
        </div>
      </div>

      {/* Questions List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Questions</h2>
        <Button size="sm" onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Question
        </Button>
      </div>

      {questionCount === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <HelpCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">
              No questions yet. Add your first question to this bank.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bank.questions?.map((question, i) => (
            <Card key={question.id}>
              <CardContent className="p-4">
                <button
                  className="w-full flex items-center justify-between text-left"
                  onClick={() =>
                    setExpandedQ(expandedQ === question.id ? null : question.id)
                  }
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-6">
                      {i + 1}.
                    </span>
                    <span className="font-medium">{question.prompt}</span>
                    {question.type === "OPEN_RESPONSE" && (
                      <Badge variant="secondary" className="text-xs">Open Response</Badge>
                    )}
                    {(question.pointValue ?? 1) > 1 && (
                      <Badge variant="outline" className="text-xs">{question.pointValue} pts</Badge>
                    )}
                    {question.imageUrl && (
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    )}
                    {question.passage && (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {expandedQ === question.id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                {expandedQ === question.id && (
                  <div className="mt-4 pl-9 space-y-3">
                    {question.passage && (
                      <div className="bg-muted/50 p-3 rounded-lg text-sm italic">
                        {question.passage}
                      </div>
                    )}

                    {question.imageUrl && (
                      <img
                        src={question.imageUrl}
                        alt="Question"
                        className="max-h-40 rounded-lg border"
                      />
                    )}

                    <div className="space-y-1.5">
                      {question.type === "OPEN_RESPONSE" ? (
                        question.exampleAnswer && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
                            <span className="font-medium text-green-700 dark:text-green-400">
                              Example Answer:
                            </span>{" "}
                            {question.exampleAnswer}
                          </div>
                        )
                      ) : (
                        question.choices?.map((choice, ci) => (
                          <div
                            key={choice.id}
                            className={cn(
                              "flex items-center gap-2 text-sm px-3 py-1.5 rounded",
                              choice.isCorrect
                                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "text-foreground"
                            )}
                          >
                            {choice.isCorrect ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium">
                              {String.fromCharCode(65 + ci)}.
                            </span>
                            {choice.text}
                          </div>
                        ))
                      )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
                      <span className="font-medium text-blue-700 dark:text-blue-400">
                        Explanation:
                      </span>{" "}
                      {question.explanation}
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditQuestionDialog(question.id)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Question Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Question</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Toggle optional fields */}
            <div className="flex gap-2">
              <Button
                variant={newQ.showImage ? "default" : "outline"}
                size="sm"
                onClick={() => setNewQ((p) => ({ ...p, showImage: !p.showImage }))}
              >
                <ImageIcon className="h-3.5 w-3.5 mr-1" />
                Image
              </Button>
              <Button
                variant={newQ.showPassage ? "default" : "outline"}
                size="sm"
                onClick={() => setNewQ((p) => ({ ...p, showPassage: !p.showPassage }))}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                Passage
              </Button>
            </div>

            {newQ.showPassage && (
              <div>
                <Label>Passage / Stimulus</Label>
                <Textarea
                  placeholder="Reading passage or stimulus text..."
                  value={newQ.passage}
                  onChange={(e) => setNewQ((p) => ({ ...p, passage: e.target.value }))}
                  className="mt-1"
                  rows={4}
                />
              </div>
            )}

            {newQ.showImage && (
              <div>
                <Label>Image</Label>
                <ImageUploader
                  value={newQ.imageUrl}
                  onChange={(url) => setNewQ((p) => ({ ...p, imageUrl: url }))}
                />
              </div>
            )}

            <div>
              <Label>Question Prompt</Label>
              <Textarea
                placeholder="Enter your question here..."
                value={newQ.prompt}
                onChange={(e) => setNewQ((p) => ({ ...p, prompt: e.target.value }))}
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label className="mb-2 block">
                Answer Choices{" "}
                <span className="text-muted-foreground font-normal">(click to mark correct)</span>
              </Label>
              <div className="space-y-2">
                {newQ.choices.map((choice, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNewQ((p) => ({
                          ...p,
                          choices: p.choices.map((c, i) => ({
                            ...c,
                            isCorrect: i === ci,
                          })),
                        }))
                      }
                    >
                      {choice.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-green-400" />
                      )}
                    </button>
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {String.fromCharCode(65 + ci)}.
                    </span>
                    <Input
                      placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                      value={choice.text}
                      onChange={(e) =>
                        setNewQ((p) => ({
                          ...p,
                          choices: p.choices.map((c, i) =>
                            i === ci ? { ...c, text: e.target.value } : c
                          ),
                        }))
                      }
                      className={cn(
                        "flex-1",
                        choice.isCorrect && "border-green-300 dark:border-green-700"
                      )}
                    />
                    {newQ.choices.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          setNewQ((p) => {
                            const choices = p.choices.filter((_, i) => i !== ci)
                            if (!choices.some((c) => c.isCorrect)) choices[0].isCorrect = true
                            return { ...p, choices }
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {newQ.choices.length < 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setNewQ((p) => ({
                      ...p,
                      choices: [...p.choices, { text: "", isCorrect: false }],
                    }))
                  }
                  className="mt-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Choice
                </Button>
              )}
            </div>

            <div>
              <Label>Explanation</Label>
              <Textarea
                placeholder="Explain why the correct answer is correct..."
                value={newQ.explanation}
                onChange={(e) =>
                  setNewQ((p) => ({ ...p, explanation: e.target.value }))
                }
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddQuestion} disabled={addQuestion.isPending}>
              {addQuestion.isPending ? "Adding..." : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={showEditQuestionDialog} onOpenChange={(open) => {
        setShowEditQuestionDialog(open)
        if (!open) setEditingQuestionId(null)
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Toggle optional fields */}
            <div className="flex gap-2">
              <Button
                variant={editQ.showImage ? "default" : "outline"}
                size="sm"
                onClick={() => setEditQ((p) => ({ ...p, showImage: !p.showImage }))}
              >
                <ImageIcon className="h-3.5 w-3.5 mr-1" />
                Image
              </Button>
              <Button
                variant={editQ.showPassage ? "default" : "outline"}
                size="sm"
                onClick={() => setEditQ((p) => ({ ...p, showPassage: !p.showPassage }))}
              >
                <FileText className="h-3.5 w-3.5 mr-1" />
                Passage
              </Button>
            </div>

            {editQ.showPassage && (
              <div>
                <Label>Passage / Stimulus</Label>
                <Textarea
                  placeholder="Reading passage or stimulus text..."
                  value={editQ.passage}
                  onChange={(e) => setEditQ((p) => ({ ...p, passage: e.target.value }))}
                  className="mt-1"
                  rows={4}
                />
              </div>
            )}

            {editQ.showImage && (
              <div>
                <Label>Image</Label>
                <ImageUploader
                  value={editQ.imageUrl}
                  onChange={(url) => setEditQ((p) => ({ ...p, imageUrl: url }))}
                />
              </div>
            )}

            <div>
              <Label>Question Prompt</Label>
              <Textarea
                placeholder="Enter your question here..."
                value={editQ.prompt}
                onChange={(e) => setEditQ((p) => ({ ...p, prompt: e.target.value }))}
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label className="mb-2 block">
                Answer Choices{" "}
                <span className="text-muted-foreground font-normal">(click to mark correct)</span>
              </Label>
              <div className="space-y-2">
                {editQ.choices.map((choice, ci) => (
                  <div key={ci} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditQ((p) => ({
                          ...p,
                          choices: p.choices.map((c, i) => ({
                            ...c,
                            isCorrect: i === ci,
                          })),
                        }))
                      }
                    >
                      {choice.isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground hover:text-green-400" />
                      )}
                    </button>
                    <span className="text-sm font-medium text-muted-foreground w-6">
                      {String.fromCharCode(65 + ci)}.
                    </span>
                    <Input
                      placeholder={`Choice ${String.fromCharCode(65 + ci)}`}
                      value={choice.text}
                      onChange={(e) =>
                        setEditQ((p) => ({
                          ...p,
                          choices: p.choices.map((c, i) =>
                            i === ci ? { ...c, text: e.target.value } : c
                          ),
                        }))
                      }
                      className={cn(
                        "flex-1",
                        choice.isCorrect && "border-green-300 dark:border-green-700"
                      )}
                    />
                    {editQ.choices.length > 2 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          setEditQ((p) => {
                            const choices = p.choices.filter((_, i) => i !== ci)
                            if (!choices.some((c) => c.isCorrect)) choices[0].isCorrect = true
                            return { ...p, choices }
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              {editQ.choices.length < 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setEditQ((p) => ({
                      ...p,
                      choices: [...p.choices, { text: "", isCorrect: false }],
                    }))
                  }
                  className="mt-2"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Choice
                </Button>
              )}
            </div>

            <div>
              <Label>Explanation</Label>
              <Textarea
                placeholder="Explain why the correct answer is correct..."
                value={editQ.explanation}
                onChange={(e) =>
                  setEditQ((p) => ({ ...p, explanation: e.target.value }))
                }
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowEditQuestionDialog(false)
              setEditingQuestionId(null)
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdateQuestion} disabled={updateQuestion.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {updateQuestion.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bank Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Question Bank</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Subject</Label>
              <Input
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="e.g. World History, Biology, AP Chemistry"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editPublic} onCheckedChange={setEditPublic} />
              <Label>Make public</Label>
            </div>
            <div>
              <Label>Timer (minutes)</Label>
              <Input
                type="number"
                min="1"
                value={editTimerMinutes}
                onChange={(e) => setEditTimerMinutes(e.target.value)}
                placeholder="No time limit"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank for no timer</p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editDesmosEnabled} onCheckedChange={setEditDesmosEnabled} />
              <Label>Enable Desmos calculator</Label>
            </div>
            <div className="space-y-2">
              <Label>Feedback timing</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditFeedbackMode("IMMEDIATE")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    editFeedbackMode === "IMMEDIATE"
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  Show after each question
                </button>
                <button
                  type="button"
                  onClick={() => setEditFeedbackMode("REVEAL_AT_END")}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                    editFeedbackMode === "REVEAL_AT_END"
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-950/40 dark:text-blue-200"
                      : "border-border bg-background text-muted-foreground hover:text-foreground"
                  )}
                >
                  Reveal at finish
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateBank} disabled={updateBank.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {updateBank.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
