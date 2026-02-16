"use client"

import { useState, useRef, useEffect, useCallback, Suspense } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  Plus, 
  Save, 
  Trash2, 
  ArrowLeft,
  Pencil,
  Eraser,
  Undo,
  Redo,
  Download,
  PenTool
} from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

// ============================================================================
// TYPES
// ============================================================================

interface Point {
  x: number
  y: number
}

interface Stroke {
  id: string
  points: Point[]
  color: string
  lineWidth: number
  tool: "pen" | "eraser"
}

interface LocalBoard {
  id: string
  title: string
  strokes: Stroke[]
  createdAt: string
  updatedAt: string
}

interface WhiteboardStore {
  activeId: string | null
  order: string[]
  boards: Record<string, LocalBoard>
}

const STORAGE_KEY = "studyapp_whiteboards_v1"

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function loadStore(): WhiteboardStore {
  if (typeof window === "undefined") {
    return { activeId: null, order: [], boards: {} }
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as WhiteboardStore
      return {
        activeId: parsed.activeId ?? null,
        order: Array.isArray(parsed.order) ? parsed.order : [],
        boards: parsed.boards && typeof parsed.boards === "object" ? parsed.boards : {},
      }
    }
  } catch {
    // ignore
  }
  return { activeId: null, order: [], boards: {} }
}

function saveStore(store: WhiteboardStore): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // ignore
  }
}

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }
  return `board-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// ============================================================================
// CANVAS DRAWING HELPERS
// ============================================================================

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke, bgColor: string): void {
  if (stroke.points.length < 2) return
  
  ctx.beginPath()
  ctx.strokeStyle = stroke.tool === "eraser" ? bgColor : stroke.color
  ctx.lineWidth = stroke.tool === "eraser" ? stroke.lineWidth * 3 : stroke.lineWidth
  ctx.lineCap = "round"
  ctx.lineJoin = "round"
  
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y)
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y)
  }
  ctx.stroke()
}

function redrawCanvas(
  canvas: HTMLCanvasElement,
  strokes: Stroke[],
  currentStroke: Stroke | null
): void {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  
  const bgColor = "#1a1a2e"
  
  // Clear and fill background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  
  // Draw all committed strokes
  for (const stroke of strokes) {
    drawStroke(ctx, stroke, bgColor)
  }
  
  // Draw current stroke in progress
  if (currentStroke) {
    drawStroke(ctx, currentStroke, bgColor)
  }
}

// ============================================================================
// WHITEBOARD CONTENT COMPONENT
// ============================================================================

function WhiteboardContent() {
  const { data: session } = useSession()
  
  // Canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Store state
  const [store, setStore] = useState<WhiteboardStore>({ activeId: null, order: [], boards: {} })
  const [hydrated, setHydrated] = useState(false)
  
  // Drawing state
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null)
  const [undoStack, setUndoStack] = useState<Stroke[][]>([])
  const [redoStack, setRedoStack] = useState<Stroke[][]>([])
  const isDrawingRef = useRef(false)
  
  // Tool state
  const [tool, setTool] = useState<"pen" | "eraser">("pen")
  const [color, setColor] = useState("#3b82f6")
  const [lineWidth, setLineWidth] = useState(3)
  
  // UI state
  const [hasChanges, setHasChanges] = useState(false)
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  
  // Derived state
  const activeBoard = store.activeId ? store.boards[store.activeId] : null
  
  // Color presets
  const colors = ["#000000", "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#ffffff"]

  // ============================================================================
  // HYDRATION - Load from localStorage once
  // ============================================================================
  useEffect(() => {
    const loaded = loadStore()
    setStore(loaded)
    
    // Load strokes for active board
    if (loaded.activeId && loaded.boards[loaded.activeId]) {
      setStrokes(loaded.boards[loaded.activeId].strokes || [])
    }
    
    setHydrated(true)
  }, [])

  // ============================================================================
  // SYNC STROKES WHEN ACTIVE BOARD CHANGES
  // ============================================================================
  const prevActiveIdRef = useRef<string | null>(null)
  
  useEffect(() => {
    if (!hydrated) return
    
    // Only update if activeId actually changed
    if (prevActiveIdRef.current === store.activeId) return
    prevActiveIdRef.current = store.activeId
    
    if (store.activeId && store.boards[store.activeId]) {
      setStrokes(store.boards[store.activeId].strokes || [])
    } else {
      setStrokes([])
    }
    setUndoStack([])
    setRedoStack([])
    setHasChanges(false)
  }, [hydrated, store.activeId, store.boards])

  // ============================================================================
  // CANVAS RESIZE - Use ResizeObserver, only resize when needed
  // ============================================================================
  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!container || !canvas) return
    
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      const newWidth = Math.floor(rect.width)
      const newHeight = Math.floor(rect.height)
      
      // Only resize if dimensions actually changed
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth
        canvas.height = newHeight
      }
      
      // Always redraw after resize check
      redrawCanvas(canvas, strokes, currentStroke)
    }
    
    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(container)
    
    // Initial size
    resizeCanvas()
    
    return () => observer.disconnect()
  }, [strokes, currentStroke])

  // ============================================================================
  // REDRAW ON STROKE CHANGES
  // ============================================================================
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    redrawCanvas(canvas, strokes, currentStroke)
  }, [strokes, currentStroke])

  // ============================================================================
  // POINTER EVENT HANDLERS
  // ============================================================================
  const getCanvasPoint = useCallback((e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!store.activeId) return
    
    e.currentTarget.setPointerCapture(e.pointerId)
    isDrawingRef.current = true
    
    const point = getCanvasPoint(e)
    setCurrentStroke({
      id: `stroke-${Date.now()}`,
      points: [point],
      color,
      lineWidth,
      tool,
    })
  }, [store.activeId, color, lineWidth, tool, getCanvasPoint])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !currentStroke) return
    
    const point = getCanvasPoint(e)
    setCurrentStroke(prev => {
      if (!prev) return null
      return {
        ...prev,
        points: [...prev.points, point],
      }
    })
  }, [currentStroke, getCanvasPoint])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    
    if (!isDrawingRef.current || !currentStroke) {
      isDrawingRef.current = false
      return
    }
    
    isDrawingRef.current = false
    
    if (currentStroke.points.length >= 2) {
      setUndoStack(prev => [...prev, strokes])
      setRedoStack([])
      setStrokes(prev => [...prev, currentStroke])
      setHasChanges(true)
    }
    
    setCurrentStroke(null)
  }, [currentStroke, strokes])

  const handlePointerCancel = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    isDrawingRef.current = false
    setCurrentStroke(null)
  }, [])

  // ============================================================================
  // UNDO / REDO / CLEAR
  // ============================================================================
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    setRedoStack(r => [...r, strokes])
    setStrokes(prev)
    setUndoStack(u => u.slice(0, -1))
    setHasChanges(true)
  }, [undoStack, strokes])

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    setUndoStack(u => [...u, strokes])
    setStrokes(next)
    setRedoStack(r => r.slice(0, -1))
    setHasChanges(true)
  }, [redoStack, strokes])

  const handleClear = useCallback(() => {
    if (strokes.length === 0) return
    if (!confirm("Clear the entire whiteboard?")) return
    setUndoStack(u => [...u, strokes])
    setRedoStack([])
    setStrokes([])
    setHasChanges(true)
  }, [strokes])

  // ============================================================================
  // SAVE
  // ============================================================================
  const handleSave = useCallback(() => {
    if (!store.activeId) {
      toast.error("No whiteboard selected")
      return
    }
    
    const now = new Date().toISOString()
    const newStore: WhiteboardStore = {
      ...store,
      boards: {
        ...store.boards,
        [store.activeId]: {
          ...store.boards[store.activeId],
          strokes,
          updatedAt: now,
        },
      },
    }
    
    setStore(newStore)
    saveStore(newStore)
    setHasChanges(false)
    toast.success("Whiteboard saved!")
  }, [store, strokes])

  // ============================================================================
  // CREATE NEW BOARD
  // ============================================================================
  const handleCreateBoard = useCallback(() => {
    const id = generateId()
    const now = new Date().toISOString()
    
    const newBoard: LocalBoard = {
      id,
      title: newTitle.trim() || "Untitled Whiteboard",
      strokes: [],
      createdAt: now,
      updatedAt: now,
    }
    
    const newStore: WhiteboardStore = {
      activeId: id,
      order: [id, ...store.order],
      boards: {
        ...store.boards,
        [id]: newBoard,
      },
    }
    
    setStore(newStore)
    saveStore(newStore)
    setStrokes([])
    setUndoStack([])
    setRedoStack([])
    setHasChanges(false)
    setNewDialogOpen(false)
    setNewTitle("")
    
    // Update prev ref to prevent re-sync
    prevActiveIdRef.current = id
    
    toast.success("Whiteboard created!")
  }, [newTitle, store])

  // ============================================================================
  // SELECT BOARD
  // ============================================================================
  const handleSelectBoard = useCallback((id: string) => {
    // Save current board first if there are changes
    if (store.activeId && hasChanges) {
      const now = new Date().toISOString()
      const updatedStore: WhiteboardStore = {
        ...store,
        activeId: id,
        boards: {
          ...store.boards,
          [store.activeId]: {
            ...store.boards[store.activeId],
            strokes,
            updatedAt: now,
          },
        },
      }
      setStore(updatedStore)
      saveStore(updatedStore)
    } else {
      const updatedStore = { ...store, activeId: id }
      setStore(updatedStore)
      saveStore(updatedStore)
    }
    
    setHasChanges(false)
  }, [store, hasChanges, strokes])

  // ============================================================================
  // DELETE BOARD
  // ============================================================================
  const handleDeleteBoard = useCallback(() => {
    if (!store.activeId) return
    if (!confirm("Delete this whiteboard?")) return
    
    const newOrder = store.order.filter(id => id !== store.activeId)
    const newBoards = { ...store.boards }
    delete newBoards[store.activeId]
    
    const newActiveId = newOrder[0] || null
    
    const newStore: WhiteboardStore = {
      activeId: newActiveId,
      order: newOrder,
      boards: newBoards,
    }
    
    setStore(newStore)
    saveStore(newStore)
    
    if (newActiveId && newBoards[newActiveId]) {
      setStrokes(newBoards[newActiveId].strokes || [])
    } else {
      setStrokes([])
    }
    
    setUndoStack([])
    setRedoStack([])
    setHasChanges(false)
    prevActiveIdRef.current = newActiveId
    
    toast.success("Whiteboard deleted")
  }, [store])

  // ============================================================================
  // DOWNLOAD
  // ============================================================================
  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const title = activeBoard?.title || "whiteboard"
    const link = document.createElement("a")
    link.download = `${title}.png`
    link.href = canvas.toDataURL()
    link.click()
  }, [activeBoard])

  // ============================================================================
  // RENDER: Not signed in
  // ============================================================================
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <PenTool className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">Whiteboard</h1>
        <p className="text-muted-foreground mb-4">
          Sign in to create and edit whiteboards
        </p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  // ============================================================================
  // RENDER: Main UI
  // ============================================================================
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="border-b border-border bg-background p-4 shrink-0">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/library" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-foreground">
              {activeBoard?.title || "Whiteboard"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Board selector */}
            {store.order.length > 0 && (
              <select
                className="h-8 rounded-md border border-border bg-background px-2 text-sm text-foreground"
                value={store.activeId ?? ""}
                onChange={(e) => handleSelectBoard(e.target.value)}
              >
                <option value="" disabled>Select board</option>
                {store.order.map((id) => (
                  <option key={id} value={id}>
                    {store.boards[id]?.title || "Untitled"}
                  </option>
                ))}
              </select>
            )}
            
            <Button variant="outline" size="sm" onClick={() => setNewDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
            
            <div className="w-px h-6 bg-border mx-1" />

            {/* Drawing Tools */}
            <Button
              variant={tool === "pen" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("pen")}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === "eraser" ? "default" : "outline"}
              size="sm"
              onClick={() => setTool("eraser")}
            >
              <Eraser className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Colors */}
            {colors.slice(0, 6).map((c) => (
              <button
                key={c}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-transform",
                  color === c ? "border-white ring-2 ring-primary scale-110" : "border-transparent hover:scale-105"
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}

            <div className="w-px h-6 bg-border mx-1" />

            {/* Line Width */}
            <input
              type="range"
              min={1}
              max={20}
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="w-20 h-2 accent-primary"
            />
            <span className="text-xs text-muted-foreground w-6">{lineWidth}px</span>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Undo/Redo */}
            <Button variant="outline" size="sm" onClick={handleUndo} disabled={undoStack.length === 0}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRedo} disabled={redoStack.length === 0}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear} disabled={strokes.length === 0}>
              <Trash2 className="h-4 w-4" />
            </Button>

            <div className="w-px h-6 bg-border mx-1" />

            {/* Actions */}
            <Button variant="outline" size="sm" onClick={handleDownload} disabled={!store.activeId}>
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!hasChanges || !store.activeId}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            {store.activeId && (
              <Button variant="destructive" size="sm" onClick={handleDeleteBoard}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Board List */}
        <div className="w-56 border-r border-border bg-muted/30 p-4 overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground text-sm">My Whiteboards</h2>
            <Button variant="ghost" size="sm" onClick={() => setNewDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {store.order.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No whiteboards yet. Create one to get started!
            </p>
          ) : (
            <div className="space-y-1">
              {store.order.map((id) => {
                const board = store.boards[id]
                if (!board) return null
                return (
                  <button
                    key={id}
                    onClick={() => handleSelectBoard(id)}
                    className={cn(
                      "w-full text-left p-2 rounded-lg transition-colors text-sm",
                      store.activeId === id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <PenTool className="h-4 w-4 shrink-0" />
                      <span className="truncate">{board.title}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 bg-muted/10 overflow-hidden relative">
          {!store.activeId ? (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 text-center max-w-md">
                <PenTool className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <h2 className="text-lg font-semibold mb-2 text-foreground">
                  Create or Select a Whiteboard
                </h2>
                <p className="text-muted-foreground mb-4">
                  Choose an existing whiteboard from the sidebar or create a new one
                </p>
                <Button onClick={() => setNewDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Whiteboard
                </Button>
              </Card>
            </div>
          ) : (
            <div 
              ref={containerRef} 
              className="w-full h-full"
            >
              <canvas
                ref={canvasRef}
                className="block cursor-crosshair touch-none"
                style={{ width: "100%", height: "100%" }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={handlePointerCancel}
              />
            </div>
          )}
        </div>
      </div>

      {/* New Whiteboard Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Whiteboard</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newTitle">Whiteboard Title</Label>
              <Input
                id="newTitle"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., History Notes, Math Diagrams"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTitle.trim()) {
                    handleCreateBoard()
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateBoard} disabled={!newTitle.trim()}>
                Create Whiteboard
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================================
// PAGE EXPORT
// ============================================================================

export default function WhiteboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Skeleton className="h-64 w-64 rounded-xl" />
      </div>
    }>
      <WhiteboardContent />
    </Suspense>
  )
}
