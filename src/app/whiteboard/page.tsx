"use client"

import { useState, useRef, useEffect, useCallback, Suspense } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Plus,
  Save,
  Trash2,
  Pencil,
  Eraser,
  Undo,
  Redo,
  Download,
  MousePointer2,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Type,
  StickyNote,
  ZoomIn,
  ZoomOut,
  Grid3X3,
  Maximize2,
  FolderOpen,
  X,
  Move,
  Sigma,
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

interface Transform {
  x: number
  y: number
  scale: number
}

type ToolType =
  | "select"
  | "pen"
  | "eraser"
  | "rect"
  | "circle"
  | "line"
  | "arrow"
  | "text"
  | "sticky"
  | "equation"
  | "pan"

type BackgroundType = "plain" | "grid" | "dots" | "graph"

interface BaseElement {
  id: string
  type: string
  x: number
  y: number
  rotation: number
}

interface StrokeElement extends BaseElement {
  type: "stroke"
  points: Point[]
  color: string
  lineWidth: number
}

interface EraserElement extends BaseElement {
  type: "eraser"
  points: Point[]
  lineWidth: number
}

interface RectElement extends BaseElement {
  type: "rect"
  width: number
  height: number
  fillColor: string
  strokeColor: string
  lineWidth: number
}

interface CircleElement extends BaseElement {
  type: "circle"
  radiusX: number
  radiusY: number
  fillColor: string
  strokeColor: string
  lineWidth: number
}

interface LineElement extends BaseElement {
  type: "line"
  endX: number
  endY: number
  color: string
  lineWidth: number
}

interface ArrowElement extends BaseElement {
  type: "arrow"
  endX: number
  endY: number
  color: string
  lineWidth: number
}

interface TextElement extends BaseElement {
  type: "text"
  text: string
  fontSize: number
  color: string
  width: number
}

interface StickyElement extends BaseElement {
  type: "sticky"
  text: string
  width: number
  height: number
  color: string
}

interface EquationElement extends BaseElement {
  type: "equation"
  latex: string
  fontSize: number
  color: string
}

type WhiteboardElement =
  | StrokeElement
  | EraserElement
  | RectElement
  | CircleElement
  | LineElement
  | ArrowElement
  | TextElement
  | StickyElement
  | EquationElement

interface BoardData {
  id: string
  title: string
  elements: WhiteboardElement[]
  background: BackgroundType
  createdAt: string
  updatedAt: string
}

interface WhiteboardStore {
  activeId: string | null
  order: string[]
  boards: Record<string, BoardData>
}

const STORAGE_KEY = "studyapp_whiteboards_v2"

// ============================================================================
// STORAGE HELPERS
// ============================================================================

function loadStore(): WhiteboardStore {
  if (typeof window === "undefined") return { activeId: null, order: [], boards: {} }
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
  } catch { /* ignore */ }
  return { activeId: null, order: [], boards: {} }
}

function saveStore(store: WhiteboardStore): void {
  if (typeof window === "undefined") return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch { /* ignore */ }
}

function genId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `el-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ============================================================================
// DRAWING HELPERS
// ============================================================================

function screenToWorld(sx: number, sy: number, t: Transform): Point {
  return { x: (sx - t.x) / t.scale, y: (sy - t.y) / t.scale }
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bg: BackgroundType,
  t: Transform
) {
  ctx.fillStyle = "#111827"
  ctx.fillRect(0, 0, w, h)

  if (bg === "plain") return

  ctx.save()
  ctx.translate(t.x, t.y)
  ctx.scale(t.scale, t.scale)

  const spacing = bg === "graph" ? 50 : 30
  const startX = Math.floor(-t.x / t.scale / spacing) * spacing - spacing
  const startY = Math.floor(-t.y / t.scale / spacing) * spacing - spacing
  const endX = startX + w / t.scale + spacing * 2
  const endY = startY + h / t.scale + spacing * 2

  if (bg === "dots") {
    ctx.fillStyle = "rgba(255,255,255,0.15)"
    for (let x = startX; x < endX; x += spacing) {
      for (let y = startY; y < endY; y += spacing) {
        ctx.beginPath()
        ctx.arc(x, y, 1.5 / t.scale, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else {
    // grid or graph
    ctx.strokeStyle = bg === "graph" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)"
    ctx.lineWidth = 1 / t.scale
    ctx.beginPath()
    for (let x = startX; x < endX; x += spacing) {
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
    }
    for (let y = startY; y < endY; y += spacing) {
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
    }
    ctx.stroke()

    if (bg === "graph") {
      // thicker axis lines
      ctx.strokeStyle = "rgba(255,255,255,0.25)"
      ctx.lineWidth = 2 / t.scale
      ctx.beginPath()
      ctx.moveTo(0, startY); ctx.lineTo(0, endY)
      ctx.moveTo(startX, 0); ctx.lineTo(endX, 0)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function renderElements(
  ctx: CanvasRenderingContext2D,
  elements: WhiteboardElement[],
  t: Transform,
  selectedId: string | null
) {
  ctx.save()
  ctx.translate(t.x, t.y)
  ctx.scale(t.scale, t.scale)

  for (const el of elements) {
    ctx.save()
    switch (el.type) {
      case "stroke": {
        if (el.points.length < 2) break
        ctx.strokeStyle = el.color
        ctx.lineWidth = el.lineWidth
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()
        ctx.moveTo(el.points[0].x, el.points[0].y)
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y)
        }
        ctx.stroke()
        break
      }
      case "eraser": {
        if (el.points.length < 2) break
        ctx.globalCompositeOperation = "destination-out"
        ctx.strokeStyle = "rgba(0,0,0,1)"
        ctx.lineWidth = el.lineWidth
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.beginPath()
        ctx.moveTo(el.points[0].x, el.points[0].y)
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y)
        }
        ctx.stroke()
        ctx.globalCompositeOperation = "source-over"
        break
      }
      case "rect": {
        if (el.fillColor && el.fillColor !== "transparent") {
          ctx.fillStyle = el.fillColor
          ctx.fillRect(el.x, el.y, el.width, el.height)
        }
        ctx.strokeStyle = el.strokeColor
        ctx.lineWidth = el.lineWidth
        ctx.strokeRect(el.x, el.y, el.width, el.height)
        break
      }
      case "circle": {
        ctx.beginPath()
        ctx.ellipse(el.x, el.y, Math.abs(el.radiusX), Math.abs(el.radiusY), 0, 0, Math.PI * 2)
        if (el.fillColor && el.fillColor !== "transparent") {
          ctx.fillStyle = el.fillColor
          ctx.fill()
        }
        ctx.strokeStyle = el.strokeColor
        ctx.lineWidth = el.lineWidth
        ctx.stroke()
        break
      }
      case "line": {
        ctx.strokeStyle = el.color
        ctx.lineWidth = el.lineWidth
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(el.endX, el.endY)
        ctx.stroke()
        break
      }
      case "arrow": {
        ctx.strokeStyle = el.color
        ctx.fillStyle = el.color
        ctx.lineWidth = el.lineWidth
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(el.endX, el.endY)
        ctx.stroke()
        // arrowhead
        const angle = Math.atan2(el.endY - el.y, el.endX - el.x)
        const headLen = 15
        ctx.beginPath()
        ctx.moveTo(el.endX, el.endY)
        ctx.lineTo(el.endX - headLen * Math.cos(angle - 0.4), el.endY - headLen * Math.sin(angle - 0.4))
        ctx.lineTo(el.endX - headLen * Math.cos(angle + 0.4), el.endY - headLen * Math.sin(angle + 0.4))
        ctx.closePath()
        ctx.fill()
        break
      }
      case "text": {
        ctx.font = `${el.fontSize}px Inter, system-ui, sans-serif`
        ctx.fillStyle = el.color
        ctx.textBaseline = "top"
        const lines = el.text.split("\n")
        lines.forEach((line, i) => {
          ctx.fillText(line, el.x, el.y + i * el.fontSize * 1.3)
        })
        break
      }
      case "sticky": {
        // shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)"
        ctx.fillRect(el.x + 3, el.y + 3, el.width, el.height)
        // note
        ctx.fillStyle = el.color
        ctx.fillRect(el.x, el.y, el.width, el.height)
        // text
        ctx.fillStyle = "#1a1a1a"
        ctx.font = "14px Inter, system-ui, sans-serif"
        ctx.textBaseline = "top"
        const words = el.text.split(" ")
        let currentLine = ""
        let yy = el.y + 12
        const maxW = el.width - 16
        for (const word of words) {
          const test = currentLine ? `${currentLine} ${word}` : word
          if (ctx.measureText(test).width > maxW && currentLine) {
            ctx.fillText(currentLine, el.x + 8, yy)
            yy += 18
            currentLine = word
          } else {
            currentLine = test
          }
        }
        if (currentLine) ctx.fillText(currentLine, el.x + 8, yy)
        break
      }
      case "equation": {
        ctx.font = `italic ${el.fontSize}px 'Times New Roman', serif`
        ctx.fillStyle = el.color
        ctx.textBaseline = "top"
        ctx.fillText(el.latex, el.x, el.y)
        break
      }
    }

    // Selection highlight
    if (selectedId === el.id) {
      const b = getElementBounds(el)
      if (b) {
        ctx.strokeStyle = "#3b82f6"
        ctx.lineWidth = 2 / t.scale
        ctx.setLineDash([6 / t.scale, 4 / t.scale])
        ctx.strokeRect(b.x - 5, b.y - 5, b.w + 10, b.h + 10)
        ctx.setLineDash([])
      }
    }
    ctx.restore()
  }
  ctx.restore()
}

function getElementBounds(el: WhiteboardElement): { x: number; y: number; w: number; h: number } | null {
  switch (el.type) {
    case "stroke":
    case "eraser": {
      if (el.points.length === 0) return null
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (const p of el.points) {
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
        maxX = Math.max(maxX, p.x)
        maxY = Math.max(maxY, p.y)
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }
    case "rect":
      return { x: el.x, y: el.y, w: el.width, h: el.height }
    case "circle":
      return { x: el.x - Math.abs(el.radiusX), y: el.y - Math.abs(el.radiusY), w: Math.abs(el.radiusX) * 2, h: Math.abs(el.radiusY) * 2 }
    case "line":
    case "arrow":
      return {
        x: Math.min(el.x, el.endX),
        y: Math.min(el.y, el.endY),
        w: Math.abs(el.endX - el.x),
        h: Math.abs(el.endY - el.y),
      }
    case "text":
      return { x: el.x, y: el.y, w: el.width || 200, h: el.fontSize * 1.5 }
    case "sticky":
      return { x: el.x, y: el.y, w: el.width, h: el.height }
    case "equation":
      return { x: el.x, y: el.y, w: 200, h: el.fontSize * 1.5 }
  }
}

function hitTest(el: WhiteboardElement, wx: number, wy: number): boolean {
  const b = getElementBounds(el)
  if (!b) return false
  const pad = 8
  return wx >= b.x - pad && wx <= b.x + b.w + pad && wy >= b.y - pad && wy <= b.y + b.h + pad
}

// ============================================================================
// WHITEBOARD CONTENT COMPONENT
// ============================================================================

function WhiteboardContent() {
  useSession()

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Store state
  const [store, setStore] = useState<WhiteboardStore>({ activeId: null, order: [], boards: {} })
  const [hydrated, setHydrated] = useState(false)

  // Canvas state
  const [elements, setElements] = useState<WhiteboardElement[]>([])
  const [undoStack, setUndoStack] = useState<WhiteboardElement[][]>([])
  const [redoStack, setRedoStack] = useState<WhiteboardElement[][]>([])
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 })
  const [background, setBackground] = useState<BackgroundType>("grid")

  // Tool state
  const [tool, setTool] = useState<ToolType>("pen")
  const [color, setColor] = useState("#3b82f6")
  const [fillColor, setFillColor] = useState("transparent")
  const [lineWidth, setLineWidth] = useState(3)
  const [fontSize, setFontSize] = useState(20)

  // Interaction state
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const drawingRef = useRef(false)
  const panRef = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null)
  const currentElRef = useRef<WhiteboardElement | null>(null)
  const dragRef = useRef<{ offsetX: number; offsetY: number } | null>(null)
  const startPointRef = useRef<Point | null>(null)

  // UI state
  const [newDialogOpen, setNewDialogOpen] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [textDialog, setTextDialog] = useState<{ open: boolean; x: number; y: number; text: string }>({ open: false, x: 0, y: 0, text: "" })
  const [stickyDialog, setStickyDialog] = useState<{ open: boolean; x: number; y: number; text: string }>({ open: false, x: 0, y: 0, text: "" })
  const [equationDialog, setEquationDialog] = useState<{ open: boolean; x: number; y: number; latex: string }>({ open: false, x: 0, y: 0, latex: "" })
  const [editTextDialog, setEditTextDialog] = useState<{ open: boolean; id: string; text: string }>({ open: false, id: "", text: "" })
  const [bgMenuOpen, setBgMenuOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)

  // Derived
  const activeBoard = store.activeId ? store.boards[store.activeId] : null

  // Color presets
  const COLORS = ["#ffffff", "#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"]
  const STICKY_COLORS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fecaca", "#e9d5ff", "#fed7aa"]

  // ============================================================================
  // HYDRATION
  // ============================================================================

  useEffect(() => {
    const loaded = loadStore()
    setStore(loaded)
    if (loaded.activeId && loaded.boards[loaded.activeId]) {
      const board = loaded.boards[loaded.activeId]
      setElements(board.elements || [])
      setBackground(board.background || "grid")
    }
    setHydrated(true)
  }, [])

  // ============================================================================
  // CANVAS RENDERING
  // ============================================================================

  // Stable ref so the resize effect never needs to re-run due to renderFrame identity changes
  const renderFrameRef = useRef<() => void>(() => {})

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const w = Math.max(1, Math.round(rect.width || canvas.clientWidth || canvas.width))
    const h = Math.max(1, Math.round(rect.height || canvas.clientHeight || canvas.height))
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1

    // Always render in CSS/logical pixels so pointer coordinates and drawing
    // coordinates stay aligned, while still using a DPR-aware backing store.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    drawBackground(ctx, w, h, background, transform)
    renderElements(ctx, elements, transform, selectedId)
    if (currentElRef.current) {
      renderElements(ctx, [currentElRef.current], transform, null)
    }
  }, [elements, transform, background, selectedId])

  // Keep the ref in sync so the resize handler always calls the latest version
  useEffect(() => {
    renderFrameRef.current = renderFrame
  }, [renderFrame])

  useEffect(() => {
    const id = requestAnimationFrame(renderFrame)
    return () => cancelAnimationFrame(id)
  }, [renderFrame])

  // Resize canvas to fill container — runs ONCE on mount + on actual window resize only.
  // Using renderFrameRef (not renderFrame directly) keeps this effect stable so it never
  // re-runs on state changes, which would reset the canvas context mid-draw.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const syncCanvasSize = () => {
      const canvas = canvasRef.current
      if (!canvas || !container) return
      const rect = container.getBoundingClientRect()
      const cssWidth = Math.max(1, Math.round(rect.width))
      const cssHeight = Math.max(1, Math.round(rect.height))
      const dpr = window.devicePixelRatio || 1
      const pixelWidth = Math.max(1, Math.round(cssWidth * dpr))
      const pixelHeight = Math.max(1, Math.round(cssHeight * dpr))

      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = `${cssHeight}px`
      renderFrameRef.current()
    }

    const observer = new ResizeObserver(() => {
      syncCanvasSize()
    })

    syncCanvasSize()
    const rafId = window.requestAnimationFrame(syncCanvasSize)
    observer.observe(container)
    window.addEventListener("resize", syncCanvasSize)

    return () => {
      window.cancelAnimationFrame(rafId)
      observer.disconnect()
      window.removeEventListener("resize", syncCanvasSize)
    }
  }, []) // Empty deps — only mount/unmount, never triggered by state changes

  // ============================================================================
  // HISTORY
  // ============================================================================

  const pushUndo = useCallback(() => {
    setUndoStack((prev) => [...prev.slice(-50), elements])
    setRedoStack([])
  }, [elements])

  const undo = useCallback(() => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setRedoStack((r) => [...r, elements])
      setElements(last)
      setHasChanges(true)
      return prev.slice(0, -1)
    })
  }, [elements])

  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setUndoStack((u) => [...u, elements])
      setElements(last)
      setHasChanges(true)
      return prev.slice(0, -1)
    })
  }, [elements])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo() }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedId && !textDialog.open && !stickyDialog.open && !equationDialog.open && !editTextDialog.open) {
          e.preventDefault()
          pushUndo()
          setElements((prev) => prev.filter((el) => el.id !== selectedId))
          setSelectedId(null)
          setHasChanges(true)
        }
      }
      if (e.key === "Escape") {
        setSelectedId(null)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [undo, redo, selectedId, pushUndo, textDialog.open, stickyDialog.open, equationDialog.open, editTextDialog.open])

  // ============================================================================
  // POINTER HANDLERS
  // ============================================================================

  const getCanvasPos = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { sx: 0, sy: 0 }
    const rect = canvas.getBoundingClientRect()
    return { sx: e.clientX - rect.left, sy: e.clientY - rect.top }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 1 || (e.button === 0 && (e.altKey || tool === "pan"))) {
        // Middle-click or alt+click or pan tool: start panning
        panRef.current = { startX: e.clientX, startY: e.clientY, tx: transform.x, ty: transform.y }
        return
      }
      if (e.button !== 0) return

      const { sx, sy } = getCanvasPos(e)
      const world = screenToWorld(sx, sy, transform)

      if (tool === "select") {
        // Hit test in reverse order (topmost first)
        let found: WhiteboardElement | null = null
        for (let i = elements.length - 1; i >= 0; i--) {
          if (hitTest(elements[i], world.x, world.y)) {
            found = elements[i]
            break
          }
        }
        if (found) {
          setSelectedId(found.id)
          dragRef.current = { offsetX: world.x - found.x, offsetY: world.y - found.y }
        } else {
          setSelectedId(null)
        }
        return
      }

      if (tool === "text") {
        setTextDialog({ open: true, x: world.x, y: world.y, text: "" })
        return
      }
      if (tool === "sticky") {
        setStickyDialog({ open: true, x: world.x, y: world.y, text: "" })
        return
      }
      if (tool === "equation") {
        setEquationDialog({ open: true, x: world.x, y: world.y, latex: "" })
        return
      }

      drawingRef.current = true
      startPointRef.current = world

      if (tool === "pen") {
        currentElRef.current = {
          id: genId(),
          type: "stroke",
          x: 0,
          y: 0,
          rotation: 0,
          points: [world],
          color,
          lineWidth,
        }
      } else if (tool === "eraser") {
        currentElRef.current = {
          id: genId(),
          type: "eraser",
          x: 0,
          y: 0,
          rotation: 0,
          points: [world],
          lineWidth: lineWidth * 4,
        }
      } else if (tool === "rect") {
        currentElRef.current = {
          id: genId(),
          type: "rect",
          x: world.x,
          y: world.y,
          rotation: 0,
          width: 0,
          height: 0,
          fillColor,
          strokeColor: color,
          lineWidth,
        }
      } else if (tool === "circle") {
        currentElRef.current = {
          id: genId(),
          type: "circle",
          x: world.x,
          y: world.y,
          rotation: 0,
          radiusX: 0,
          radiusY: 0,
          fillColor,
          strokeColor: color,
          lineWidth,
        }
      } else if (tool === "line") {
        currentElRef.current = {
          id: genId(),
          type: "line",
          x: world.x,
          y: world.y,
          rotation: 0,
          endX: world.x,
          endY: world.y,
          color,
          lineWidth,
        }
      } else if (tool === "arrow") {
        currentElRef.current = {
          id: genId(),
          type: "arrow",
          x: world.x,
          y: world.y,
          rotation: 0,
          endX: world.x,
          endY: world.y,
          color,
          lineWidth,
        }
      }
    },
    [tool, transform, color, fillColor, lineWidth, elements, getCanvasPos]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Panning
      if (panRef.current) {
        const dx = e.clientX - panRef.current.startX
        const dy = e.clientY - panRef.current.startY
        setTransform((prev) => ({ ...prev, x: panRef.current!.tx + dx, y: panRef.current!.ty + dy }))
        return
      }

      // Dragging selected element
      if (tool === "select" && dragRef.current && selectedId) {
        const { sx, sy } = getCanvasPos(e)
        const world = screenToWorld(sx, sy, transform)
        setElements((prev) =>
          prev.map((el) => {
            if (el.id !== selectedId) return el
            const newX = world.x - dragRef.current!.offsetX
            const newY = world.y - dragRef.current!.offsetY
            if (el.type === "stroke" || el.type === "eraser") {
              const dx = newX - el.x
              const dy = newY - el.y
              return { ...el, x: newX, y: newY, points: el.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) }
            }
            return { ...el, x: newX, y: newY }
          })
        )
        setHasChanges(true)
        return
      }

      if (!drawingRef.current || !currentElRef.current) return

      const { sx, sy } = getCanvasPos(e)
      const world = screenToWorld(sx, sy, transform)

      const cur = currentElRef.current
      if (cur.type === "stroke" || cur.type === "eraser") {
        cur.points.push(world)
      } else if (cur.type === "rect") {
        ;(cur as RectElement).width = world.x - cur.x
        ;(cur as RectElement).height = world.y - cur.y
      } else if (cur.type === "circle") {
        const start = startPointRef.current!
        ;(cur as CircleElement).x = (start.x + world.x) / 2
        ;(cur as CircleElement).y = (start.y + world.y) / 2
        ;(cur as CircleElement).radiusX = Math.abs(world.x - start.x) / 2
        ;(cur as CircleElement).radiusY = Math.abs(world.y - start.y) / 2
      } else if (cur.type === "line" || cur.type === "arrow") {
        ;(cur as LineElement).endX = world.x
        ;(cur as LineElement).endY = world.y
      }
      // Trigger re-render
      renderFrame()
    },
    [tool, transform, selectedId, getCanvasPos, renderFrame]
  )

  const onPointerUp = useCallback(() => {
    if (panRef.current) { panRef.current = null; return }
    if (dragRef.current) {
      pushUndo()
      dragRef.current = null
      return
    }
    if (!drawingRef.current || !currentElRef.current) return
    drawingRef.current = false
    pushUndo()
    setElements((prev) => [...prev, currentElRef.current!])
    currentElRef.current = null
    setHasChanges(true)
  }, [pushUndo])

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey || e.metaKey) {
        // Pinch zoom
        const rect = canvas.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const delta = -e.deltaY * 0.002
        setTransform((prev) => {
          const newScale = Math.min(Math.max(prev.scale * (1 + delta), 0.1), 10)
          const ratio = newScale / prev.scale
          return { scale: newScale, x: mx - (mx - prev.x) * ratio, y: my - (my - prev.y) * ratio }
        })
      } else {
        // Scroll pan
        setTransform((prev) => ({ ...prev, x: prev.x - e.deltaX, y: prev.y - e.deltaY }))
      }
    }
    canvas.addEventListener("wheel", handler, { passive: false })
    return () => canvas.removeEventListener("wheel", handler)
  }, [])

  // ============================================================================
  // BOARD MANAGEMENT
  // ============================================================================

  const createBoard = useCallback((title: string) => {
    const id = genId()
    const board: BoardData = {
      id,
      title: title || "Untitled Board",
      elements: [],
      background: "grid",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setStore((prev) => {
      const next = { ...prev, activeId: id, order: [...prev.order, id], boards: { ...prev.boards, [id]: board } }
      saveStore(next)
      return next
    })
    setElements([])
    setUndoStack([])
    setRedoStack([])
    setBackground("grid")
    setTransform({ x: 0, y: 0, scale: 1 })
    setSelectedId(null)
    setHasChanges(false)
  }, [])

  const openBoard = useCallback((id: string) => {
    setStore((prev) => {
      const next = { ...prev, activeId: id }
      saveStore(next)
      return next
    })
    const board = store.boards[id]
    if (board) {
      setElements(board.elements || [])
      setBackground(board.background || "grid")
    }
    setUndoStack([])
    setRedoStack([])
    setTransform({ x: 0, y: 0, scale: 1 })
    setSelectedId(null)
    setHasChanges(false)
    setListOpen(false)
  }, [store.boards])

  const saveBoard = useCallback(() => {
    if (!store.activeId) return
    setStore((prev) => {
      const board = prev.boards[prev.activeId!]
      if (!board) return prev
      const updated: BoardData = { ...board, elements, background, updatedAt: new Date().toISOString() }
      const next = { ...prev, boards: { ...prev.boards, [prev.activeId!]: updated } }
      saveStore(next)
      return next
    })
    setHasChanges(false)
    toast.success("Board saved")
  }, [store.activeId, elements, background])

  const deleteBoard = useCallback((id: string) => {
    setStore((prev) => {
      const { [id]: _, ...rest } = prev.boards
      const newOrder = prev.order.filter((o) => o !== id)
      const newActive = prev.activeId === id ? (newOrder[0] || null) : prev.activeId
      const next = { activeId: newActive, order: newOrder, boards: rest }
      saveStore(next)
      if (newActive && rest[newActive]) {
        setElements(rest[newActive].elements || [])
        setBackground(rest[newActive].background || "grid")
      } else {
        setElements([])
      }
      return next
    })
    setHasChanges(false)
    setSelectedId(null)
  }, [])

  const exportPng = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `${activeBoard?.title || "whiteboard"}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
    toast.success("Exported as PNG")
  }, [activeBoard?.title])

  // ============================================================================
  // TOOL CONFIG
  // ============================================================================

  const tools: { key: ToolType; icon: React.ReactNode; label: string }[] = [
    { key: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select (V)" },
    { key: "pen", icon: <Pencil className="h-4 w-4" />, label: "Pen (P)" },
    { key: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Eraser (E)" },
    { key: "rect", icon: <Square className="h-4 w-4" />, label: "Rectangle (R)" },
    { key: "circle", icon: <Circle className="h-4 w-4" />, label: "Ellipse (C)" },
    { key: "line", icon: <Minus className="h-4 w-4" />, label: "Line (L)" },
    { key: "arrow", icon: <ArrowRight className="h-4 w-4" />, label: "Arrow (A)" },
    { key: "text", icon: <Type className="h-4 w-4" />, label: "Text (T)" },
    { key: "sticky", icon: <StickyNote className="h-4 w-4" />, label: "Sticky Note (S)" },
    { key: "equation", icon: <Sigma className="h-4 w-4" />, label: "Equation (Q)" },
    { key: "pan", icon: <Move className="h-4 w-4" />, label: "Pan (H)" },
  ]

  // Tool shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const map: Record<string, ToolType> = { v: "select", p: "pen", e: "eraser", r: "rect", c: "circle", l: "line", a: "arrow", t: "text", s: "sticky", q: "equation", h: "pan" }
      const t = map[e.key.toLowerCase()]
      if (t) setTool(t)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Skeleton className="h-64 w-64 rounded-xl" />
      </div>
    )
  }

  // No active board - show board list / create
  if (!activeBoard) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground font-heading">Whiteboards</h1>
          <Button onClick={() => setNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Board
          </Button>
        </div>
        {store.order.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <StickyNote className="h-12 w-12 mx-auto mb-4 opacity-40" />
            <p>No whiteboards yet. Create one to start!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {store.order.map((id) => {
              const board = store.boards[id]
              if (!board) return null
              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
                  onClick={() => openBoard(id)}
                >
                  <div>
                    <h3 className="font-medium text-card-foreground">{board.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {board.elements.length} elements · {new Date(board.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Delete "${board.title}"?`)) deleteBoard(id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Whiteboard</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="boardTitle">Title</Label>
                <Input
                  id="boardTitle"
                  placeholder="My Whiteboard"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { createBoard(newTitle); setNewDialogOpen(false); setNewTitle("") }
                  }}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
                <Button onClick={() => { createBoard(newTitle); setNewDialogOpen(false); setNewTitle("") }}>Create</Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // Active board - full canvas
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border shrink-0 flex-wrap">
        {/* Board switcher */}
        <div className="relative">
          <Button size="sm" variant="ghost" onClick={() => setListOpen(!listOpen)} title="Boards">
            <FolderOpen className="h-4 w-4 mr-1" />
            <span className="max-w-[120px] truncate text-sm">{activeBoard.title}</span>
          </Button>
          {listOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-popover border border-border rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
              {store.order.map((id) => {
                const b = store.boards[id]
                if (!b) return null
                return (
                  <button
                    key={id}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors",
                      id === store.activeId && "bg-muted font-medium"
                    )}
                    onClick={() => openBoard(id)}
                  >
                    {b.title}
                  </button>
                )
              })}
              <button
                className="w-full text-left px-3 py-2 text-sm text-blue-500 hover:bg-muted transition-colors border-t border-border"
                onClick={() => { setListOpen(false); setNewDialogOpen(true) }}
              >
                <Plus className="h-3 w-3 inline mr-1" />
                New board
              </button>
            </div>
          )}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Tools */}
        <div className="flex items-center gap-0.5">
          {tools.map((t) => (
            <button
              key={t.key}
              onClick={() => setTool(t.key)}
              title={t.label}
              className={cn(
                "p-2 rounded-lg transition-colors",
                tool === t.key ? "bg-blue-600 text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t.icon}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn("h-6 w-6 rounded-full border-2 transition-transform", color === c ? "border-blue-500 scale-110" : "border-transparent")}
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Line width */}
        <div className="flex items-center gap-1">
          <Label className="text-xs text-muted-foreground sr-only">Size</Label>
          <input
            type="range"
            min={1}
            max={20}
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            className="w-20 h-1.5 accent-blue-500"
          />
        </div>

        <div className="flex-1" />

        {/* Background */}
        <div className="relative">
          <Button size="sm" variant="ghost" onClick={() => setBgMenuOpen(!bgMenuOpen)} title="Background">
            <Grid3X3 className="h-4 w-4" />
          </Button>
          {bgMenuOpen && (
            <div className="absolute top-full right-0 mt-1 w-36 bg-popover border border-border rounded-lg shadow-xl z-50">
              {(["plain", "grid", "dots", "graph"] as BackgroundType[]).map((bg) => (
                <button
                  key={bg}
                  className={cn("w-full text-left px-3 py-2 text-sm capitalize hover:bg-muted", background === bg && "bg-muted font-medium")}
                  onClick={() => { setBackground(bg); setBgMenuOpen(false); setHasChanges(true) }}
                >
                  {bg}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setTransform((p) => ({ ...p, scale: Math.max(p.scale * 0.8, 0.1) }))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(transform.scale * 100)}%</span>
          <Button size="sm" variant="ghost" onClick={() => setTransform((p) => ({ ...p, scale: Math.min(p.scale * 1.25, 10) }))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setTransform({ x: 0, y: 0, scale: 1 })} title="Reset view">
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-5 w-px bg-border" />

        {/* Actions */}
        <Button size="sm" variant="ghost" onClick={undo} disabled={undoStack.length === 0} title="Undo">
          <Undo className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={redo} disabled={redoStack.length === 0} title="Redo">
          <Redo className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={exportPng} title="Export PNG">
          <Download className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete "${activeBoard.title}"?`)) deleteBoard(store.activeId!) }} title="Delete board" className="text-red-500 hover:text-red-600">
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={saveBoard} disabled={!hasChanges} className={hasChanges ? "bg-blue-600 text-white hover:bg-blue-700" : ""}>
          <Save className="h-4 w-4 mr-1" />
          Save
        </Button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="flex-1 overflow-hidden cursor-crosshair relative" style={{ touchAction: "none" }}>
        <canvas
          ref={canvasRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onDoubleClick={(e) => {
            // Double-click to edit text/sticky/equation
            const { sx, sy } = getCanvasPos(e as unknown as React.PointerEvent)
            const world = screenToWorld(sx, sy, transform)
            for (let i = elements.length - 1; i >= 0; i--) {
              const el = elements[i]
              if (hitTest(el, world.x, world.y)) {
                if (el.type === "text") {
                  setEditTextDialog({ open: true, id: el.id, text: el.text })
                  return
                }
                if (el.type === "sticky") {
                  setEditTextDialog({ open: true, id: el.id, text: el.text })
                  return
                }
                if (el.type === "equation") {
                  setEditTextDialog({ open: true, id: el.id, text: el.latex })
                  return
                }
              }
            }
          }}
          className="absolute inset-0 block h-full w-full"
          style={{ cursor: tool === "pan" ? "grab" : tool === "select" ? "default" : "crosshair" }}
        />
      </div>

      {/* Text Dialog */}
      <Dialog open={textDialog.open} onOpenChange={(open) => { if (!open) setTextDialog((p) => ({ ...p, open: false })) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Text</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <textarea
              className="w-full p-3 rounded-lg bg-muted border border-border text-foreground resize-none"
              rows={3}
              placeholder="Type here..."
              value={textDialog.text}
              onChange={(e) => setTextDialog((p) => ({ ...p, text: e.target.value }))}
              autoFocus
            />
            <div className="flex items-center gap-2">
              <Label className="text-sm">Size:</Label>
              <input type="range" min={12} max={72} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="flex-1 accent-blue-500" />
              <span className="text-sm text-muted-foreground w-8">{fontSize}</span>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setTextDialog((p) => ({ ...p, open: false }))}>Cancel</Button>
              <Button onClick={() => {
                if (!textDialog.text.trim()) return
                pushUndo()
                setElements((prev) => [...prev, {
                  id: genId(), type: "text", x: textDialog.x, y: textDialog.y, rotation: 0,
                  text: textDialog.text, fontSize, color, width: 300,
                }])
                setTextDialog({ open: false, x: 0, y: 0, text: "" })
                setHasChanges(true)
              }}>Add</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky Note Dialog */}
      <Dialog open={stickyDialog.open} onOpenChange={(open) => { if (!open) setStickyDialog((p) => ({ ...p, open: false })) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Sticky Note</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <textarea
              className="w-full p-3 rounded-lg bg-muted border border-border text-foreground resize-none"
              rows={3}
              placeholder="Note content..."
              value={stickyDialog.text}
              onChange={(e) => setStickyDialog((p) => ({ ...p, text: e.target.value }))}
              autoFocus
            />
            <div>
              <Label className="text-sm mb-2 block">Color:</Label>
              <div className="flex gap-2">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    className={cn("h-8 w-8 rounded-lg border-2", fillColor === c ? "border-blue-500" : "border-transparent")}
                    style={{ backgroundColor: c }}
                    onClick={() => setFillColor(c)}
                  />
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStickyDialog((p) => ({ ...p, open: false }))}>Cancel</Button>
              <Button onClick={() => {
                pushUndo()
                setElements((prev) => [...prev, {
                  id: genId(), type: "sticky", x: stickyDialog.x, y: stickyDialog.y, rotation: 0,
                  text: stickyDialog.text || "New note", width: 180, height: 180,
                  color: fillColor === "transparent" ? "#fef08a" : fillColor,
                }])
                setStickyDialog({ open: false, x: 0, y: 0, text: "" })
                setHasChanges(true)
              }}>Add</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Equation Dialog */}
      <Dialog open={equationDialog.open} onOpenChange={(open) => { if (!open) setEquationDialog((p) => ({ ...p, open: false })) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Equation</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Write your equation using LaTeX-like notation (e.g. x² + y² = r², ∫f(x)dx, Σn=1 to ∞)</p>
            <Input
              placeholder="e.g. E = mc², f(x) = ax² + bx + c"
              value={equationDialog.latex}
              onChange={(e) => setEquationDialog((p) => ({ ...p, latex: e.target.value }))}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (!equationDialog.latex.trim()) return
                  pushUndo()
                  setElements((prev) => [...prev, {
                    id: genId(), type: "equation", x: equationDialog.x, y: equationDialog.y, rotation: 0,
                    latex: equationDialog.latex, fontSize: 24, color,
                  }])
                  setEquationDialog({ open: false, x: 0, y: 0, latex: "" })
                  setHasChanges(true)
                }
              }}
            />
            <div className="flex items-center gap-2">
              <Label className="text-sm">Size:</Label>
              <input type="range" min={14} max={60} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="flex-1 accent-blue-500" />
              <span className="text-sm text-muted-foreground w-8">{fontSize}</span>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEquationDialog((p) => ({ ...p, open: false }))}>Cancel</Button>
              <Button onClick={() => {
                if (!equationDialog.latex.trim()) return
                pushUndo()
                setElements((prev) => [...prev, {
                  id: genId(), type: "equation", x: equationDialog.x, y: equationDialog.y, rotation: 0,
                  latex: equationDialog.latex, fontSize, color,
                }])
                setEquationDialog({ open: false, x: 0, y: 0, latex: "" })
                setHasChanges(true)
              }}>Add</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Text/Sticky/Equation Dialog */}
      <Dialog open={editTextDialog.open} onOpenChange={(open) => { if (!open) setEditTextDialog((p) => ({ ...p, open: false })) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Content</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <textarea
              className="w-full p-3 rounded-lg bg-muted border border-border text-foreground resize-none"
              rows={3}
              value={editTextDialog.text}
              onChange={(e) => setEditTextDialog((p) => ({ ...p, text: e.target.value }))}
              autoFocus
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditTextDialog((p) => ({ ...p, open: false }))}>Cancel</Button>
              <Button onClick={() => {
                pushUndo()
                setElements((prev) => prev.map((el) => {
                  if (el.id !== editTextDialog.id) return el
                  if (el.type === "text") return { ...el, text: editTextDialog.text }
                  if (el.type === "sticky") return { ...el, text: editTextDialog.text }
                  if (el.type === "equation") return { ...el, latex: editTextDialog.text }
                  return el
                }))
                setEditTextDialog({ open: false, id: "", text: "" })
                setHasChanges(true)
              }}>Save</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Board Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Whiteboard</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="boardTitle">Title</Label>
              <Input
                id="boardTitle"
                placeholder="My Whiteboard"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { createBoard(newTitle); setNewDialogOpen(false); setNewTitle("") } }}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => { createBoard(newTitle); setNewDialogOpen(false); setNewTitle("") }}>Create</Button>
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
