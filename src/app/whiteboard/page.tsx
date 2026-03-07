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
  FileText, Presentation, Globe, GlobeLock, LayoutGrid, Menu, LogOut,
  Shield, Megaphone,
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
import { useWBAuth } from "@/components/whiteboard/WBAuthProvider"
import { LoginModal } from "@/components/whiteboard/LoginModal"
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

  const handleCreateBoard = (title: string) => {
    const board = createBoardInStore(user.id, title)
    setActiveBoardId(board.id)
    setRefreshKey((k) => k + 1)
  }

  const handleDeleteBoard = (id: string) => {
    deleteBoardFromStore(id)
    if (activeBoardId === id) setActiveBoardId(null)
    setRefreshKey((k) => k + 1)
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
  onCreateBoard: (title: string) => void
  onOpenBoard: (id: string) => void
  onDeleteBoard: (id: string) => void
  onLogout: () => void
}

function BoardDashboard({ boards, user, isAdmin, onCreateBoard, onOpenBoard, onDeleteBoard, onLogout }: BoardDashboardProps) {
  const [newTitle, setNewTitle] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: "", title: "" })

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-heading">My Whiteboards</h1>
            <p className="text-muted-foreground mt-1">Welcome, {user.username}</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <a
                href="/admin?tab=whiteboards"
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600/20 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin
              </a>
            )}
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Board
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Log out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
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
                className="group relative p-5 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => onOpenBoard(board.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-card-foreground truncate">{board.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(board.updatedAt).toLocaleDateString()} · {board.background}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {board.isPublic ? (
                      <Globe className="h-4 w-4 text-green-500" />
                    ) : (
                      <GlobeLock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setConfirmDelete({ open: true, id: board.id, title: board.title })
                      }}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      aria-label="Delete board"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="h-24 rounded-lg bg-muted/50 flex items-center justify-center">
                  <LayoutGrid className="h-8 w-8 text-muted-foreground/20" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Board Modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-md mx-4 rounded-2xl bg-[#1e2133] border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">New Whiteboard</h3>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Board title..."
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-4"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  onCreateBoard(newTitle || "Untitled Board")
                  setNewTitle("")
                  setShowNew(false)
                }
                if (e.key === "Escape") setShowNew(false)
              }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/5">Cancel</button>
              <button
                onClick={() => { onCreateBoard(newTitle || "Untitled Board"); setNewTitle(""); setShowNew(false) }}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
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
// Whiteboard Canvas (Full Editor)
// ============================================================================

interface WhiteboardCanvasProps {
  boardId: string
  user: { id: string; username: string; isAdmin: boolean }
  isAdmin: boolean
  onBack: () => void
  onLogout: () => void
}

function WhiteboardCanvas({ boardId, user, isAdmin, onBack, onLogout }: WhiteboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  // Board state
  const [board, setBoard] = useState<WBBoard | null>(null)
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

  // Frames state
  const [frames, setFrames] = useState<WBFrame[]>([])
  const [activeFrameId, setActiveFrameId] = useState("")

  // Canvas hook
  const canvasActions = useWhiteboardCanvas({
    canvasContainerRef: containerRef,
    tool, style, background, customBgColor, isDark,
    onObjectSelected: setSelectedObj,
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
      if (board && hasChanges) {
        handleSave()
      }
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
        setShowFrames(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [canvasActions, selectedObj, presentMode])

  // Save board
  const handleSave = useCallback(() => {
    if (!board) return
    const json = canvasActions.serializeCanvas()
    const updated: WBBoard = {
      ...board,
      canvasJSON: json,
      background,
      customBgColor,
      frames,
      activeFrameId,
      updatedAt: new Date().toISOString(),
    }
    saveBoardToStore(updated)
    setBoard(updated)
    setHasChanges(false)
    setLastSaved(new Date().toISOString())
    toast.success("Board saved")
  }, [board, canvasActions, background, customBgColor, frames, activeFrameId])

  // Export handlers
  const handleExportPNG = () => {
    const el = canvasActions.getCanvasEl()
    if (el) exportCanvasPNG(el, board?.title || "whiteboard")
    setShowExportMenu(false)
  }
  const handleExportSVG = () => {
    const svg = canvasActions.getSVGString()
    if (svg) exportCanvasSVG(svg, board?.title || "whiteboard")
    setShowExportMenu(false)
  }
  const handleExportPDF = async () => {
    const el = canvasActions.getCanvasEl()
    if (el) await exportCanvasPDF(el, board?.title || "whiteboard")
    setShowExportMenu(false)
  }
  const handleExportJSON = () => {
    if (board) {
      const updated = { ...board, canvasJSON: canvasActions.serializeCanvas() }
      exportBoardJSON(updated)
    }
    setShowExportMenu(false)
  }
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
    } catch (err: any) {
      toast.error(err.message || "Failed to import")
    }
  }

  // Image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      canvasActions.addImage(ev.target?.result as string)
    }
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
    const newFrame: WBFrame = {
      id,
      name: `Frame ${frames.length + 1}`,
      viewportTransform: [1, 0, 0, 1, 0, 0],
      canvasJSON: "",
    }
    setFrames([...frames, newFrame])
    setHasChanges(true)
  }

  const deleteFrame = (frameId: string) => {
    if (frames.length <= 1) return
    setFrames(frames.filter((f) => f.id !== frameId))
    if (activeFrameId === frameId) setActiveFrameId(frames[0].id)
    setHasChanges(true)
  }

  // Tool definitions
  const tools: { key: ToolType; icon: React.ReactNode; label: string; shortcut: string }[] = [
    { key: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select", shortcut: "V" },
    { key: "pen", icon: <Pencil className="h-4 w-4" />, label: "Pen", shortcut: "P" },
    { key: "highlighter", icon: <Highlighter className="h-4 w-4" />, label: "Highlighter", shortcut: "H" },
    { key: "eraser", icon: <Eraser className="h-4 w-4" />, label: "Eraser", shortcut: "E" },
    { key: "laser", icon: <Pointer className="h-4 w-4" />, label: "Laser", shortcut: "L" },
    { key: "rect", icon: <Square className="h-4 w-4" />, label: "Rectangle", shortcut: "R" },
    { key: "circle", icon: <Circle className="h-4 w-4" />, label: "Ellipse", shortcut: "C" },
    { key: "triangle", icon: <Triangle className="h-4 w-4" />, label: "Triangle", shortcut: "" },
    { key: "line", icon: <Minus className="h-4 w-4" />, label: "Line", shortcut: "N" },
    { key: "arrow", icon: <ArrowRight className="h-4 w-4" />, label: "Arrow", shortcut: "A" },
    { key: "diamond", icon: <Diamond className="h-4 w-4" />, label: "Diamond", shortcut: "D" },
    { key: "text", icon: <Type className="h-4 w-4" />, label: "Text", shortcut: "T" },
    { key: "sticky", icon: <StickyNote className="h-4 w-4" />, label: "Sticky Note", shortcut: "S" },
    { key: "image", icon: <ImageIcon className="h-4 w-4" />, label: "Image", shortcut: "" },
    { key: "connector", icon: <Link2 className="h-4 w-4" />, label: "Connector", shortcut: "" },
    { key: "equation", icon: <Sigma className="h-4 w-4" />, label: "Equation", shortcut: "Q" },
    { key: "pan", icon: <Hand className="h-4 w-4" />, label: "Pan", shortcut: "Space" },
  ]

  const lastSavedText = lastSaved ? `Saved ${getTimeAgo(lastSaved)}` : "Not saved"

  if (presentMode) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center cursor-pointer" onClick={() => setPresentMode(false)}>
        <div className="text-white text-center">
          <Presentation className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="text-xl mb-4">Presentation Mode</p>
          <p className="text-sm text-gray-400">Click anywhere or press Escape to exit</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e2133] border-b border-white/10 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Back to boards">
          <Menu className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium text-white truncate max-w-[200px]">{board?.title || "Untitled"}</span>
        <span className="text-xs text-gray-500 ml-1">{lastSavedText}</span>

        <div className="flex-1" />

        {/* Undo/Redo */}
        <button onClick={canvasActions.undo} disabled={!canvasActions.canUndo} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30" aria-label="Undo (Ctrl+Z)">
          <Undo2 className="h-4 w-4" />
        </button>
        <button onClick={canvasActions.redo} disabled={!canvasActions.canRedo} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-30" aria-label="Redo (Ctrl+Y)">
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="h-4 w-px bg-white/10" />

        {/* Zoom */}
        <button onClick={() => canvasActions.zoomTo(canvasActions.getZoom() * 0.8)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Zoom out">
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="text-xs text-gray-400 w-12 text-center tabular-nums">{zoom}%</span>
        <button onClick={() => canvasActions.zoomTo(canvasActions.getZoom() * 1.25)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Zoom in">
          <ZoomIn className="h-4 w-4" />
        </button>
        <button onClick={canvasActions.zoomToFit} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Zoom to fit">
          <Maximize2 className="h-3.5 w-3.5" />
        </button>

        <div className="h-4 w-px bg-white/10" />

        {/* Public/Private */}
        <button onClick={togglePublic} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label={board?.isPublic ? "Make private" : "Make public"}>
          {board?.isPublic ? <Globe className="h-4 w-4 text-green-400" /> : <GlobeLock className="h-4 w-4" />}
        </button>

        {/* Present */}
        <button onClick={() => setPresentMode(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Present">
          <Presentation className="h-4 w-4" />
        </button>

        {/* Background Picker */}
        <div className="relative">
          <button onClick={() => { setShowBgPicker(!showBgPicker); setShowExportMenu(false) }} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Background">
            <Grid3X3 className="h-4 w-4" />
          </button>
          {showBgPicker && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-[#1e2133] border border-white/10 rounded-xl shadow-xl z-50 p-2">
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
              <div className="border-t border-white/10 mt-2 pt-2 px-3">
                <label className="text-xs text-gray-400">Custom color</label>
                <input type="color" value={customBgColor} onChange={(e) => { setCustomBgColor(e.target.value); setHasChanges(true) }} className="w-full h-8 mt-1 rounded cursor-pointer" />
              </div>
            </div>
          )}
        </div>

        {/* Export */}
        <div className="relative">
          <button onClick={() => { setShowExportMenu(!showExportMenu); setShowBgPicker(false) }} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Export">
            <Download className="h-4 w-4" />
          </button>
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-1 w-44 bg-[#1e2133] border border-white/10 rounded-xl shadow-xl z-50 p-1">
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2" onClick={handleExportPNG}>
                <FileImage className="h-4 w-4" /> Export PNG
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2" onClick={handleExportSVG}>
                <FileImage className="h-4 w-4" /> Export SVG
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2" onClick={handleExportPDF}>
                <FileText className="h-4 w-4" /> Export PDF
              </button>
              <div className="border-t border-white/10 my-1" />
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2" onClick={handleExportJSON}>
                <FileJson className="h-4 w-4" /> Save as JSON
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 rounded-lg flex items-center gap-2" onClick={() => { importInputRef.current?.click(); setShowExportMenu(false) }}>
                <Upload className="h-4 w-4" /> Load JSON
              </button>
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <button onClick={() => setShowShortcuts(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" aria-label="Keyboard shortcuts">
          <Keyboard className="h-4 w-4" />
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors", hasChanges ? "bg-blue-600 text-white hover:bg-blue-700" : "text-gray-400 bg-white/5")}
        >
          <Save className="h-3.5 w-3.5" />
          Save
        </button>

        {/* Delete */}
        <button onClick={() => setConfirmDelete(true)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" aria-label="Delete board">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-12 bg-[#1e2133] border-r border-white/10 flex flex-col items-center py-2 gap-0.5 overflow-y-auto shrink-0">
          {tools.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                if (t.key === "text") { setShowTextDialog(true); return }
                if (t.key === "sticky") { setShowStickyDialog(true); return }
                if (t.key === "equation") { setShowEquationDialog(true); return }
                if (t.key === "image") { fileInputRef.current?.click(); return }
                setTool(t.key)
              }}
              title={`${t.label}${t.shortcut ? ` (${t.shortcut})` : ""}`}
              aria-label={t.label}
              className={cn(
                "p-2 rounded-lg transition-colors",
                tool === t.key ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {t.icon}
            </button>
          ))}

          <div className="flex-1" />

          <button onClick={() => setShowFrames(!showFrames)} className={cn("p-2 rounded-lg transition-colors", showFrames ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:text-white hover:bg-white/5")} title="Frames" aria-label="Toggle frames panel">
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        {/* Frames sidebar */}
        {showFrames && (
          <div className="w-48 bg-[#1a1d2e] border-r border-white/10 flex flex-col shrink-0">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="text-sm font-medium text-white">Frames</span>
              <button onClick={addFrame} className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/5" aria-label="Add frame">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {frames.length === 0 && (
                <p className="text-xs text-gray-500 text-center py-4">No frames yet</p>
              )}
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer",
                    activeFrameId === frame.id ? "bg-blue-600/20 text-blue-400" : "text-gray-300 hover:bg-white/5"
                  )}
                  onClick={() => setActiveFrameId(frame.id)}
                >
                  <span className="flex-1 truncate">{frame.name}</span>
                  {frames.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); deleteFrame(frame.id) }} className="p-0.5 text-gray-500 hover:text-red-400" aria-label="Delete frame">
                      <X className="h-3 w-3" />
                    </button>
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

          {/* Context-sensitive style panel (bottom center, appears when object selected) */}
          {selectedObj && tool === "select" && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1e2133] border border-white/10 rounded-xl shadow-xl p-3 flex items-center gap-3 z-30 max-w-[90vw] overflow-x-auto">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Stroke</span>
                <input type="color" value={style.strokeColor} onChange={(e) => setStyle((s) => ({ ...s, strokeColor: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Fill</span>
                <input type="color" value={style.fillColor === "transparent" ? "#ffffff" : style.fillColor} onChange={(e) => setStyle((s) => ({ ...s, fillColor: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0" />
              </div>
              <div className="h-5 w-px bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Width</span>
                <input type="range" min={1} max={20} value={style.strokeWidth} onChange={(e) => setStyle((s) => ({ ...s, strokeWidth: Number(e.target.value) }))} className="w-16 accent-blue-500" />
              </div>
              <div className="h-5 w-px bg-white/10" />
              <button onClick={canvasActions.bringForward} className="p-1 text-gray-400 hover:text-white" title="Bring forward"><ChevronUp className="h-4 w-4" /></button>
              <button onClick={canvasActions.sendBackward} className="p-1 text-gray-400 hover:text-white" title="Send backward"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={canvasActions.bringToFront} className="p-1 text-gray-400 hover:text-white" title="Bring to front"><ChevronsUp className="h-4 w-4" /></button>
              <button onClick={canvasActions.sendToBack} className="p-1 text-gray-400 hover:text-white" title="Send to back"><ChevronsDown className="h-4 w-4" /></button>
              <div className="h-5 w-px bg-white/10" />
              <button onClick={() => canvasActions.lockObject(true)} className="p-1 text-gray-400 hover:text-white" title="Lock"><Lock className="h-4 w-4" /></button>
              <button onClick={() => canvasActions.lockObject(false)} className="p-1 text-gray-400 hover:text-white" title="Unlock"><Unlock className="h-4 w-4" /></button>
              <div className="h-5 w-px bg-white/10" />
              <button onClick={canvasActions.groupSelected} className="p-1 text-gray-400 hover:text-white" title="Group (Ctrl+G)"><Group className="h-4 w-4" /></button>
              <button onClick={canvasActions.ungroupSelected} className="p-1 text-gray-400 hover:text-white" title="Ungroup (Ctrl+Shift+G)"><Ungroup className="h-4 w-4" /></button>
              <div className="h-5 w-px bg-white/10" />
              <button onClick={canvasActions.duplicateSelected} className="p-1 text-gray-400 hover:text-white" title="Duplicate (Ctrl+D)"><Copy className="h-4 w-4" /></button>
              <button onClick={canvasActions.deleteSelected} className="p-1 text-red-400 hover:text-red-300" title="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          )}

          {/* Color bar (when drawing tools active) */}
          {["pen", "highlighter", "rect", "circle", "triangle", "line", "arrow", "diamond", "connector"].includes(tool) && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#1e2133] border border-white/10 rounded-xl shadow-xl p-2 flex items-center gap-2 z-30">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setStyle((s) => ({ ...s, strokeColor: c }))}
                  className={cn("w-6 h-6 rounded-full border-2 transition-transform", style.strokeColor === c ? "border-blue-400 scale-110" : "border-transparent hover:scale-105")}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
              <div className="h-5 w-px bg-white/10" />
              <input type="color" value={style.strokeColor} onChange={(e) => setStyle((s) => ({ ...s, strokeColor: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border-0" aria-label="Custom color" />
              <div className="h-5 w-px bg-white/10" />
              <input type="range" min={1} max={20} value={style.strokeWidth} onChange={(e) => setStyle((s) => ({ ...s, strokeWidth: Number(e.target.value) }))} className="w-16 accent-blue-500" aria-label="Stroke width" />
              <span className="text-xs text-gray-400 w-6 tabular-nums">{style.strokeWidth}</span>
            </div>
          )}

          {/* Minimap placeholder */}
          <div className="absolute bottom-4 right-4 w-32 h-24 bg-[#1e2133]/80 border border-white/10 rounded-lg overflow-hidden z-20 opacity-50 hover:opacity-100 transition-opacity">
            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600 uppercase tracking-wider">
              minimap
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />

      {/* Text Dialog */}
      {showTextDialog && (
        <ModalOverlay onClose={() => setShowTextDialog(false)}>
          <div className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Text</h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              rows={3}
              placeholder="Type text here..."
              autoFocus
            />
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-gray-400">Size:</label>
              <input type="range" min={12} max={72} value={style.fontSize} onChange={(e) => setStyle((s) => ({ ...s, fontSize: Number(e.target.value) }))} className="flex-1 accent-blue-500" />
              <span className="text-sm text-gray-400 w-8 tabular-nums">{style.fontSize}</span>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTextDialog(false)} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/5">Cancel</button>
              <button
                onClick={() => {
                  if (textInput.trim()) { canvasActions.addText(textInput, 0, 0, style); setTool("select") }
                  setTextInput(""); setShowTextDialog(false)
                }}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Sticky Note Dialog */}
      {showStickyDialog && (
        <ModalOverlay onClose={() => setShowStickyDialog(false)}>
          <div className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Add Sticky Note</h3>
            <textarea
              value={stickyInput}
              onChange={(e) => setStickyInput(e.target.value)}
              className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              rows={3}
              placeholder="Note content..."
              autoFocus
            />
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-2">Color:</label>
              <div className="flex gap-2">
                {STICKY_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setStickyColor(c)}
                    className={cn("w-8 h-8 rounded-lg border-2 transition-transform", stickyColor === c ? "border-blue-400 scale-110" : "border-transparent")}
                    style={{ backgroundColor: c }}
                    aria-label={`Sticky color ${c}`}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowStickyDialog(false)} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/5">Cancel</button>
              <button
                onClick={() => {
                  canvasActions.addSticky(stickyInput || "New note", 0, 0, stickyColor)
                  setStickyInput(""); setShowStickyDialog(false)
                }}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Equation Dialog */}
      {showEquationDialog && (
        <ModalOverlay onClose={() => setShowEquationDialog(false)}>
          <div className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Add Equation</h3>
            <p className="text-xs text-gray-400 mb-4">Enter LaTeX notation (e.g. E = mc^2, \frac&#123;a&#125;&#123;b&#125;, \sqrt&#123;x&#125;)</p>
            <input
              type="text"
              value={equationInput}
              onChange={(e) => setEquationInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 mb-2 font-mono"
              placeholder="e.g. E = mc^2"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (equationInput.trim()) canvasActions.addEquation(equationInput, 0, 0)
                  setEquationInput(""); setShowEquationDialog(false)
                }
              }}
            />
            {/* Live KaTeX preview */}
            {equationInput.trim() && (
              <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10 text-center overflow-x-auto">
                <EquationPreview latex={equationInput} />
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEquationDialog(false)} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/5">Cancel</button>
              <button
                onClick={() => {
                  if (equationInput.trim()) canvasActions.addEquation(equationInput, 0, 0)
                  setEquationInput(""); setShowEquationDialog(false)
                }}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <ModalOverlay onClose={() => setShowShortcuts(false)}>
          <div className="w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="p-1 text-gray-400 hover:text-white" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-1">
              {KEYBOARD_SHORTCUTS.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-white/5">
                  <span className="text-sm text-gray-300">{s.action}</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/5 text-xs text-gray-400 font-mono">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* Confirm Delete Board */}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete Board"
        message="Are you sure you want to delete this board? This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (board) deleteBoardFromStore(board.id)
          setConfirmDelete(false)
          onBack()
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-4 rounded-2xl bg-[#1e2133] border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
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
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
