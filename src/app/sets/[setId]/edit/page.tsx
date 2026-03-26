"use client"

import { use, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStudySet, useUpdateStudySet, useCreateCard, useUpdateCard, useDeleteCard, useReorderCards } from "@/hooks/useStudy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card as CardComponent, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { Plus, GripVertical, Trash2, Save, Download, Upload, ArrowLeft } from "lucide-react"
import toast from "react-hot-toast"
import { parseCSVContent } from "@/lib/csv-parser"

interface PageProps {
  params: Promise<{ setId: string }>
}

interface EditableCard {
  id: string
  term: string
  definition: string
  isNew?: boolean
}

export default function EditSetPage({ params }: PageProps) {
  const { setId } = use(params)
  const router = useRouter()
  const { data: set, isLoading } = useStudySet(setId)
  const updateSet = useUpdateStudySet()
  const createCard = useCreateCard()
  const updateCard = useUpdateCard()
  const deleteCard = useDeleteCard()
  const reorderCards = useReorderCards()

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [cards, setCards] = useState<EditableCard[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Load set data
  useEffect(() => {
    if (set) {
      setTitle(set.title)
      setDescription(set.description || "")
      setIsPublic(set.isPublic)
      setCards(
        (set.cards || []).map((card) => ({
          id: card.id,
          term: card.term,
          definition: card.definition,
        }))
      )
    }
  }, [set])

  const addCard = () => {
    const newCard: EditableCard = {
      id: `new-${Date.now()}`,
      term: "",
      definition: "",
      isNew: true,
    }
    setCards([...cards, newCard])
    setHasChanges(true)
  }

  const updateCardField = (id: string, field: "term" | "definition", value: string) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
    setHasChanges(true)
  }

  const removeCard = (id: string) => {
    setCards(cards.filter((c) => c.id !== id))
    setHasChanges(true)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(cards)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setCards(items)
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    const validCards = cards.filter((c) => c.term.trim() && c.definition.trim())
    if (validCards.length < 2) {
      toast.error("Please add at least 2 cards with terms and definitions")
      return
    }

    setIsSaving(true)
    try {
      // Update set metadata
      await updateSet.mutateAsync({
        id: setId,
        title: title.trim(),
        description: description.trim(),
        isPublic,
      })

      // Get original cards for comparison
      const originalCards = set?.cards || []
      const currentIds = new Set(validCards.filter((c) => !c.isNew).map((c) => c.id))

      // Delete removed cards
      for (const origCard of originalCards) {
        if (!currentIds.has(origCard.id)) {
          await deleteCard.mutateAsync({ setId, cardId: origCard.id })
        }
      }

      // Create or update cards
      for (let i = 0; i < validCards.length; i++) {
        const card = validCards[i]
        if (card.isNew) {
          await createCard.mutateAsync({
            setId,
            term: card.term,
            definition: card.definition,
            orderIndex: i,
          })
        } else {
          const origCard = originalCards.find((c) => c.id === card.id)
          if (
            origCard &&
            (origCard.term !== card.term || origCard.definition !== card.definition)
          ) {
            await updateCard.mutateAsync({
              setId,
              cardId: card.id,
              term: card.term,
              definition: card.definition,
              orderIndex: i,
            })
          }
        }
      }

      // Reorder cards
      const orderedIds = validCards.filter((c) => !c.isNew).map((c) => c.id)
      if (orderedIds.length > 0) {
        await reorderCards.mutateAsync({ setId, cardIds: orderedIds })
      }

      toast.success("Set saved successfully!")
      setHasChanges(false)
      router.push(`/sets/${setId}`)
    } catch (error) {
      console.error("Failed to save set:", error)
      toast.error("Failed to save set. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportCSV = () => {
    const csv = cards
      .filter((c) => c.term.trim() && c.definition.trim())
      .map((c) => `"${c.term.replace(/"/g, '""')}","${c.definition.replace(/"/g, '""')}"`)
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title || "flashcards"}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Exported to CSV")
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const newCards: EditableCard[] = []

      const parsed = parseCSVContent(text)
      for (const card of parsed) {
        newCards.push({
          id: `new-${Date.now()}-${Math.random()}`,
          term: card.term,
          definition: card.definition,
          isNew: true,
        })
      }

      if (newCards.length > 0) {
        setCards([...cards, ...newCards])
        setHasChanges(true)
        toast.success(`Imported ${newCards.length} cards`)
      } else {
        toast.error("No valid cards found in CSV")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Skeleton className="h-12 w-64 mb-8" />
        <Skeleton className="h-40 w-full rounded-xl mb-4" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    )
  }

  if (!set) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Set not found</h1>
        <Button onClick={() => router.push("/library")}>Go to Library</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Edit Study Set</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv,.txt"
              onChange={handleImportCSV}
              className="hidden"
            />
            <span className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </span>
          </label>
          <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Set Info */}
      <CardComponent className="mb-6">
        <CardContent className="p-6 space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter a title..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setHasChanges(true)
              }}
            />
          </div>
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setHasChanges(true)
              }}
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Visibility</Label>
              <p className="text-sm text-muted-foreground">
                {isPublic ? "Anyone can find this set" : "Only you can see this set"}
              </p>
            </div>
            <Switch
              checked={isPublic}
              onCheckedChange={(checked) => {
                setIsPublic(checked)
                setHasChanges(true)
              }}
            />
          </div>
        </CardContent>
      </CardComponent>

      {/* Cards */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Cards ({cards.length})</h2>
        <Button variant="outline" onClick={addCard}>
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="cards">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-3"
            >
              {cards.map((card, index) => (
                <Draggable key={card.id} draggableId={card.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white rounded-lg border p-4 transition-shadow ${
                        snapshot.isDragging ? "shadow-lg" : ""
                      }`}
                    >
                      <div className="flex gap-3">
                        <div
                          {...provided.dragHandleProps}
                          className="flex items-center text-muted-foreground hover:text-foreground cursor-grab"
                        >
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <Input
                            placeholder="Term"
                            value={card.term}
                            onChange={(e) =>
                              updateCardField(card.id, "term", e.target.value)
                            }
                          />
                          <Input
                            placeholder="Definition"
                            value={card.definition}
                            onChange={(e) =>
                              updateCardField(card.id, "definition", e.target.value)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeCard(card.id)}
                          className="text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Card Button */}
      <Button
        variant="outline"
        onClick={addCard}
        className="w-full mt-4 border-dashed"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Card
      </Button>
    </div>
  )
}
