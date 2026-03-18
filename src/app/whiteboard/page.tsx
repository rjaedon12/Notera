"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  MousePointer2, Pencil, Highlighter, Eraser, Pointer, Square, Circle,
  Triangle, Minus, ArrowRight, Diamond, Type, StickyNote, Image as ImageIcon,
  Link2, Sigma, Hand, ZoomIn, ZoomOut, Maximize2, Undo2, Redo2, Save,
  Upload, Plus, Trash2,
  Copy, Group, Ungroup, Lock, Unlock, ChevronUp, ChevronDown, ChevronsUp,
  ChevronsDown, Keyboard, X, FileJson, FileImage,
  FileText, Presentation, Globe, GlobeLock, LayoutGrid,
  AlignLeft, AlignCenter, AlignRight,
  AlignStartVertical, AlignEndVertical, AlignCenterVertical,
  AlignHorizontalDistributeCenter, AlignVerticalDistributeCenter,
  Bold, Italic, Underline, Edit3,
  ChevronLeft, ChevronRight, ChevronDown as ChevronDownIcon,
  Share2, Eye, Pencil as PencilIcon, Link, Check, MoreHorizontal,
  Shapes, Spline, PanelRightOpen, PanelRightClose, Palette,
} from "lucide-react"
import toast from "react-hot-toast"

import type {
  ToolType, BackgroundType, StyleState, WBBoard, WBFrame, ShareMode,
} from "@/lib/whiteboard/types"
import {
  DEFAULT_STYLE, COLORS, STICKY_COLORS, BACKGROUND_OPTIONS, KEYBOARD_SHORTCUTS,
} from "@/lib/whiteboard/types"
import {
  saveBoard as saveBoardToStore, deleteBoard as deleteBoardFromStore,
  getUserBoards, createBoard as createBoardInStore, getBoardById,
  createShareLink, getBoardShareLinks, removeShareLink, getShareLink,
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

  if (error) return <span className="text-destructive text-xs">{error}</span>
  return <div ref={ref} className="text-foreground" />
}

// ============================================================================
// Flyout Menu — click-to-open sub-menu for shapes and lines
// ============================================================================

interface FlyoutItem {
  key: ToolType
  icon: React.ReactNode
  label: string
  shortcut: string
}

function ToolFlyout({
  items,
  activeTool,
  onSelect,
  triggerIcon,
  triggerLabel,
}: {
  items: FlyoutItem[]
  activeTool: ToolType
  onSelect: (tool: ToolType) => void
  triggerIcon: React.ReactNode
  triggerLabel: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeItem = items.find((i) => i.key === activeTool)
  const isGroupActive = items.some((i) => i.key === activeTool)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "wb-tool-btn group relative",
          isGroupActive ? "wb-tool-active" : ""
        )}
        title={triggerLabel}
        aria-label={triggerLabel}
      >
        {activeItem ? activeItem.icon : triggerIcon}
        <ChevronDownIcon className="h-2 w-2 absolute bottom-0.5 right-0.5 opacity-40" />
      </button>
      {open && (
        <div className="absolute left-full top-0 ml-2 z-50 animate-in fade-in slide-in-from-left-1 duration-150">
          <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl p-1.5 min-w-[160px]">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1 block select-none">{triggerLabel}</span>
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => { onSelect(item.key); setOpen(false) }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-lg text-sm transition-all",
                  activeTool === item.key
                    ? "bg-primary/15 text-primary"
                    : "text-foreground/70 hover:text-foreground hover:bg-muted"
                )}
              >
                {item.icon}
                <span className="whitespace-nowrap">{item.label}</span>
                {item.shortcut && (
                  <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Background Picker — visual swatch previews
// ============================================================================

function BackgroundPicker({
  background,
  customBgColor,
  onSelectBg,
  onCustomColor,
}: {
  background: BackgroundType
  customBgColor: string
  onSelectBg: (bg: BackgroundType) => void
  onCustomColor: (color: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="wb-topbar-btn"
        aria-label="Background"
        title="Canvas background"
      >
        <Palette className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 w-[288px] bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl z-50 p-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-1 select-none">Canvas Background</span>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {BACKGROUND_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { onSelectBg(opt.key); setOpen(false) }}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-xl transition-all border",
                  background === opt.key
                    ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                    : "border-transparent hover:bg-muted"
                )}
                title={opt.description}
              >
                <BgPreviewSwatch type={opt.key} />
                <span className="text-[10px] text-foreground/70 font-medium truncate w-full text-center">{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="border-t border-border mt-3 pt-2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Custom:</span>
            <input
              type="color"
              value={customBgColor}
              onChange={(e) => onCustomColor(e.target.value)}
              className="w-7 h-7 rounded-lg cursor-pointer border border-border bg-transparent"
            />
            <span className="text-[10px] text-muted-foreground font-mono">{customBgColor}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function BgPreviewSwatch({ type }: { type: BackgroundType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    const ctx = c.getContext("2d"); if (!ctx) return
    const w = 48, h = 32
    c.width = w; c.height = h
    const isDark = document.documentElement.classList.contains("dark")

    if (type === "transparent") {
      const s = 4
      for (let x = 0; x < w; x += s) for (let y = 0; y < h; y += s) {
        ctx.fillStyle = ((x / s + y / s) % 2 === 0) ? "#e0e0e0" : "#ffffff"
        ctx.fillRect(x, y, s, s)
      }
      return
    }

    ctx.fillStyle = isDark ? "#1a1a2e" : "#ffffff"
    if (type === "plain-dark") ctx.fillStyle = "#1a1a2e"
    if (type === "plain") ctx.fillStyle = isDark ? "#1a1a2e" : "#ffffff"
    ctx.fillRect(0, 0, w, h)

    const dotColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)"
    const lineColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"

    if (type === "dots") {
      ctx.fillStyle = dotColor
      for (let x = 4; x < w; x += 8) for (let y = 4; y < h; y += 8) { ctx.beginPath(); ctx.arc(x, y, 0.8, 0, Math.PI * 2); ctx.fill() }
    } else if (type === "grid") {
      ctx.strokeStyle = lineColor; ctx.lineWidth = 0.5; ctx.beginPath()
      for (let x = 0; x < w; x += 8) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
      for (let y = 0; y < h; y += 8) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
      ctx.stroke()
    } else if (type === "lined") {
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(59,130,246,0.15)"; ctx.lineWidth = 0.5; ctx.beginPath()
      for (let y = 4; y < h; y += 6) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
      ctx.stroke()
    } else if (type === "isometric") {
      ctx.strokeStyle = lineColor; ctx.lineWidth = 0.3; ctx.beginPath()
      for (let y = 0; y < h; y += 8) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
      for (let x = -h; x < w + h; x += 8) { ctx.moveTo(x, 0); ctx.lineTo(x + h * 0.577, h); ctx.moveTo(x, 0); ctx.lineTo(x - h * 0.577, h) }
      ctx.stroke()
    } else if (type === "crosshatch") {
      ctx.strokeStyle = lineColor; ctx.lineWidth = 0.3; ctx.beginPath()
      for (let x = 0; x < w; x += 6) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
      for (let y = 0; y < h; y += 6) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
      for (let x = -h; x < w + h; x += 12) { ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.moveTo(x, 0); ctx.lineTo(x - h, h) }
      ctx.stroke()
    }
  }, [type])

  return <canvas ref={canvasRef} className="w-12 h-8 rounded-md border border-border" />
}

// ============================================================================
// Share Dialog
// ============================================================================

function ShareDialog({ board, onClose }: { board: WBBoard; onClose: () => void }) {
  const [links, setLinks] = useState(getBoardShareLinks(board.id))
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const generateLink = (mode: ShareMode) => {
    const link = createShareLink(board.id, mode)
    setLinks(getBoardShareLinks(board.id))
    copyToClipboard(link.id)
    toast.success(`${mode === "view" ? "View-only" : "Edit"} link created`)
  }

  const copyToClipboard = (linkId: string) => {
    const url = `${window.location.origin}/whiteboard?share=${linkId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(linkId)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const handleRemove = (linkId: string) => {
    removeShareLink(board.id, linkId)
    setLinks(getBoardShareLinks(board.id))
    toast.success("Share link removed")
  }

  return (
    <ModalOverlay onClose={onClose}>
      <div className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Share Board</h3>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Create share links so others can view or collaborate on &ldquo;{board.title}&rdquo;.
        </p>
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => generateLink("view")}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:bg-muted transition-all group"
          >
            <Eye className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-foreground">View Only</span>
            <span className="text-[10px] text-muted-foreground">Others can see but not edit</span>
          </button>
          <button
            onClick={() => generateLink("edit")}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border hover:bg-muted transition-all group"
          >
            <PencilIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-sm font-medium text-foreground">Can Edit</span>
            <span className="text-[10px] text-muted-foreground">Others can view and edit</span>
          </button>
        </div>
        {links.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Active Links</span>
            {links.map((link) => (
              <div key={link.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50 border border-border">
                <div className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0",
                  link.mode === "view" ? "bg-blue-500/10 text-blue-500" : "bg-green-500/10 text-green-500"
                )}>
                  {link.mode === "view" ? <Eye className="h-3 w-3" /> : <PencilIcon className="h-3 w-3" />}
                  {link.mode === "view" ? "View" : "Edit"}
                </div>
                <span className="text-xs text-muted-foreground font-mono flex-1 truncate">...{link.id.slice(-8)}</span>
                <button
                  onClick={() => copyToClipboard(link.id)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Copy link"
                >
                  {copiedId === link.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Link className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => handleRemove(link.id)}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remove link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalOverlay>
  )
}

// ============================================================================
// Main Entry Point
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
  const [shareView, setShareView] = useState<{ boardId: string; mode: "view" | "edit" } | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareId = params.get("share")
    if (shareId) {
      const result = getShareLink(shareId)
      if (result) {
        setShareView({ boardId: result.board.id, mode: result.link.mode })
      } else {
        toast.error("Share link not found or expired")
      }
    }
  }, [])

  if (shareView) {
    return (
      <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
        <WhiteboardCanvas
          boardId={shareView.boardId}
          user={user}
          isAdmin={false}
          onBack={() => { window.history.pushState({}, "", "/whiteboard"); setShareView(null) }}
          onLogout={() => {}}
          shareMode={shareView.mode}
        />
      </div>
    )
  }

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
// Board Dashboard (themed)
// ============================================================================

interface BoardDashboardProps {
  boards: WBBoard[]
  user: { id: string; username: string; isAdmin: boolean }
  isAdmin: boolean
  onCreateBoard: (title: string) => void
  onOpenBoard: (id: string) => void
  onDeleteBoard: (id: string) => void
  onDuplicateBoard: (id: string) => void
  onLogout: () => void
}

function BoardDashboard({ boards, onCreateBoard, onOpenBoard, onDeleteBoard, onDuplicateBoard }: BoardDashboardProps) {
  const [newTitle, setNewTitle] = useState("")
  const [showNew, setShowNew] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; id: string; title: string }>({ open: false, id: "", title: "" })

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-heading">My Whiteboards</h1>
            <p className="text-muted-foreground mt-1">Create and manage your visual workspaces</p>
          </div>
          <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all">
            <Plus className="h-4 w-4" /> New Board
          </button>
        </div>

        {boards.length === 0 ? (
          <div className="text-center py-20">
            <LayoutGrid className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-medium text-foreground mb-2">No whiteboards yet</h3>
            <p className="text-muted-foreground mb-6">Create your first whiteboard to get started</p>
            <button onClick={() => setShowNew(true)} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all">Create Whiteboard</button>
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
                    <div className="w-full h-full flex items-center justify-center"><LayoutGrid className="h-10 w-10 text-muted-foreground/20" /></div>
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {board.isPublic ? (
                      <span className="p-1 rounded-md bg-black/40"><Globe className="h-3.5 w-3.5 text-green-400" /></span>
                    ) : (
                      <span className="p-1 rounded-md bg-black/40"><GlobeLock className="h-3.5 w-3.5 text-gray-400" /></span>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onDuplicateBoard(board.id) }} className="p-1 rounded-md bg-black/40 text-gray-300 hover:text-white hover:bg-black/60 transition-colors" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setConfirmDelete({ open: true, id: board.id, title: board.title }) }} className="p-1 rounded-md bg-black/40 text-red-400 hover:text-red-300 hover:bg-black/60 transition-colors" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-card-foreground truncate">{board.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date(board.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNew && (
        <ModalOverlay onClose={() => setShowNew(false)}>
          <div className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">New Whiteboard</h3>
            <input
              type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Board title..."
              className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") { onCreateBoard(newTitle || "Untitled Board"); setNewTitle(""); setShowNew(false) }; if (e.key === "Escape") setShowNew(false) }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="px-4 py-2 text-sm rounded-lg text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={() => { onCreateBoard(newTitle || "Untitled Board"); setNewTitle(""); setShowNew(false) }} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90">Create</button>
            </div>
          </div>
        </ModalOverlay>
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
// Whiteboard Canvas — Redesigned: Themed, Decluttered, Flyout menus
// ============================================================================

interface WhiteboardCanvasProps {
  boardId: string
  user: { id: string; username: string; isAdmin: boolean }
  isAdmin: boolean
  onBack: () => void
  onLogout: () => void
  shareMode?: ShareMode
}

function WhiteboardCanvas({ boardId, onBack, shareMode }: WhiteboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const isViewOnly = shareMode === "view"

  // Board state
  const [board, setBoard] = useState<WBBoard | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [tool, setTool] = useState<ToolType>("select")
  const [style, setStyle] = useState<StyleState>({ ...DEFAULT_STYLE })
  const [background, setBackground] = useState<BackgroundType>("plain")
  const [customBgColor, setCustomBgColor] = useState("#ffffff")
  const [isDark, setIsDark] = useState(false)
  const [selectedObj, setSelectedObj] = useState<any>(null)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)

  // UI panels
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [showFrames, setShowFrames] = useState(false)
  const [showTextDialog, setShowTextDialog] = useState(false)
  const [showStickyDialog, setShowStickyDialog] = useState(false)
  const [showEquationDialog, setShowEquationDialog] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [textInput, setTextInput] = useState("")
  const [stickyInput, setStickyInput] = useState("")
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0])
  const [equationInput, setEquationInput] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [presentMode, setPresentMode] = useState(false)
  const [isRenamingTitle, setIsRenamingTitle] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [selectedCount, setSelectedCount] = useState(0)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true)

  // Auto-hide minimap
  const [minimapVisible, setMinimapVisible] = useState(false)
  const minimapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Frames
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
      if (b.canvasJSON) setTimeout(() => canvasActions.loadCanvasJSON(b.canvasJSON), 500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId])

  // Detect dark mode
  useEffect(() => {
    const dark = document.documentElement.classList.contains("dark")
    setIsDark(dark)
    const observer = new MutationObserver(() => setIsDark(document.documentElement.classList.contains("dark")))
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => { if (hasChanges) handleSaveRef.current() }, 30000)
    return () => clearInterval(interval)
  }, [hasChanges])

  // Zoom tracking
  useEffect(() => {
    const interval = setInterval(() => setZoom(Math.round(canvasActions.getZoom() * 100)), 500)
    return () => clearInterval(interval)
  }, [canvasActions])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isViewOnly) return
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.contentEditable === "true") return

      const toolMap: Record<string, ToolType> = {
        v: "select", p: "pen", h: "highlighter", e: "eraser",
        l: "laser", r: "rect", c: "circle", t: "text",
        s: "sticky", n: "line", a: "arrow", d: "diamond", q: "equation",
      }
      if (!e.ctrlKey && !e.metaKey && toolMap[e.key.toLowerCase()]) { setTool(toolMap[e.key.toLowerCase()]); return }
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) { setShowShortcuts(true); return }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); canvasActions.undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); canvasActions.redo() }
      if (e.key === "Delete" || e.key === "Backspace") { if (selectedObj) { e.preventDefault(); canvasActions.deleteSelected() } }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") { e.preventDefault(); canvasActions.duplicateSelected() }
      if ((e.ctrlKey || e.metaKey) && e.key === "a") { e.preventDefault(); canvasActions.selectAll() }
      if ((e.ctrlKey || e.metaKey) && e.key === "g" && !e.shiftKey) { e.preventDefault(); canvasActions.groupSelected() }
      if ((e.ctrlKey || e.metaKey) && e.key === "g" && e.shiftKey) { e.preventDefault(); canvasActions.ungroupSelected() }
      if (e.key === "Escape") {
        if (presentMode) setPresentMode(false)
        setShowShortcuts(false); setShowTextDialog(false); setShowStickyDialog(false)
        setShowEquationDialog(false); setShowFrames(false); setShowShareDialog(false); setShowMoreMenu(false)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [canvasActions, selectedObj, presentMode, isViewOnly])

  // Save
  const handleSave = useCallback(() => {
    if (!board || isViewOnly) return
    const json = canvasActions.serializeCanvas()
    const thumb = canvasActions.getMinimapDataUrl()
    if (thumb) setThumbnailUrl(thumb)
    const updated: WBBoard = {
      ...board, canvasJSON: json, background, customBgColor, frames, activeFrameId,
      updatedAt: new Date().toISOString(), thumbnail: thumb || board.thumbnail,
    }
    saveBoardToStore(updated); setBoard(updated); setHasChanges(false)
    setLastSaved(new Date().toISOString()); toast.success("Board saved")
  }, [board, canvasActions, background, customBgColor, frames, activeFrameId, isViewOnly])

  // Keep a ref to always-latest handleSave for use in auto-save interval
  const handleSaveRef = useRef(handleSave)
  useEffect(() => { handleSaveRef.current = handleSave }, [handleSave])

  // Rename
  const handleRenameCommit = useCallback(() => {
    if (!board || !renameValue.trim()) { setIsRenamingTitle(false); return }
    const updated = { ...board, title: renameValue.trim() }
    saveBoardToStore(updated); setBoard(updated); setIsRenamingTitle(false); toast.success("Board renamed")
  }, [board, renameValue])

  // Minimap update
  useEffect(() => {
    const interval = setInterval(() => { const url = canvasActions.getMinimapDataUrl(); if (url) setThumbnailUrl(url) }, 2000)
    return () => clearInterval(interval)
  }, [canvasActions])

  // Exports
  const handleExportPNG = () => { const el = canvasActions.getCanvasEl(); if (el) exportCanvasPNG(el, board?.title || "whiteboard") }
  const handleExportSVG = () => { const svg = canvasActions.getSVGString(); if (svg) exportCanvasSVG(svg, board?.title || "whiteboard") }
  const handleExportPDF = async () => { const el = canvasActions.getCanvasEl(); if (el) await exportCanvasPDF(el, board?.title || "whiteboard") }
  const handleExportJSON = () => { if (board) { const updated = { ...board, canvasJSON: canvasActions.serializeCanvas() }; exportBoardJSON(updated) } }
  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const imported = await importBoardJSON(file)
      if (imported.canvasJSON) {
        await canvasActions.loadCanvasJSON(imported.canvasJSON)
        setBackground(imported.background)
        if (imported.customBgColor) setCustomBgColor(imported.customBgColor)
        if (imported.frames) { setFrames(imported.frames); setActiveFrameId(imported.activeFrameId || imported.frames[0]?.id || "") }
        setHasChanges(true); toast.success("Board imported!")
      }
    } catch (err: any) { toast.error(err.message || "Failed to import") }
    e.target.value = ""
  }
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => canvasActions.addImage(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ""
  }
  const togglePublic = () => {
    if (!board) return
    const updated = { ...board, isPublic: !board.isPublic }
    saveBoardToStore(updated); setBoard(updated)
    toast.success(updated.isPublic ? "Board is now public" : "Board is now private")
  }

  // Frame management
  const addFrame = () => {
    const id = crypto.randomUUID()
    const newFrame: WBFrame = { id, name: "Frame " + (frames.length + 1), viewportTransform: [1, 0, 0, 1, 0, 0], canvasJSON: "" }
    setFrames([...frames, newFrame]); setHasChanges(true)
  }
  const deleteFrame = (frameId: string) => {
    if (frames.length <= 1) return
    const newFrames = frames.filter((f) => f.id !== frameId)
    setFrames(newFrames)
    if (activeFrameId === frameId) setActiveFrameId(newFrames[0]?.id || "")
    setHasChanges(true)
  }

  const lastSavedText = lastSaved ? "Saved " + getTimeAgo(lastSaved) : "Not saved"
  const currentFrameIdx = frames.findIndex((f) => f.id === activeFrameId)
  const goNextFrame = useCallback(() => { if (frames.length === 0) return; setActiveFrameId(frames[(currentFrameIdx + 1) % frames.length].id) }, [frames, currentFrameIdx])
  const goPrevFrame = useCallback(() => { if (frames.length === 0) return; setActiveFrameId(frames[(currentFrameIdx - 1 + frames.length) % frames.length].id) }, [frames, currentFrameIdx])

  // Shape & Line flyout items
  const shapeTools: FlyoutItem[] = [
    { key: "rect", icon: <Square className="h-4 w-4" />, label: "Rectangle", shortcut: "R" },
    { key: "circle", icon: <Circle className="h-4 w-4" />, label: "Ellipse", shortcut: "C" },
    { key: "triangle", icon: <Triangle className="h-4 w-4" />, label: "Triangle", shortcut: "" },
    { key: "diamond", icon: <Diamond className="h-4 w-4" />, label: "Diamond", shortcut: "D" },
  ]
  const lineTools: FlyoutItem[] = [
    { key: "line", icon: <Minus className="h-4 w-4" />, label: "Line", shortcut: "N" },
    { key: "arrow", icon: <ArrowRight className="h-4 w-4" />, label: "Arrow", shortcut: "A" },
    { key: "connector", icon: <Link2 className="h-4 w-4" />, label: "Connector", shortcut: "" },
  ]

  // Auto-show/hide minimap
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const nearBottomRight = (e.clientX > rect.right - 180) && (e.clientY > rect.bottom - 140)
    if (nearBottomRight) {
      setMinimapVisible(true)
      if (minimapTimerRef.current) { clearTimeout(minimapTimerRef.current); minimapTimerRef.current = null }
    } else if (!minimapTimerRef.current) {
      minimapTimerRef.current = setTimeout(() => { setMinimapVisible(false); minimapTimerRef.current = null }, 1500)
    }
  }, [])

  // ========================= Main Canvas Editor Layout =========================
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">
      {/* Present Mode Overlay — renders on top without unmounting the canvas */}
      {presentMode && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" style={{ touchAction: "none" }}>
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm z-10 opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white font-medium text-sm">{board?.title}</span>
            <div className="flex items-center gap-2">
              {frames.length > 1 && (
                <>
                  <button onClick={goPrevFrame} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="text-xs text-gray-300">{currentFrameIdx + 1} / {frames.length}</span>
                  <button onClick={goNextFrame} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"><ChevronRight className="h-4 w-4" /></button>
                </>
              )}
              <button onClick={() => setPresentMode(false)} className="p-1.5 rounded-lg bg-white/10 text-white hover:bg-white/20"><X className="h-4 w-4" /></button>
            </div>
          </div>
          {frames.length > 1 && (
            <div className="absolute bottom-4 inset-x-0 flex justify-center gap-2 z-10">
              {frames.map((f, i) => (
                <button key={f.id} onClick={() => setActiveFrameId(f.id)} className={cn("w-2 h-2 rounded-full transition-colors", i === currentFrameIdx ? "bg-white" : "bg-white/30 hover:bg-white/60")} />
              ))}
            </div>
          )}
          <p className="absolute bottom-2 right-4 text-[10px] text-white/20 z-10">ESC to exit</p>
        </div>
      )}
      {/* Share mode banner */}
      {shareMode && (
        <div className={cn(
          "flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium border-b",
          shareMode === "view" ? "bg-blue-500/8 text-blue-600 dark:text-blue-400 border-blue-500/20" : "bg-green-500/8 text-green-600 dark:text-green-400 border-green-500/20"
        )}>
          {shareMode === "view" ? <Eye className="h-3.5 w-3.5" /> : <PencilIcon className="h-3.5 w-3.5" />}
          {shareMode === "view" ? "View-only mode — You can look but not edit" : "Shared edit mode — Changes will be saved"}
          <button onClick={onBack} className="ml-3 text-xs underline opacity-70 hover:opacity-100">Leave</button>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="flex items-center gap-2 px-3 py-1.5 shrink-0 bg-card/80 backdrop-blur-xl border-b border-border">
        <button onClick={onBack} className="wb-topbar-btn"><ChevronLeft className="h-4 w-4" /></button>

        {isRenamingTitle ? (
          <input
            className="text-sm font-medium text-foreground bg-muted rounded px-2 py-0.5 border border-primary/50 focus:outline-none max-w-[200px]"
            value={renameValue} autoFocus onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameCommit}
            onKeyDown={(e) => { if (e.key === "Enter") handleRenameCommit(); if (e.key === "Escape") setIsRenamingTitle(false) }}
          />
        ) : (
          <button
            className="flex items-center gap-1 text-sm font-medium text-foreground truncate max-w-[200px] hover:text-primary transition-colors group"
            onDoubleClick={() => { if (!isViewOnly) { setRenameValue(board?.title || ""); setIsRenamingTitle(true) } }}
            title="Double-click to rename"
          >
            <span className="truncate">{board?.title || "Untitled"}</span>
            {!isViewOnly && <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-50 shrink-0" />}
          </button>
        )}
        <span className="text-xs text-muted-foreground ml-1">{lastSavedText}</span>

        <div className="flex-1" />

        {/* Center: Undo/Redo + Zoom */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-muted/50 border border-border/50">
          {!isViewOnly && (
            <>
              <button onClick={canvasActions.undo} disabled={!canvasActions.canUndo} className="wb-topbar-btn disabled:opacity-30" title="Undo"><Undo2 className="h-3.5 w-3.5" /></button>
              <button onClick={canvasActions.redo} disabled={!canvasActions.canRedo} className="wb-topbar-btn disabled:opacity-30" title="Redo"><Redo2 className="h-3.5 w-3.5" /></button>
              <div className="h-4 w-px bg-border mx-0.5" />
            </>
          )}
          <button onClick={() => canvasActions.zoomTo(canvasActions.getZoom() * 0.8)} className="wb-topbar-btn"><ZoomOut className="h-3.5 w-3.5" /></button>
          <span className="text-xs text-muted-foreground w-10 text-center tabular-nums select-none">{zoom}%</span>
          <button onClick={() => canvasActions.zoomTo(canvasActions.getZoom() * 1.25)} className="wb-topbar-btn"><ZoomIn className="h-3.5 w-3.5" /></button>
          <button onClick={canvasActions.zoomToFit} className="wb-topbar-btn" title="Fit to view"><Maximize2 className="h-3.5 w-3.5" /></button>
        </div>

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {!isViewOnly && (
            <>
              <button onClick={togglePublic} className="wb-topbar-btn" title={board?.isPublic ? "Public" : "Private"}>
                {board?.isPublic ? <Globe className="h-4 w-4 text-green-500" /> : <GlobeLock className="h-4 w-4" />}
              </button>
              <button onClick={() => setShowShareDialog(true)} className="wb-topbar-btn" title="Share board"><Share2 className="h-4 w-4" /></button>
            </>
          )}
          <button onClick={() => setPresentMode(true)} className="wb-topbar-btn" title="Present mode"><Presentation className="h-4 w-4" /></button>
          <BackgroundPicker
            background={background} customBgColor={customBgColor}
            onSelectBg={(bg) => { setBackground(bg); setHasChanges(true) }}
            onCustomColor={(color) => { setCustomBgColor(color); setHasChanges(true) }}
          />
          {/* More menu */}
          <div className="relative">
            <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="wb-topbar-btn" title="More options"><MoreHorizontal className="h-4 w-4" /></button>
            {showMoreMenu && (
              <MoreMenu
                onClose={() => setShowMoreMenu(false)}
                onExportPNG={() => { handleExportPNG(); setShowMoreMenu(false) }}
                onExportSVG={() => { handleExportSVG(); setShowMoreMenu(false) }}
                onExportPDF={() => { handleExportPDF(); setShowMoreMenu(false) }}
                onExportJSON={() => { handleExportJSON(); setShowMoreMenu(false) }}
                onImportJSON={() => { importInputRef.current?.click(); setShowMoreMenu(false) }}
                onShortcuts={() => { setShowShortcuts(true); setShowMoreMenu(false) }}
                onDelete={!isViewOnly ? () => { setConfirmDelete(true); setShowMoreMenu(false) } : undefined}
                onFrames={() => { setShowFrames(!showFrames); setShowMoreMenu(false) }}
                showFrames={showFrames}
              />
            )}
          </div>
          {!isViewOnly && (
            <button
              onClick={handleSave}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ml-1",
                hasChanges ? "bg-primary text-primary-foreground hover:opacity-90 shadow-sm" : "text-muted-foreground bg-muted/50"
              )}
            ><Save className="h-3.5 w-3.5" /> Save</button>
          )}
        </div>
      </div>

      {/* ── Main Canvas Area ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Tool Palette */}
        {!isViewOnly && (
          <div className="w-12 bg-card/60 backdrop-blur-xl border-r border-border flex flex-col items-center py-2 gap-0.5 shrink-0 overflow-y-auto">
            <span className="wb-tool-label">Select</span>
            <button onClick={() => setTool("select")} className={cn("wb-tool-btn", tool === "select" && "wb-tool-active")} title="Select (V)"><MousePointer2 className="h-4 w-4" /></button>
            <button onClick={() => setTool("pan")} className={cn("wb-tool-btn", tool === "pan" && "wb-tool-active")} title="Pan (Space)"><Hand className="h-4 w-4" /></button>

            <div className="wb-tool-divider" />

            <span className="wb-tool-label">Draw</span>
            <button onClick={() => setTool("pen")} className={cn("wb-tool-btn", tool === "pen" && "wb-tool-active")} title="Pen (P)"><Pencil className="h-4 w-4" /></button>
            <button onClick={() => setTool("highlighter")} className={cn("wb-tool-btn", tool === "highlighter" && "wb-tool-active")} title="Highlighter (H)"><Highlighter className="h-4 w-4" /></button>
            <button onClick={() => setTool("eraser")} className={cn("wb-tool-btn", tool === "eraser" && "wb-tool-active")} title="Eraser (E)"><Eraser className="h-4 w-4" /></button>
            <button onClick={() => setTool("laser")} className={cn("wb-tool-btn", tool === "laser" && "wb-tool-active")} title="Laser (L)"><Pointer className="h-4 w-4" /></button>

            <div className="wb-tool-divider" />

            <span className="wb-tool-label">Shape</span>
            <ToolFlyout items={shapeTools} activeTool={tool} onSelect={setTool} triggerIcon={<Shapes className="h-4 w-4" />} triggerLabel="Shapes" />
            <ToolFlyout items={lineTools} activeTool={tool} onSelect={setTool} triggerIcon={<Spline className="h-4 w-4" />} triggerLabel="Lines" />

            <div className="wb-tool-divider" />

            <span className="wb-tool-label">Insert</span>
            <button onClick={() => setShowTextDialog(true)} className="wb-tool-btn" title="Text (T)"><Type className="h-4 w-4" /></button>
            <button onClick={() => setShowStickyDialog(true)} className="wb-tool-btn" title="Sticky Note (S)"><StickyNote className="h-4 w-4" /></button>
            <button onClick={() => setShowEquationDialog(true)} className="wb-tool-btn" title="Equation (Q)"><Sigma className="h-4 w-4" /></button>
            <button onClick={() => fileInputRef.current?.click()} className="wb-tool-btn" title="Image"><ImageIcon className="h-4 w-4" /></button>

            <div className="flex-1" />
          </div>
        )}

        {/* Frames sidebar */}
        {showFrames && (
          <div className="w-48 bg-card/90 backdrop-blur-xl border-r border-border flex flex-col shrink-0">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Frames</span>
              <button onClick={addFrame} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {frames.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No frames yet</p>}
              {frames.map((frame) => (
                <div
                  key={frame.id}
                  className={cn("flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm cursor-pointer", activeFrameId === frame.id ? "bg-primary/10 text-primary" : "text-foreground/70 hover:bg-muted")}
                  onClick={() => setActiveFrameId(frame.id)}
                >
                  <span className="flex-1 truncate">{frame.name}</span>
                  {frames.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); deleteFrame(frame.id) }} className="p-0.5 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
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
            onMouseMove={handleCanvasMouseMove}
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

          {/* Color/Stroke bar (when drawing tools active) */}
          {!isViewOnly && ["pen", "highlighter", "rect", "circle", "triangle", "line", "arrow", "diamond", "connector"].includes(tool) && !selectedObj && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
              <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-xl p-2.5 flex items-center gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setStyle((s) => ({ ...s, strokeColor: c }))}
                    className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110", style.strokeColor === c ? "border-primary scale-110 ring-2 ring-primary/30" : "border-transparent")}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <div className="h-5 w-px bg-border mx-0.5" />
                <input type="color" value={style.strokeColor} onChange={(e) => setStyle((s) => ({ ...s, strokeColor: e.target.value }))} className="w-6 h-6 rounded-full cursor-pointer border-0 bg-transparent" />
                <div className="h-5 w-px bg-border mx-0.5" />
                <input type="range" min={1} max={20} value={style.strokeWidth} onChange={(e) => setStyle((s) => ({ ...s, strokeWidth: Number(e.target.value) }))} className="w-20 accent-[var(--primary)]" />
                <span className="text-xs text-muted-foreground w-5 tabular-nums text-center">{style.strokeWidth}</span>
              </div>
            </div>
          )}

          {/* Context Style Panel — collapsible right panel */}
          {selectedObj && tool === "select" && !isViewOnly && (
            <div className="absolute top-2 right-2 z-30">
              <button onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)} className="wb-topbar-btn mb-1" title={rightPanelCollapsed ? "Show style panel" : "Hide style panel"}>
                {rightPanelCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
              </button>
              {!rightPanelCollapsed && (
                <div className="bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl p-3 w-60 space-y-3 max-h-[calc(100vh-10rem)] overflow-y-auto animate-in fade-in slide-in-from-right-1 duration-150">
                  {/* Colors */}
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Colors</span>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Stroke</span>
                        <input type="color" value={style.strokeColor} onChange={(e) => setStyle((s) => ({ ...s, strokeColor: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border border-border" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Fill</span>
                        <input type="color" value={style.fillColor === "transparent" ? "#ffffff" : style.fillColor} onChange={(e) => setStyle((s) => ({ ...s, fillColor: e.target.value }))} className="w-6 h-6 rounded cursor-pointer border border-border" />
                        <button onClick={() => setStyle((s) => ({ ...s, fillColor: "transparent" }))} className={cn("text-xs px-1 py-0.5 rounded border", style.fillColor === "transparent" ? "border-primary text-primary" : "border-border text-muted-foreground")} title="No fill">{"\u2205"}</button>
                      </div>
                    </div>
                  </div>
                  {/* Stroke */}
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Stroke</span>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="range" min={1} max={20} value={style.strokeWidth} onChange={(e) => setStyle((s) => ({ ...s, strokeWidth: Number(e.target.value) }))} className="flex-1 accent-[var(--primary)]" />
                      <span className="text-xs text-muted-foreground w-4 tabular-nums">{style.strokeWidth}</span>
                      <select value={style.dashStyle} onChange={(e) => setStyle((s) => ({ ...s, dashStyle: e.target.value as any }))} className="text-xs bg-muted border border-border text-foreground rounded px-1.5 py-0.5 cursor-pointer">
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                      </select>
                    </div>
                  </div>
                  {/* Opacity */}
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Opacity</span>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="range" min={0} max={1} step={0.05} value={style.fillOpacity} onChange={(e) => setStyle((s) => ({ ...s, fillOpacity: Number(e.target.value) }))} className="flex-1 accent-[var(--primary)]" />
                      <span className="text-xs text-muted-foreground w-8 tabular-nums">{Math.round(style.fillOpacity * 100)}%</span>
                    </div>
                  </div>
                  {/* Text */}
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Text</span>
                    <div className="flex items-center gap-0.5 mt-1">
                      <button onClick={() => setStyle((s) => ({ ...s, fontBold: !s.fontBold }))} className={cn("p-1.5 rounded-md transition-colors", style.fontBold ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")} title="Bold"><Bold className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setStyle((s) => ({ ...s, fontItalic: !s.fontItalic }))} className={cn("p-1.5 rounded-md transition-colors", style.fontItalic ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")} title="Italic"><Italic className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setStyle((s) => ({ ...s, fontUnderline: !s.fontUnderline }))} className={cn("p-1.5 rounded-md transition-colors", style.fontUnderline ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted")} title="Underline"><Underline className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {/* Layer */}
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Layer</span>
                    <div className="flex items-center gap-0.5 mt-1">
                      <button onClick={canvasActions.bringForward} className="wb-topbar-btn" title="Bring forward"><ChevronUp className="h-3.5 w-3.5" /></button>
                      <button onClick={canvasActions.sendBackward} className="wb-topbar-btn" title="Send backward"><ChevronDown className="h-3.5 w-3.5" /></button>
                      <button onClick={canvasActions.bringToFront} className="wb-topbar-btn" title="Bring to front"><ChevronsUp className="h-3.5 w-3.5" /></button>
                      <button onClick={canvasActions.sendToBack} className="wb-topbar-btn" title="Send to back"><ChevronsDown className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  {/* Alignment (2+ objects) */}
                  {selectedCount >= 2 && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Align</span>
                      <div className="flex items-center gap-0.5 mt-1 flex-wrap">
                        <button onClick={() => canvasActions.alignObjects("left")} className="wb-topbar-btn" title="Align left"><AlignLeft className="h-3.5 w-3.5" /></button>
                        <button onClick={() => canvasActions.alignObjects("centerH")} className="wb-topbar-btn" title="Center H"><AlignCenter className="h-3.5 w-3.5" /></button>
                        <button onClick={() => canvasActions.alignObjects("right")} className="wb-topbar-btn" title="Align right"><AlignRight className="h-3.5 w-3.5" /></button>
                        <button onClick={() => canvasActions.alignObjects("top")} className="wb-topbar-btn" title="Align top"><AlignStartVertical className="h-3.5 w-3.5" /></button>
                        <button onClick={() => canvasActions.alignObjects("centerV")} className="wb-topbar-btn" title="Center V"><AlignCenterVertical className="h-3.5 w-3.5" /></button>
                        <button onClick={() => canvasActions.alignObjects("bottom")} className="wb-topbar-btn" title="Align bottom"><AlignEndVertical className="h-3.5 w-3.5" /></button>
                        {selectedCount >= 3 && (
                          <>
                            <button onClick={() => canvasActions.distributeObjects("horizontal")} className="wb-topbar-btn" title="Distribute H"><AlignHorizontalDistributeCenter className="h-3.5 w-3.5" /></button>
                            <button onClick={() => canvasActions.distributeObjects("vertical")} className="wb-topbar-btn" title="Distribute V"><AlignVerticalDistributeCenter className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Actions */}
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Actions</span>
                    <div className="flex items-center gap-0.5 mt-1 flex-wrap">
                      <button onClick={() => canvasActions.lockObject(true)} className="wb-topbar-btn" title="Lock"><Lock className="h-3.5 w-3.5" /></button>
                      <button onClick={() => canvasActions.lockObject(false)} className="wb-topbar-btn" title="Unlock"><Unlock className="h-3.5 w-3.5" /></button>
                      <button onClick={canvasActions.groupSelected} className="wb-topbar-btn" title="Group"><Group className="h-3.5 w-3.5" /></button>
                      <button onClick={canvasActions.ungroupSelected} className="wb-topbar-btn" title="Ungroup"><Ungroup className="h-3.5 w-3.5" /></button>
                      <button onClick={canvasActions.duplicateSelected} className="wb-topbar-btn" title="Duplicate"><Copy className="h-3.5 w-3.5" /></button>
                      <button onClick={canvasActions.deleteSelected} className="p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Auto-hide Minimap */}
          <div
            className={cn(
              "absolute bottom-4 right-4 w-36 h-24 bg-card/80 backdrop-blur-xl border border-border rounded-xl overflow-hidden z-20 cursor-pointer transition-all duration-300",
              minimapVisible ? "opacity-80 translate-y-0 hover:opacity-100" : "opacity-0 translate-y-2 pointer-events-none"
            )}
            title="Click to fit view"
            onClick={canvasActions.zoomToFit}
          >
            {thumbnailUrl ? (
              <img src={thumbnailUrl} alt="minimap" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground uppercase tracking-wider">minimap</div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportJSON} />

      {/* Share Dialog */}
      {showShareDialog && board && <ShareDialog board={board} onClose={() => setShowShareDialog(false)} />}

      {/* Dialogs */}
      {showTextDialog && (
        <ModalOverlay onClose={() => setShowTextDialog(false)}>
          <div className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add Text</h3>
            <textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} className="w-full p-3 rounded-lg bg-muted border border-border text-foreground resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-primary/50" rows={3} placeholder="Type text here..." autoFocus />
            <div className="flex items-center gap-2 mb-4">
              <label className="text-sm text-muted-foreground">Size:</label>
              <input type="range" min={12} max={72} value={style.fontSize} onChange={(e) => setStyle((s) => ({ ...s, fontSize: Number(e.target.value) }))} className="flex-1 accent-[var(--primary)]" />
              <span className="text-sm text-muted-foreground w-8 tabular-nums">{style.fontSize}</span>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowTextDialog(false)} className="px-4 py-2 text-sm rounded-lg text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={() => { if (textInput.trim()) { canvasActions.addText(textInput, 0, 0, style); setTool("select") }; setTextInput(""); setShowTextDialog(false) }} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90">Add</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showStickyDialog && (
        <ModalOverlay onClose={() => setShowStickyDialog(false)}>
          <div className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Add Sticky Note</h3>
            <textarea value={stickyInput} onChange={(e) => setStickyInput(e.target.value)} className="w-full p-3 rounded-lg bg-muted border border-border text-foreground resize-none mb-3 focus:outline-none focus:ring-2 focus:ring-primary/50" rows={3} placeholder="Note content..." autoFocus />
            <div className="mb-4">
              <label className="text-sm text-muted-foreground block mb-2">Color:</label>
              <div className="flex gap-2">
                {STICKY_COLORS.map((c) => (
                  <button key={c} onClick={() => setStickyColor(c)} className={cn("w-8 h-8 rounded-lg border-2 transition-transform", stickyColor === c ? "border-primary scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowStickyDialog(false)} className="px-4 py-2 text-sm rounded-lg text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={() => { canvasActions.addSticky(stickyInput || "New note", 0, 0, stickyColor); setStickyInput(""); setShowStickyDialog(false) }} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90">Add</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showEquationDialog && (
        <ModalOverlay onClose={() => setShowEquationDialog(false)}>
          <div className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Add Equation</h3>
            <p className="text-xs text-muted-foreground mb-4">{"Enter LaTeX notation (e.g. E = mc^2, \\frac{a}{b}, \\sqrt{x})"}</p>
            <input
              type="text" value={equationInput} onChange={(e) => setEquationInput(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg bg-muted border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 mb-2 font-mono"
              placeholder="e.g. E = mc^2" autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") { if (equationInput.trim()) canvasActions.addEquation(equationInput, 0, 0); setEquationInput(""); setShowEquationDialog(false) } }}
            />
            {equationInput.trim() && (
              <div className="mb-4 p-3 rounded-lg bg-muted border border-border text-center overflow-x-auto"><EquationPreview latex={equationInput} /></div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEquationDialog(false)} className="px-4 py-2 text-sm rounded-lg text-muted-foreground hover:bg-muted">Cancel</button>
              <button onClick={() => { if (equationInput.trim()) canvasActions.addEquation(equationInput, 0, 0); setEquationInput(""); setShowEquationDialog(false) }} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:opacity-90">Add</button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {showShortcuts && (
        <ModalOverlay onClose={() => setShowShortcuts(false)}>
          <div className="w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="p-1 text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-1">
              {[...KEYBOARD_SHORTCUTS,
                { key: "W / Up Arrow", action: "Pan up" },
                { key: "A / Left Arrow", action: "Pan left" },
                { key: "S / Down Arrow", action: "Pan down" },
                { key: "D / Right Arrow", action: "Pan right" },
              ].map((s) => (
                <div key={s.key} className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-sm text-foreground/80">{s.action}</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground font-mono">{s.key}</kbd>
                </div>
              ))}
            </div>
          </div>
        </ModalOverlay>
      )}

      <ConfirmDialog
        open={confirmDelete} title="Delete Board"
        message="Are you sure you want to delete this board? This cannot be undone."
        confirmLabel="Delete" destructive
        onConfirm={() => { if (board) deleteBoardFromStore(board.id); setConfirmDelete(false); onBack() }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}

// ============================================================================
// More Menu (overflow for Export, Shortcuts, Frames, Delete)
// ============================================================================

function MoreMenu({
  onClose, onExportPNG, onExportSVG, onExportPDF, onExportJSON, onImportJSON,
  onShortcuts, onDelete, onFrames, showFrames,
}: {
  onClose: () => void; onExportPNG: () => void; onExportSVG: () => void
  onExportPDF: () => void; onExportJSON: () => void; onImportJSON: () => void
  onShortcuts: () => void; onDelete?: () => void; onFrames: () => void; showFrames: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  return (
    <div ref={ref} className="absolute top-full right-0 mt-2 w-48 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
      <div className="p-1">
        <button className="wb-menu-item" onClick={onFrames}><LayoutGrid className="h-4 w-4" />{showFrames ? "Hide Frames" : "Show Frames"}</button>
        <button className="wb-menu-item" onClick={onShortcuts}><Keyboard className="h-4 w-4" />Shortcuts</button>
        <div className="h-px bg-border my-1" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground px-3 py-1 block select-none">Export</span>
        <button className="wb-menu-item" onClick={onExportPNG}><FileImage className="h-4 w-4" />PNG</button>
        <button className="wb-menu-item" onClick={onExportSVG}><FileImage className="h-4 w-4" />SVG</button>
        <button className="wb-menu-item" onClick={onExportPDF}><FileText className="h-4 w-4" />PDF</button>
        <button className="wb-menu-item" onClick={onExportJSON}><FileJson className="h-4 w-4" />Save JSON</button>
        <button className="wb-menu-item" onClick={onImportJSON}><Upload className="h-4 w-4" />Load JSON</button>
        {onDelete && (
          <>
            <div className="h-px bg-border my-1" />
            <button className="wb-menu-item text-destructive hover:!bg-destructive/10" onClick={onDelete}><Trash2 className="h-4 w-4" />Delete Board</button>
          </>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Shared Components
// ============================================================================

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150" onClick={onClose}>
      <div className="mx-4 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl animate-in zoom-in-95 duration-150" onClick={(e) => e.stopPropagation()}>
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
