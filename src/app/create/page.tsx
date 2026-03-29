"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useCreateStudySet } from "@/hooks/useStudy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Plus, Trash2, Upload, Download, GripVertical, Loader2, FileText } from "lucide-react"
import toast from "react-hot-toast"
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"
import { CategoryPicker } from "@/components/category-picker"
import { parseCSVContent } from "@/lib/csv-parser"
import { ImportTextModal } from "@/components/import-text-modal"

interface CardData {
  id: string
  term: string
  definition: string
}

export default function CreatePage() {
  const router = useRouter()
  const { status } = useSession()
  const createSet = useCreateStudySet()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [cards, setCards] = useState<CardData[]>([
    { id: "1", term: "", definition: "" },
    { id: "2", term: "", definition: "" },
  ])
  const [importModalOpen, setImportModalOpen] = useState(false)

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const addCard = () => {
    setCards([...cards, { id: Date.now().toString(), term: "", definition: "" }])
  }

  const removeCard = (id: string) => {
    if (cards.length <= 2) {
      toast.error("You need at least 2 cards")
      return
    }
    setCards(cards.filter((c) => c.id !== id))
  }

  const updateCard = (id: string, field: "term" | "definition", value: string) => {
    setCards(cards.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(cards)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setCards(items)
  }

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const parsed = parseCSVContent(text)
      const newCards: CardData[] = parsed.map((card, index) => ({
        id: `import-${index}-${Date.now()}`,
        term: card.term,
        definition: card.definition,
      })).filter((c) => c.term || c.definition)

      if (newCards.length > 0) {
        setCards(newCards)
        toast.success(`Imported ${newCards.length} cards`)
      } else {
        toast.error("No valid cards found in CSV")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }

  const handleExportCSV = () => {
    const csv = cards
      .filter((c) => c.term || c.definition)
      .map((c) => `"${c.term.replace(/"/g, '""')}","${c.definition.replace(/"/g, '""')}"`)
      .join("\n")
    
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title || "flashcards"}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Please enter a title")
      return
    }

    const validCards = cards.filter((c) => c.term.trim() && c.definition.trim())
    if (validCards.length < 2) {
      toast.error("Please add at least 2 complete cards")
      return
    }

    try {
      const result = await createSet.mutateAsync({
        title,
        description,
        isPublic,
        categoryId,
        cards: validCards.map((c) => ({ term: c.term, definition: c.definition })),
      })
      
      toast.success("Study set created!")
      router.push(`/sets/${result.id}`)
    } catch {
      toast.error("Failed to create study set")
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Create a new study set</h1>

      <form onSubmit={handleSubmit}>
        {/* Set Details */}
        <Card className="p-6 mb-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter a title, like 'Biology - Chapter 22: Evolution'"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add a description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="public">Make this set public</Label>
                <p className="text-sm text-muted-foreground">Anyone can find and study this set</p>
              </div>
              <Switch
                id="public"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
            <div>
              <Label>Category (optional)</Label>
              <p className="text-sm text-muted-foreground mb-2">Choose a category to help others find your set</p>
              <CategoryPicker
                value={categoryId}
                onChange={setCategoryId}
              />
            </div>
          </div>
        </Card>

        {/* Import/Export */}
        <div className="flex gap-2 mb-6">
          <input
            type="file"
            accept=".csv"
            onChange={handleImportCSV}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setImportModalOpen(true)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Import from Text
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleExportCSV}
            disabled={cards.filter((c) => c.term || c.definition).length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Cards */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="cards">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {cards.map((card, index) => (
                  <Draggable key={card.id} draggableId={card.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`rounded-xl border border-border bg-card shadow-sm p-4 ${snapshot.isDragging ? "shadow-lg" : ""}`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            {...provided.dragHandleProps}
                            className="mt-3 cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs text-muted-foreground">TERM</Label>
                              <Input
                                placeholder="Enter term"
                                value={card.term}
                                onChange={(e) => updateCard(card.id, "term", e.target.value)}
                                className="mt-1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">DEFINITION</Label>
                              <Input
                                placeholder="Enter definition"
                                value={card.definition}
                                onChange={(e) => updateCard(card.id, "definition", e.target.value)}
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCard(card.id)}
                            className="mt-6"
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 ml-9">
                          {index + 1}
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

        <Button
          type="button"
          variant="outline"
          onClick={addCard}
          className="w-full mt-4 border-dashed"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>

        {/* Import Text Modal */}
        <ImportTextModal
          open={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={(imported) => {
            const newCards: CardData[] = imported.map((c, i) => ({
              id: `import-${i}-${Date.now()}`,
              term: c.term,
              definition: c.definition,
            }))
            if (newCards.length > 0) {
              setCards(newCards)
              toast.success(`Imported ${newCards.length} cards`)
            }
          }}
        />

        {/* Submit */}
        <div className="flex justify-end gap-4 mt-8">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={createSet.isPending}>
            {createSet.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Set
          </Button>
        </div>
      </form>
    </div>
  )
}
