"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  MousePointer2, Pencil, Highlighter, Eraser, Pointer, Square, Circle,
  Triangle, Minus, ArrowRight, Diamond, Type, StickyNote, Image as ImageIcon,
  Link2, Sigma, Hand, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Save,
  Download, Upload, Plus, Trash2, Grid3X3,
  Copy, Group, Ungroup, Lock, Unlock, ChevronUp, ChevronDown, ChevronsUp,
  ChevronsDown, Keyboard, X, FileJson, FileImage,
  FileText, Presentation, Globe, GlobeLock, LayoutGrid, Menu,
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignEndVertical, AlignCenterVertical,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
  Bold, Italic, Underline, Edit3, ChevronLeft, ChevronRight,
  Shapes, PenTool, PlusCircle, ChevronDown as ChevronDownIcon,
} from "lucide-react"
import toast from "react-hot-toast"

import type {
  ToolType, BackgroundType, StyleState, WBBoard, WBFrame,
} from "@/lib/whiteboard/types"
import {
  DEFAULT_STYLE, COLORS, STICKY_COLORS, BACKGROUND_OPTIONS, KEYBOARD_SHORTCUTS,
} from "@/lib/whiteboard/types"
import {
  saveBoard as saveBoardToStore, deleteBoard as deleteBoardFromStore,
  getUserBoards, createBoard as createBoardInStore, getBoardById,
} from "@/lib/whiteboard/storage"
import {
  exportCanvasPNG, exportCanvasSVG, exportCanvasPDF,
  exportBoardJSON, importBoardJSON,
} from "@/lib/whiteboard/export-utils"
import { ConfirmDialog } from "@/components/whiteboard/ConfirmDialog"
import { useWhiteboardCanvas } from "@/components/whiteboard/useWhiteboardCanvas"

// ============================================================================
// Equation Preview (live KaTeX preview in equation dialog)
// ============================================================================

function EquationPreview({ latex }: { latex: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ref.current || !latex.trim()) return
    let cancelled = false
    import("katex").then(({ default: katex }) => {
      if (cancelled || !ref.current) return
      try {
        katex.render(latex, ref.current, { throwOnError: false, displayMode: true })
        setError(null)
      } catch (e: any) {
        setError(e?.message || "Invalid LaTeX")
      }
    })
    return () => { cancelled = true }
  }, [latex])

  if (error) return <span className="text-red-400 text-xs">{error}</span>
  return <div ref={ref} className="text-white" />
}

// ============================================================================
// Toolbar Popover - Shared component for grouped tool menus
// ============================================================================

function ToolPopover({
  open,
  onClose,
  trigger,
  children,
}: {
  open: boolean
  onClose: () => void
  trigger: React.ReactNode
  children: React.ReactNode
}) {
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open, onClose])

  return (
    <div className="relative" ref={popoverRef}>
      {trigger}
      {open && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
          <div className="bg-[#1a1d2e]/90 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-2 min-w-[120px]">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Board Templates (extracted from inline JSON for cleaner code)
// ============================================================================

const BOARD_TEMPLATES: { label: string; emoji: string; title: string; canvasJSON: string }[] = [
  { label: "Blank", emoji: "\u2b1c", title: "Untitled Board", canvasJSON: "" },
  { label: "Cornell Notes", emoji: "\ud83d\udcdd", title: "Cornell Notes", canvasJSON: JSON.stringify({ version: "6.0.0", objects: [
    { type: "Rect", left: 40, top: 40, width: 180, height: 520, fill: "transparent", stroke: "#3b82f6", strokeWidth: 2 },
    { type: "Rect", left: 40, top: 520, width: 740, height: 80, fill: "transparent", stroke: "#3b82f6", strokeWidth: 2 },
    { type: "Rect", left: 220, top: 40, width: 560, height: 480, fill: "transparent", stroke: "#3b82f6", strokeWidth: 2 },
    { type: "IText", text: "Cues / Keywords", left: 130, top: 20, fontSize: 13, fill: "#3b82f6", fontWeight: "bold", originX: "center" },
    { type: "IText", text: "Notes", left: 500, top: 20, fontSize: 13, fill: "#3b82f6", fontWeight: "bold", originX: "center" },
    { type: "IText", text: "Summary", left: 400, top: 504, fontSize: 13, fill: "#3b82f6", fontWeight: "bold", originX: "center" },
  ]}) },
  { label: "Mind Map", emoji: "\ud83e\udde0", title: "Mind Map", canvasJSON: JSON.stringify({ version: "6.0.0", objects: [
    { type: "Ellipse", left: 340, top: 220, rx: 90, ry: 45, fill: "#3b82f620", stroke: "#3b82f6", strokeWidth: 2, originX: "center", originY: "center" },
    { type: "IText", text: "Main Topic", left: 340, top: 220, fontSize: 18, fill: "#3b82f6", fontWeight: "bold", originX: "center", originY: "center" },
  ]}) },
  { label: "Kanban", emoji: "\ud83d\udccb", title: "Kanban Board", canvasJSON: JSON.stringify({ version: "6.0.0", objects: [
    { type: "Rect", left: 20, top: 20, width: 200, height: 460, fill: "#3b82f610", stroke: "#3b82f640", strokeWidth: 1, rx: 8, ry: 8 },
    { type: "Rect", left: 240, top: 20, width: 200, height: 460, fill: "#f59e0b10", stroke: "#f59e0b40", strokeWidth: 1, rx: 8, ry: 8 },
    { type: "Rect", left: 460, top: 20, width: 200, height: 460, fill: "#22c55e10", stroke: "#22c55e40", strokeWidth: 1, rx: 8, ry: 8 },
    { type: "IText", text: "To Do", left: 120, top: 38, fontSize: 15, fill: "#3b82f6", fontWeight: "bold", originX: "center" },
    { type: "IText", text: "In Progress", left: 340, top: 38, fontSize: 15, fill: "#f59e0b", fontWeight: "bold", originX: "center" },
    { type: "IText", text: "Done", left: 560, top: 38, fontSize: 15, fill: "#22c55e", fontWeight: "bold", originX: "center" },
  ]}) },
  { label: "Timeline", emoji: "\ud83d\udcc5", title: "Timeline", canvasJSON: JSON.stringify({ version: "6.0.0", objects: [
    { type: "Line", x1: 40, y1: 240, x2: 760, y2: 240, stroke: "#3b82f6", strokeWidth: 3 },
    { type: "Ellipse", left: 160, top: 240, rx: 10, ry: 10, fill: "#3b82f6", originX: "center", originY: "center" },
    { type: "Ellipse", left: 340, top: 240, rx: 10, ry: 10, fill: "#3b82f6", originX: "center", originY: "center" },
    { type: "Ellipse", left: 520, top: 240, rx: 10, ry: 10, fill: "#3b82f6", originX: "center", originY: "center" },
    { type: "Ellipse", left: 700, top: 240, rx: 10, ry: 10, fill: "#3b82f6", originX: "center", originY: "center" },
    { type: "IText", text: "Event 1", left: 160, top: 210, fontSize: 13, fill: "#ffffff", originX: "center", originY: "bottom" },
    { type: "IText", text: "Event 2", left: 340, top: 270, fontSize: 13, fill: "#ffffff", originX: "center", originY: "top" },
    { type: "IText", text: "Event 3", left: 520, top: 210, fontSize: 13, fill: "#ffffff", originX: "center", originY: "bottom" },
    { type: "IText", text: "Event 4", left: 700, top: 270, fontSize: 13, fill: "#ffffff", originX: "center", originY: "top" },
  ]}) },
]

// ============================================================================
// Main Whiteboard Page Component
// ============================================================================

export default function WhiteboardPage() {
  return (
    <React.Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-4rem)]"><div className="animate-pulse text-muted-foreground">Loading whiteboard...</div></div>}>
      <WhiteboardApp />
    </React.Suspense>
  )
}

function WhiteboardApp() {
  const defaultUser = { id: "local-user", username: "User", isAdmin: false }
  const user = defaultUser

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <WhiteboardMain user={user} isAdmin={false} onLogout={() => {}} />
    </div>
  )
}

// ============================================================================
// Whiteboard Main - Board Dashboard or Canvas
// ============================================================================

interface WhiteboardMainProps {
  user: { id: string; username: string; isAdmin: boolean }
  isAdmin: boolean
  onLogout: () => void
}

function WhiteboardMain({ user, isAdmin, onLogout }: WhiteboardMainProps) {
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null)
  const [boards, setBoards] = useState<WBBoard[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setBoards(getUserBoards(user.id))
  }, [user.id, refreshKey])

  const handleCreateBoard = (title: string, templateJSON?: string) => {
    const board = createBoardInStore(user.id, title)
    if (templateJSON) {
      const updated = { ...board, canvasJSON: templateJSON }
      saveBoardToStore(updated)
    }
    setActiveBoardId(board.id)
    setRefreshKey((k) => k + 1)
  }

  const handleDeleteBoard = (id: string) => {
    deleteBoardFromStore(id)
    if (activeBoardId === id) setActiveBoardId(null)
    setRefreshKey((k) => k + 1)
  }

  const handleDuplicateBoard = (id: string) => {
    const original = getBoardById(id)
    if (!original) return
    const copy = createBoardInStore(user.id, original.title + " (copy)")
    const updated = {
      ...copy,
      canvasJSON: original.canvasJSON,
      background: original.background,
      customBgColor: original.customBgColor,
      frames: original.frames.map((f) => ({ ...f, id: crypto.randomUUID() })),
      thumbnail: original.thumbnail,
    }
    saveBoardToStore(updated)
    setRefreshKey((k) => k + 1)
    toast.success("Board duplicated")
  }

  const handleBack = () => {
    setActiveBoardId(null)
    setRefreshKey((k) => k + 1)
  }

  if (activeBoardId) {
    return (
      <WhiteboardCanvas
        boardId={activeBoardId}
        user={user}
        isAdmin={isAdmin}
        onBack={handleBack}
        onLogout={onLogout}
      />
    )
  }

  return (
    <BoardDashboard
      boards={boards}
      user={user}
      isAdmin={isAdmin}
      onCreateBoard={handleCreateBoard}
      onOpenBoard={setActiveBoardId}
      onDeleteBoard={handleDeleteBoard}
      onDuplicateBoard={handleDuplicateBoard}
      onLogout={onLogout}
    />
  )
}

// ============================================================================
// Board Dashboard
// ============================================================================

interface BoardDashboardProps {
  boards: WBBoard[]
  user: { id: string; username: string; isAdmin: boolean }
  isAdmin: boolean
  onCreateBoard: (title: string, templateJSON?: string) => void
  onOpenBoard: (id: string) => void
  onDeleteBoard: (id: string) => void
  onDuplicateBoard: (id: string) => void
  onLogout: () => void
}

function BoardDashboard({ boards, onCreateBoard, onOpenBoard, onDeleteBoard, onDuplicateBoard }: BoardDashboardProps) {
  const [newTitle, setNewTitle] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: "", title: "" })

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-heading">My Whiteboards</h1>
            <p className="text-muted-foreground mt-1">Create and manage your visual workspaces</p>
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Board
          </button>
        </div>

        {/* Board Grid */}
        {boards.length === 0 ? (
          <div className="text-center py-20">
            <LayoutGrid className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-foreground mb-2">No whiteboards yet</h3>
            <p className="text-muted-foreground mb-6">Create your first whiteboard to get started</p>
            <button
              onClick={() => setShowNew(true)}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Create Whiteboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group relative rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                onClick={() => onOpenBoard(board.id)}
              >
                <div className="h-32 bg-muted/30 relative">
                  {board.thumbnail ? (
                    <img src={board.thumbnail} alt={board.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <LayoutGrid className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {board.isPublic ? (
                      <span className="p-1 rounded-md bg-black/40"><Globe className="h-3.5 w-3.5 text-green-400" /></span>
                    ) : (
                      <span className="p-1 rounded-md bg-black/40"><GlobeLock className="h-3.5 w-3.5 text-gray-400" /></span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); onDuplicateBoard(board.id) }}
                      className="p-1 rounded-md bg-black/40 text-gray-300 hover:text-white hover:bg-black/60 transition-colors"
                      aria-label="Duplicate board"
                      title="Duplicate"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDelete({ open: true, id: board.id, title: board.title })
                      }}
                      className="p-1 rounded-md bg-black/40 text-red-400 hover:text-red-300 hover:bg-black/60 transition-colors"
                      aria-label="Delete board"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-card-foreground truncate">{board.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(board.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Board Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-lg mx-4 rounded-2xl bg-[#1e2133]/95 backdrop-blur-xl border border-white/[0.08] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">New Whiteboard</h3>
            <p className="text-xs text-gray-400 mb-2">Start from a template</p>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {BOARD_TEMPLATES.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setSelectedTemplate(i)
                    if (!newTitle || BOARD_TEMPLATES.some((t) => t.title === newTitle)) setNewTitle(tpl.title)
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-colors",
                    selectedTemplate === i ? "border-blue-500 bg-blue-600/10" : "border-white/[0.08] hover:bg-white/5"
                  )}
                >
                  <span className="text-2xl">{tpl.emoji}</span>
                  <span className="text-[11px] text-gray-300 leading-tight">{tpl.label}</span>
                </button>
              ))}
            </div>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Board title..."
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onCreateBoard(newTitle || BOARD_TEMPLATES[selectedTemplate].title, BOARD_TEMPLATES[selectedTemplate].canvasJSON)
                  setNewTitle("")
                  setSelectedTemplate(0)
                  setShowNew(false)
                }
                if (e.key === "Escape") setShowNew(false)
              }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/5">Cancel</button>
              <button
                onClick={() => {
                  onCreateBoard(
                    newTitle || BOARD_TEMPLATES[selectedTemplate].title,
                    BOARD_TEMPLATES[selectedTemplate].canvasJSON
                  )
                  setNewTitle("")
                  setSelectedTemplate(0)
                  setShowNew(false)
                }}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete.open}
        title="Delete Board"
        message={`Are you sure you want to delete "${confirmDelete.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { onDeleteBoard(confirmDelete.id); setConfirmDelete({ open: false, id: "", title: "" }) }}
        onCancel={() => setConfirmDelete({ open: false, id: "", title: "" })}
      />
    </div>
  )
}

// ============================================================================
// Whiteboard Canvas (Full Editor) - Zoom-Style Redesign
// ============================================================================

interface WhiteboardCanvasProps {
  boardId: string
  user: { id: string; username: string; isAdmin: boolean }
  isAdmin: boolean
  onBack: () => void
  onLogout: () => void
}

function WhiteboardCanvas({ boardId, onBack }: WhiteboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  // Board state
  const [board, setBoard] = useState<WBBoard | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [tool, setTool] = useState<ToolType>("select")
  const [style, setStyle] = useState<StyleState>({ ...DEFAULT_STYLE })
  const [background, setBackground] = useState<BackgroundType>("grid")
  const [customBgColor, setCustomBgColor] = useState("#ffffff")
  const [isDark, setIsDark] = useState(false)
  const [selectedObj, setSelectedObj] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)

  // UI panels
  const [showBgPicker, setShowBgPicker] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showFrames, setShowFrames] = useState(false)
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [showStickyDialog, setShowStickyDialog] = useState(false)
  const [showEquationDialog, setShowEquationDialog] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [stickyInput, setStickyInput] = useState("")
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0])
  const [equationInput, setEquationInput] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [presentMode, setPresentMode] = useState(false)
  const [isRenamingTitle, setIsRenamingTitle] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [selectedCount, setSelectedCount] = useState(0)

  // Popover states for grouped tools
  const [showDrawPopover, setShowDrawPopover] = useState(false)
  const [showShapesPopover, setShowShapesPopover] = useState(false)
  const [showInsertPopover, setShowInsertPopover] = useState(false)

  // Frames state
  const [frames, setFrames] = useState<WBFrame[]>([])
  const [activeFrameId, setActiveFrameId] = useState("")

  // Canvas hook
  const canvasActions = useWhiteboardCanvas({
    canvasContainerRef: containerRef,
    tool, style, background, customBgColor, isDark,
    onObjectSelected: (obj) => {
      setSelectedObj(obj)
      setTimeout(() => {
        const c = canvasActions.getCanvas()
        if (!c) { setSelectedCount(obj ? 1 : 0); return }
        const active = c.getActiveObject() as any
        if (!active) { setSelectedCount(0); return }
        setSelectedCount(active.type === "activeSelection" ? active.getObjects().length : 1)
      }, 0)
    },
    onCanvasReady: () => {},
    onModified: () => setHasChanges(true),
  })

  // Load board
  useEffect(() => {
    const b = getBoardById(boardId)
    if (b) {
      setBoard(b)
      setBackground(b.background)
      setCustomBgColor(b.customBgColor || "#ffffff")
      setFrames(b.frames || [])
      setActiveFrameId(b.activeFrameId || b.frames?.[0]?.id || "")
      if (b.canvasJSON) {
        setTimeout(() => canvasActions.loadCanvasJSON(b.canvasJSON), 500)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])

  // Detect dark mode
  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark")
    setIsDark(dark)
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  // Auto-save every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      if (board && hasChanges) handleSave()
    }, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, hasChanges])

  // Zoom tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setZoom(Math.round(canvasActions.getZoom() * 100))
    }, 500)
    return () => clearInterval(interval)
  }, [canvasActions])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") return

      const toolMap: Record<string, ToolType> = {
        v: "select", p: "pen", h: "highlighter", e: "eraser",
        l: "laser", r: "rect", c: "circle", t: "text",
        s: "sticky", n: "line", a: "arrow", d: "diamond", q: "equation",
      }
      if (!e.ctrlKey && !e.metaKey && toolMap[e.key.toLowerCase()]) {
        setTool(toolMap[e.key.toLowerCase()])
        return
      }

      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        setShowShortcuts(true)
        return
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault(); canvasActions.undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault(); canvasActions.redo()
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedObj) { e.preventDefault(); canvasActions.deleteSelected() }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault(); canvasActions.duplicateSelected()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault(); canvasActions.selectAll()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "g" && !e.shiftKey) {
        e.preventDefault(); canvasActions.groupSelected()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "g" && e.shiftKey) {
        e.preventDefault(); canvasActions.ungroupSelected()
      }
      if (e.key === "Escape") {
        if (presentMode) setPresentMode(false)
        setShowBgPicker(false); setShowExportMenu(false)
        setShowShortcuts(false); setShowTextDialog(false)
        setShowStickyDialog(false); setShowEquationDialog(false)
        setShowFrames(false); setShowDrawPopover(false)
        setShowShapesPopover(false); setShowInsertPopover(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [canvasActions, selectedObj, presentMode])

  // Save board
  const handleSave = useCallback(() => {
    if (!board) return
    const json = canvasActions.serializeCanvas()
    const thumb = canvasActions.getMinimapDataUrl()
    if (thumb) setThumbnailUrl(thumb)
    const updated: WBBoard = {
      ...board,
      canvasJSON: json,
      background,
      customBgColor,
      frames,
      activeFrameId,
      updatedAt: new Date().toISOString(),
      thumbnail: thumb || board.thumbnail,
    }
    saveBoardToStore(updated)
    setBoard(updated)
    setHasChanges(false)
    setLastSaved(new Date().toISOString())
    toast.success("Board saved")
  }, [board, canvasActions, background, customBgColor, frames, activeFrameId])

  // Rename board
  const handleRenameCommit = useCallback(() => {
    if (!board || !renameValue.trim()) { setIsRenamingTitle(false); return }
    const updated = { ...board, title: renameValue.trim() }
    saveBoardToStore(updated)
    setBoard(updated)
    setIsRenamingTitle(false)
    toast.success("Board renamed")
  }, [board, renameValue])

  // Update minimap
  useEffect(() => {
    const interval = setInterval(() => {
      const url = canvasActions.getMinimapDataUrl()
      if (url) setThumbnailUrl(url)
    }, 2000)
    return () => clearInterval(interval)
  }, [canvasActions])

  // Export handlers
  const handleExportPNG = () => { const el = canvasActions.getCanvasEl(); if (el) exportCanvasPNG(el, board?.title || "whiteboard"); setShowExportMenu(false) }
  const handleExportSVG = () => { const svg = canvasActions.getSVGString(); if (svg) exportCanvasSVG(svg, board?.title || "whiteboard"); setShowExportMenu(false) }
  const handleExportPDF = async () => { const el = canvasActions.getCanvasEl(); if (el) await exportCanvasPDF(el, board?.title || "whiteboard"); setShowExportMenu(false) }
  const handleExportJSON = () => { if (board) { const updated = { ...board, canvasJSON: canvasActions.serializeCanvas() }; exportBoardJSON(updated) }; setShowExportMenu(false) }
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const imported = await importBoardJSON(file)
      if (imported.canvasJSON) {
        await canvasActions.loadCanvasJSON(imported.canvasJSON)
        setBackground(imported.background)
        setHasChanges(true)
        toast.success("Board imported!")
      }
    } catch (err: any) { toast.error(err.message || "Failed to import") }
  }

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => { canvasActions.addImage(ev.target?.result as string) }
    reader.readAsDataURL(file)
  }

  // Toggle public/private
  const togglePublic = () => {
    if (!board) return
    const updated = { ...board, isPublic: !board.isPublic }
    saveBoardToStore(updated)
    setBoard(updated)
    toast.success(updated.isPublic ? "Board is now public" : "Board is now private")
  }

  // Frame management
  const addFrame = () => {
    const id = crypto.randomUUID()
    const newFrame: WBFrame = { id, name: "Frame " + (frames.length + 1), viewportTransform: [1, 0, 0, 1, 0, 0], canvasJSON: "" }
    setFrames([...frames, newFrame])
    setHasChanges(true)
  }

  const deleteFrame = (frameId: string) => {
    if (frames.length <= 1) return
    setFrames(frames.filter((f) => f.id !== frameId))
    if (activeFrameId === frameId) setActiveFrameId(frames[0].id)
    setHasChanges(true)
  }

  const lastSavedText = lastSaved ? "Saved " + getTimeAgo(lastSaved) : "Not saved"

  // Frame navigation for present mode
  const currentFrameIdx = frames.findIndex((f) => f.id === activeFrameId)
  const goNextFrame = useCallback(() => {
    if (frames.length === 0) return
    const next = (currentFrameIdx + 1) % frames.length
    setActiveFrameId(frames[next].id)
  }, [frames, currentFrameIdx])
  const goPrevFrame = useCallback(() => {
    if (frames.length === 0) return
    const prev = (currentFrameIdx - 1 + frames.length) % frames.length
    setActiveFrameId(frames[prev].id)
  }, [frames, currentFrameIdx])

  // Grouped tool definitions
  const drawTools: { key: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { key: "pen", icon: <Pencil className="h-4 w-4" />, label: "Pen", shortcut: "P" },
    { key: "highlighter", icon: <Highlighter className="h-4 w-4" />, label: "Highlighter", shortcut: "H" },
    { key: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Eraser", shortcut: "E" },
    { key: "laser", icon: <Pointer className="h-4 w-4" />, label: "Laser", shortcut: "L" },
  ]

  const shapeTools: { key: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { key: "rect", icon: <Square className="h-4 w-4" />, label: "Rectangle", shortcut: "R" },
    { key: "circle", icon: <Circle className="h-4 w-4" />, label: "Ellipse", shortcut: "C" },
    { key: "triangle", icon: <Triangle className="h-4 w-4" />, label: "Triangle", shortcut: "" },
    { key: "diamond", icon: <Diamond className="h-4 w-4" />, label: "Diamond", shortcut: "D" },
    { key: "line", icon: <Minus className="h-4 w-4" />, label: "Line", shortcut: "N" },
    { key: "arrow", icon: <ArrowRight className="h-4 w-4" />, label: "Arrow", shortcut: "A" },
    { key: "connector", icon: <Link2 className="h-4 w-4" />, label: "Connector", shortcut: "" },
  ]

  const insertTools: { key: ToolType; icon: React.ReactNode; label: string; shortcut: string; action?: () => void }[] = [
    { key: "text", icon: <Type className="h-4 w-4" />, label: "Text", shortcut: "T", action: () => setShowTextDialog(true) },
    { key: "sticky", icon: <StickyNote className="h-4 w-4" />, label: "Sticky Note", shortcut: "S", action: () => setShowStickyDialog(true) },
    { key: "equation", icon: <Sigma className="h-4 w-4" />, label: "Equation", shortcut: "Q", action: () => setShowEquationDialog(true) },
    { key: "image", icon: <ImageIcon className="h-4 w-4" />, label: "Image", shortcut: "", action: () => fileInputRef.current?.click() },
  ]

  // Determine which grouped icon to show based on active tool
  const activeDrawTool = drawTools.find((t) => t.key === tool)
  const activeShapeTool = shapeTools.find((t) => t.key === tool)

  // Present Mode
  if (presentMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col" style={{ touchAction: "none" }}>
        <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm z-10 opacity-0 hover:opacity-100 transition-opacity">
          <span className="text-white font-medium text-sm">{board?.title}</span>
          <div className="flex items-center gap-2">
            {frames.length > 1 && (
              <>
                <button onClick={goPrevFrame} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20" aria-label="Previous frame"><ChevronLeft className="h-4 w-4" /></button>
                <span className="text-xs text-gray-300">{currentFrameIdx + 1} / {frames.length}</span>
                <button onClick={goNextFrame} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20" aria-label="Next frame"><ChevronRight className="h-4 w-4" /></button>
              </>
            )}
            <button onClick={() => setPresentMode(false)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20" aria-label="Exit presentation"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div ref={containerRef} className="absolute inset-0" style={{ cursor: "default", willChange: "transform" }} />
        {frames.length > 1 && (
          <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-10">
            {frames.map((f, i) => (
              <button key={f.id} onClick={() => setActiveFrameId(f.id)} className={cn("w-2 h-2 rounded-full transition-colors", i === currentFrameIdx ? "bg-white" : "bg-white/30 hover:bg-white/60")} aria-label={"Go to frame " + (i + 1)} />
            ))}
          </div>
        )}
        <p className="absolute bottom-2 right-4 text-[10px] text-white/20 z-10">ESC to exit</p>
      </div>
    )
  }

  // Main Canvas Editor Layout
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0f1117]">
      {/* Minimal Top Bar (glass) */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 bg-[#1a1d2e]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <button onClick={onBack} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Back to boards">
          <Menu className="h-4 w-4" />
        </button>

        {/* Board title */}
        {isRenamingTitle ? (
          <input
            className="text-sm font-medium text-white bg-white/10 rounded px-2 py-0.5 border border-blue-500/50 focus:outline-none max-w-[200px]"
            value={renameValue}
            autoFocus
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRenameCommit()
              if (e.key === "Escape") setIsRenamingTitle(false)
            }}
          />
        ) : (
          <button
            className="flex items-center gap-1 text-sm font-medium text-white truncate max-w-[200px] hover:text-blue-300 transition-colors group"
            onDoubleClick={() => { setRenameValue(board?.title || ""); setIsRenamingTitle(true) }}
            title="Double-click to rename"
          >
            <span className="truncate">{board?.title || "Untitled"}</span>
            <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />
          </button>
        )}
        <span className="text-xs text-gray-500 ml-1">{lastSavedText}</span>

        <div className="flex-1" />

        {/* Undo/Redo */}
        <button onClick={canvasActions.undo} disabled={!canvasActions.canUndo} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors" aria-label="Undo"><Undo2 className="h-4 w-4" /></button>
        <button onClick={canvasActions.redo} disabled={!canvasActions.canRedo} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30 transition-colors" aria-label="Redo"><Redo2 className="h-4 w-4" /></button>

        <div className="h-4 w-px bg-white/[0.08]" />

        {/* Zoom controls */}
        <button onClick={() => canvasActions.zoomTo(canvasActions.getZoom() * 0.8)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></button>
        <span className="text-xs text-gray-400 w-12 text-center tabular-nums">{zoom}%</span>
        <button onClick={() => canvasActions.zoomTo(canvasActions.getZoom() * 1.25)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></button>
        <button onClick={canvasActions.zoomToFit} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Zoom to fit"><Maximize2 className="h-3.5 w-3.5" /></button>

        <div className="h-4 w-px bg-white/[0.08]" />

        {/* Quick actions */}
        <button onClick={togglePublic} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" aria-label={board?.isPublic ? "Make private" : "Make public"}>
          {board?.isPublic ? <Globe className="h-4 w-4 text-green-400" /> : <GlobeLock className="h-4 w-4" />}
        </button>
        <button onClick={() => setPresentMode(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Present"><Presentation className="h-4 w-4" /></button>

        {/* Background Picker */}
        <div className="relative">
          <button onClick={() => { setShowBgPicker(!showBgPicker); setShowExportMenu(false) }} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Background"><Grid3X3 className="h-4 w-4" /></button>
          {showBgPicker && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-[#1a1d2e]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl z-50 p-2">
              {BACKGROUND_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className={cn("w-full text-left px-3 py-2 text-sm rounded-lg transition-colors", background === opt.key ? "bg-blue-600/20 text-blue-400" : "text-gray-300 hover:bg-white/5")}
                  onClick={() => { setBackground(opt.key); setShowBgPicker(false); setHasChanges(true) }}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-gray-500 ml-2">{opt.description}</span>
                </button>
              ))}
              <div className="border-t border-white/[0.08] mt-2 pt-2 px-3">
                <label className="text-xs text-gray-400">Custom color</label>
                <input type="color" value={customBgColor} onChange={(e) => { setCustomBgColor(e.target.value); setHasChanges(true) }} className="w-full h-8 mt-1 rounded cursor-pointer" />
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <div className="relative">
          <button onClick={() => { setShowExportMenu(!showExportMenu); setShowBgPicker(false) }} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Export"><Download className="h-4 w-4" /></button>
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-1 w-44 bg-[#1a1d2e]/95 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl z-50 p-1">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2" onClick={handleExportPNG}><FileImage className="h-4 w-4" /> Export PNG</button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2" onClick={handleExportSVG}><FileImage className="h-4 w-4" /> Export SVG</button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2" onClick={handleExportPDF}><FileText className="h-4 w-4" /> Export PDF</button>
              <div className="border-t border-white/[0.08] my-1" />
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2" onClick={handleExportJSON}><FileJson className="h-4 w-4" /> Save as JSON</button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2" onClick={() => { importInputRef.current?.click(); setShowExportMenu(false) }}><Upload className="h-4 w-4" /> Load JSON</button>
            </div>
          )}
        </div>

        <button onClick={() => setShowShortcuts(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors" aria-label="Shortcuts"><Keyboard className="h-4 w-4" /></button>

        {/* Save */}
        <button
          onClick={handleSave}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", hasChanges ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-400 bg-white/5")}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>

        <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors" aria-label="Delete board"><Trash2 className="h-4 w-4" /></button>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Frames sidebar */}
        {showFrames && (
          <div className="w-48 bg-[#1a1d2e]/90 backdrop-blur-xl border-r border-white/[0.06] flex flex-col shrink-0">
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-sm font-medium text-white">Frames</span>
              <button onClick={addFrame} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5" aria-label="Add frame"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {frames.length === 0 && <p className="text-xs text-gray-500 text-center py-4">No frames yet</p>}
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer", activeFrameId === frame.id ? "bg-blue-600/20 text-blue-400" : "text-gray-300 hover:bg-white/5")}
                  onClick={() => setActiveFrameId(frame.id)}
                >
                  <span className="flex-1 truncate">{frame.name}</span>
                  {frames.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); deleteFrame(frame.id) }} className="p-0.5 text-gray-500 hover:text-red-400" aria-label="Delete frame"><X className="h-3 w-3" /></button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Canvas container */}
        <div className="flex-1 relative overflow-hidden" style={{ touchAction: "none", willChange: "transform" }}>
          <div
            ref={containerRef}
            className="absolute inset-0"
            style={{ cursor: tool === "pan" ? "grab" : tool === "select" ? "default" : "crosshair", willChange: "transform" }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy" }}
            onDrop={(e) => {
              e.preventDefault()
              const files = Array.from(e.dataTransfer.files)
              const imageFile = files.find((f) => f.type.startsWith("image/"))
              if (imageFile) {
                const reader = new FileReader()
                reader.onload = (ev) => canvasActions.addImage(ev.target?.result as string)
                reader.readAsDataURL(imageFile)
              }
            }}
          />

          {/* Floating Bottom Toolbar (Zoom-style, glass) */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-2xl bg-[#1a1d2e]/80 backdrop-blur-xl border border-white/[0.08] shadow-2xl">

              {/* Select */}
              <ToolButton
                active={tool === "select"}
                onClick={() => setTool("select")}
                icon={<MousePointer2 className="h-4 w-4" />}
                label="Select (V)"
              />

              <ToolDivider />

              {/* Draw group */}
              <ToolPopover
                open={showDrawPopover}
                onClose={() => setShowDrawPopover(false)}
                trigger={
                  <button
                    onClick={() => { setShowDrawPopover(!showDrawPopover); setShowShapesPopover(false); setShowInsertPopover(false) }}
                    className={cn(
                      "flex items-center gap-0.5 p-2 rounded-xl transition-all",
                      activeDrawTool ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                    title="Drawing tools"
                  >
                    {activeDrawTool ? activeDrawTool.icon : <PenTool className="h-4 w-4" />}
                    <ChevronDownIcon className="h-3 w-3 opacity-50" />
                  </button>
                }
              >
                <div className="grid grid-cols-2 gap-1">
                  {drawTools.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => { setTool(t.key); setShowDrawPopover(false) }}
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap", tool === t.key ? "bg-blue-600/20 text-blue-400" : "text-gray-300 hover:bg-white/5")}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                      {t.shortcut && <span className="text-[10px] text-gray-500 ml-auto">{t.shortcut}</span>}
                    </button>
                  ))}
                </div>
              </ToolPopover>

              {/* Shapes group */}
              <ToolPopover
                open={showShapesPopover}
                onClose={() => setShowShapesPopover(false)}
                trigger={
                  <button
                    onClick={() => { setShowShapesPopover(!showShapesPopover); setShowDrawPopover(false); setShowInsertPopover(false) }}
                    className={cn(
                      "flex items-center gap-0.5 p-2 rounded-xl transition-all",
                      activeShapeTool ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                    title="Shape tools"
                  >
                    {activeShapeTool ? activeShapeTool.icon : <Shapes className="h-4 w-4" />}
                    <ChevronDownIcon className="h-3 w-3 opacity-50" />
                  </button>
                }
              >
                <div className="grid grid-cols-2 gap-1">
                  {shapeTools.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => { setTool(t.key); setShowShapesPopover(false) }}
                      className={cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap", tool === t.key ? "bg-blue-600/20 text-blue-400" : "text-gray-300 hover:bg-white/5")}
                    >
                      {t.icon}
                      <span>{t.label}</span>
                      {t.shortcut && <span className="text-[10px] text-gray-500 ml-auto">{t.shortcut}</span>}
                    </button>
                  ))}
                </div>
              </ToolPopover>

              {/* Insert group */}
              <ToolPopover
                open={showInsertPopover}
                onClose={() => setShowInsertPopover(false)}
                trigger={
                  <button
                    onClick={() => { setShowInsertPopover(!showInsertPopover); setShowDrawPopover(false); setShowShapesPopover(false) }}
                    className={cn(
                      "flex items-center gap-0.5 p-2 rounded-xl transition-all",
                      "text-gray-400 hover:text-white hover:bg-white/5"
                    )}
                    title="Insert"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <ChevronDownIcon className="h-3 w-3 opacity-50" />
                  </button>
                }
              >
                <div className="grid grid-cols-1 gap-1">
                  {insertTools.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => { t.action?.(); setShowInsertPopover(false) }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-white/5 transition-colors whitespace-nowrap"
                    >
                      {t.icon}
                      <span>{t.label}</span>
                      {t.shortcut && <span className="text-[10px] text-gray-500 ml-auto">{t.shortcut}</span>}
                    </button>
                  ))}
                </div>
              </ToolPopover>

              <ToolDivider />

              {/* Pan */}
              <ToolButton
                active={tool === "pan"}
                onClick={() => setTool("pan")}
                icon={<Hand className="h-4 w-4" />}
                label="Pan (Space)"
              />

              {/* Frames toggle */}
              <ToolButton
                active={showFrames}
                onClick={() => setShowFrames(!showFrames)}
                icon={<LayoutGrid className="h-4 w-4" />}
                label="Frames"
              />
            </div>
          </div>

          {/* Context Style Panel (glass, above toolbar when object selected) */}
          {selectedObj && tool === "select" && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30">
              <div className="bg-[#1a1d2e]/85 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-2.5 flex flex-wrap items-center gap-2 max-w-[calc(100vw-10rem)] overflow-x-auto">
                {/* Colors */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Stroke</span>
                  <input type="color" value={style.strokeColor} onChange={(e) => setStyle((s) => ({ ...s, strokeColor: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Fill</span>
                  <input type="color" value={style.fillColor === "transparent" ? "#ffffff" : style.fillColor} onChange={(e) => setStyle((s) => ({ ...s, fillColor: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0" />
                  <button onClick={() => setStyle((s) => ({ ...s, fillColor: "transparent" }))} className={cn("text-xs px-1.5 py-0.5 rounded border transition-colors", style.fillColor === "transparent" ? "border-blue-400 text-blue-400" : "border-white/10 text-gray-400 hover:text-white")} title="No fill">{"\u2205"}</button>
                </div>
                <div className="h-5 w-px bg-white/[0.08]" />
                {/* Stroke width + dash */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">W</span>
                  <input type="range" min={1} max={20} value={style.strokeWidth} onChange={(e) => setStyle((s) => ({ ...s, strokeWidth: Number(e.target.value) }))} className="w-14 accent-blue-500" />
                  <span className="text-xs text-gray-400 w-4 tabular-nums">{style.strokeWidth}</span>
                </div>
                <select
                  value={style.dashStyle}
                  onChange={(e) => setStyle((s) => ({ ...s, dashStyle: e.target.value as any }))}
                  className="text-xs bg-white/5 border border-white/[0.08] text-gray-300 rounded px-1.5 py-0.5 cursor-pointer"
                  title="Dash style"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
                <div className="h-5 w-px bg-white/[0.08]" />
                {/* Opacity */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">Opacity</span>
                  <input type="range" min={0} max={1} step={0.05} value={style.fillOpacity} onChange={(e) => setStyle((s) => ({ ...s, fillOpacity: Number(e.target.value) }))} className="w-14 accent-blue-500" />
                  <span className="text-xs text-gray-400 w-6 tabular-nums">{Math.round(style.fillOpacity * 100)}%</span>
                </div>
                <div className="h-5 w-px bg-white/[0.08]" />
                {/* Font formatting */}
                <button onClick={() => setStyle((s) => ({ ...s, fontBold: !s.fontBold }))} className={cn("p-1 rounded transition-colors", style.fontBold ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")} title="Bold"><Bold className="h-3.5 w-3.5" /></button>
                <button onClick={() => setStyle((s) => ({ ...s, fontItalic: !s.fontItalic }))} className={cn("p-1 rounded transition-colors", style.fontItalic ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")} title="Italic"><Italic className="h-3.5 w-3.5" /></button>
                <button onClick={() => setStyle((s) => ({ ...s, fontUnderline: !s.fontUnderline }))} className={cn("p-1 rounded transition-colors", style.fontUnderline ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white")} title="Underline"><Underline className="h-3.5 w-3.5" /></button>
                <div className="h-5 w-px bg-white/[0.08]" />
                {/* Layer order */}
                <button onClick={canvasActions.bringForward} className="p-1 text-gray-400 hover:text-white" title="Bring forward"><ChevronUp className="h-4 w-4" /></button>
                <button onClick={canvasActions.sendBackward} className="p-1 text-gray-400 hover:text-white" title="Send backward"><ChevronDown className="h-4 w-4" /></button>
                <button onClick={canvasActions.bringToFront} className="p-1 text-gray-400 hover:text-white" title="Bring to front"><ChevronsUp className="h-4 w-4" /></button>
                <button onClick={canvasActions.sendToBack} className="p-1 text-gray-400 hover:text-white" title="Send to back"><ChevronsDown className="h-4 w-4" /></button>
                <div className="h-5 w-px bg-white/[0.08]" />
                {/* Alignment (2+ objects) */}
                {selectedCount >= 2 && (
                  <>
                    <button onClick={() => canvasActions.alignObjects("left")} className="p-1 text-gray-400 hover:text-white" title="Align left"><AlignLeft className="h-3.5 w-3.5" /></button>
                    <button onClick={() => canvasActions.alignObjects("centerH")} className="p-1 text-gray-400 hover:text-white" title="Align center H"><AlignCenter className="h-3.5 w-3.5" /></button>
                    <button onClick={() => canvasActions.alignObjects("right")} className="p-1 text-gray-400 hover:text-white" title="Align right"><AlignRight className="h-3.5 w-3.5" /></button>
                    <button onClick={() => canvasActions.alignObjects("top")} className="p-1 text-gray-400 hover:text-white" title="Align top"><AlignStartVertical className="h-3.5 w-3.5" /></button>
                    <button onClick={() => canvasActions.alignObjects("centerV")} className="p-1 text-gray-400 hover:text-white" title="Align middle"><AlignCenterVertical className="h-3.5 w-3.5" /></button>
                    <button onClick={() => canvasActions.alignObjects("bottom")} className="p-1 text-gray-400 hover:text-white" title="Align bottom"><AlignEndVertical className="h-3.5 w-3.5" /></button>
                    {selectedCount >= 3 && (
                      <>
                        <button onClick={() => canvasActions.distributeObjects("horizontal")} className="p-1 text-gray-400 hover:text-white" title="Distribute H"><AlignHorizontalDistributeCenter className="h-3.5 w-3.5" /></button>
                        <button onClick={() => canvasActions.distributeObjects("vertical")} className="p-1 text-gray-400 hover:text-white" title="Distribute V"><AlignVerticalDistributeCenter className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                    <div className="h-5 w-px bg-white/[0.08]" />
                  </>
                )}
                {/* Lock/Group/Dupe/Delete */}
                <button onClick={() => canvasActions.lockObject(true)} className="p-1 text-gray-400 hover:text-white" title="Lock"><Lock className="h-4 w-4" /></button>
                <button onClick={() => canvasActions.lockObject(false)} className="p-1 text-gray-400 hover:text-white" title="Unlock"><Unlock className="h-4 w-4" /></button>
                <div className="h-5 w-px bg-white/[0.08]" />
                <button onClick={canvasActions.groupSelected} className="p-1 text-gray-400 hover:text-white" title="Group"><Group className="h-4 w-4" /></button>
                <button onClick={canvasActions.ungroupSelected} className="p-1 text-gray-400 hover:text-white" title="Ungroup"><Ungroup className="h-4 w-4" /></button>
                <div className="h-5 w-px bg-white/[0.08]" />
                <button onClick={canvasActions.duplicateSelected} className="p-1 text-gray-400 hover:text-white" title="Duplicate"><Copy className="h-4 w-4" /></button>
                <button onClick={canvasActions.deleteSelected} className="p-1 text-red-400 hover:text-red-300" title="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {/* Color bar (when drawing tools active) */}
          {["pen", "highlighter", "rect", "circle", "triangle", "line", "arrow", "diamond", "connector"].includes(tool) && !selectedObj && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30">
              <div className="bg-[#1a1d2e]/85 backdrop-blur-xl border border-white/[0.08] rounded-xl shadow-2xl p-2 flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setStyle((s) => ({ ...s, strokeColor: c }))}
                    className={cn("w-6 h-6 rounded-full border-2 transition-transform", style.strokeColor === c ? "border-blue-400 scale-110" : "border-transparent hover:scale-105")}
                    style={{ backgroundColor: c }}
                    aria-label={"Color " + c}
                  />
                ))}
                <div className="h-5 w-px bg-white/[0.08]" />
                <input type="color" value={style.strokeColor} onChange={(e) => setStyle((s) => ({ ...s, strokeColor: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0" aria-label="Custom color" />
                <div className="h-5 w-px bg-white/[0.08]" />
                <input type="range" min={1} max={20} value={style.strokeWidth} onChange={(e) => setStyle((s) => ({ ...s, strokeWidth: Number(e.target.value) }))} className="w-16 accent-blue-500" aria-label="Stroke width" />
                <span className="text-xs text-gray-400 w-6 tabular-nums">{style.strokeWidth}</span>
              </div>
            </div>
          )}

          {/* Live Minimap */}
          <div className="absolute bottom-4 right-4 w-36 h-24 bg-[#1a1d2e]/80 backdrop-blur-xl border border-white/[0.06] rounded-lg overflow-hidden z-20 opacity-40 hover:opacity-100 transition-opacity cursor-pointer" title="Minimap" onClick={canvasActions.zoomToFit}>
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="minimap" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600 uppercase tracking-wider">minimap</div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />

      {/* Dialogs */}
      {showTextDialog && (
        <ModalOverlay onClose={() => setShowTextDialog(false)}>
          <div className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Text</h3>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} className="w-full p-3 rounded-lg bg-white/5 border border-white/[0.08] text-white resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50" rows={3} placeholder="Type text here..." autoFocus />
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-gray-400">Size:</label>
              <input type="range" min={12} max={72} value={style.fontSize} onChange={(e) => setStyle((s) => ({ ...s, fontSize: Number(e.target.value) }))} className="flex-1 accent-blue-500" />
              <span className="text-sm text-gray-400 w-8 tabular-nums">{style.fontSize}</span>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTextDialog(false)} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/5">Cancel</button>
              <button onClick={() => { if (textInput.trim()) { canvasActions.addText(textInput, 0, 0, style); setTool("select") }; setTextInput(""); setShowTextDialog(false) }} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Add</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showStickyDialog && (
        <ModalOverlay onClose={() => setShowStickyDialog(false)}>
          <div className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Sticky Note</h3>
            <textarea value={stickyInput} onChange={(e) => setStickyInput(e.target.value)} className="w-full p-3 rounded-lg bg-white/5 border border-white/[0.08] text-white resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50" rows={3} placeholder="Note content..." autoFocus />
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Color:</label>
              <div className="flex gap-2">
                {STICKY_COLORS.map((c) => (
                  <button key={c} onClick={() => setStickyColor(c)} className={cn("w-8 h-8 rounded-lg border-2 transition-transform", stickyColor === c ? "border-blue-400 scale-110" : "border-transparent")} style={{ backgroundColor: c }} aria-label={"Sticky color " + c} />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowStickyDialog(false)} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/5">Cancel</button>
              <button onClick={() => { canvasActions.addSticky(stickyInput || "New note", 0, 0, stickyColor); setStickyInput(""); setShowStickyDialog(false) }} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Add</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showEquationDialog && (
        <ModalOverlay onClose={() => setShowEquationDialog(false)}>
          <div className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Add Equation</h3>
            <p className="text-xs text-gray-400 mb-4">{"Enter LaTeX notation (e.g. E = mc^2, \\frac{a}{b}, \\sqrt{x})"}</p>
            <input
              type="text" value={equationInput} onChange={(e) => setEquationInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/[0.08] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-2 font-mono"
              placeholder="e.g. E = mc^2" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") { if (equationInput.trim()) canvasActions.addEquation(equationInput, 0, 0); setEquationInput(""); setShowEquationDialog(false) } }}
            />
            {equationInput.trim() && (
              <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/[0.08] text-center overflow-x-auto">
                <EquationPreview latex={equationInput} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEquationDialog(false)} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/5">Cancel</button>
              <button onClick={() => { if (equationInput.trim()) canvasActions.addEquation(equationInput, 0, 0); setEquationInput(""); setShowEquationDialog(false) }} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">Add</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showShortcuts && (
        <ModalOverlay onClose={() => setShowShortcuts(false)}>
          <div className="w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="p-1 text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-1">
              {[...KEYBOARD_SHORTCUTS,
                { key: "W / Up Arrow", action: "Pan up" },
                { key: "A / Left Arrow", action: "Pan left" },
                { key: "S / Down Arrow", action: "Pan down" },
                { key: "D / Right Arrow", action: "Pan right" },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-sm text-gray-300">{s.action}</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/5 text-xs text-gray-400 font-mono">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </ModalOverlay>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Board"
        message="Are you sure you want to delete this board? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (board) deleteBoardFromStore(board.id); setConfirmDelete(false); onBack() }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

// ============================================================================
// Small Helper Components
// ============================================================================

function ToolButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn("p-2 rounded-xl transition-all", active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-gray-400 hover:text-white hover:bg-white/5")}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  )
}

function ToolDivider() {
  return <div className="h-5 w-px bg-white/[0.08] mx-0.5" />
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 rounded-2xl bg-[#1a1d2e]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return minutes + "m ago"
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + "h ago"
  return Math.floor(hours / 24) + "d ago"
}
