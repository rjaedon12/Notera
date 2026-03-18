"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Share2,
  MoreHorizontal,
  Download,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3x3,
  Image as ImageIcon,
  ImagePlus,
  FileDown,
  Upload,
} from "lucide-react"
import Link from "next/link"
import { PresenceAvatars } from "./PresenceAvatars"
import type { BackgroundType, Camera } from "@/lib/whiteboard/types"

interface TopBarProps {
  title: string
  onTitleChange: (title: string) => void
  onShare: () => void
  camera: Camera
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
  background: BackgroundType
  onBackgroundChange: (bg: BackgroundType) => void
  onExportPng: () => void
  onExportPdf: () => void
  onClear: () => void
  onImageUpload?: (dataUrl: string, width: number, height: number) => void
  collaborators?: { connectionId: number; presence: { userName: string; userColor: string; cursor: { x: number; y: number } | null } | null; info?: { name?: string; image?: string; color?: string } }[]
}

export function TopBar({
  title,
  onTitleChange,
  onShare,
  camera,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  background,
  onBackgroundChange,
  onExportPng,
  onExportPdf,
  onClear,
  onImageUpload,
  collaborators = [],
}: TopBarProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showBgPicker, setShowBgPicker] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const zoomPercent = Math.round(camera.zoom * 100)

  const backgrounds: { type: BackgroundType; label: string; icon: string }[] = [
    { type: "plain", label: "None", icon: "○" },
    { type: "dots", label: "Dots", icon: "⠿" },
    { type: "grid", label: "Grid", icon: "▦" },
    { type: "lined", label: "Lines", icon: "☰" },
  ]

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onImageUpload) return
    const reader = new FileReader()
    reader.onload = (loadEv) => {
      const dataUrl = loadEv.target?.result as string
      const img = new Image()
      img.onload = () => {
        let w = img.width
        let h = img.height
        const maxDim = 400
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h)
          w = w * scale
          h = h * scale
        }
        onImageUpload(dataUrl, w, h)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
    // Reset input so the same file can be uploaded again
    e.target.value = ""
  }

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 h-14 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50"
    >
      {/* Left: Back + Title */}
      <div className="flex items-center gap-3">
        <Link
          href="/whiteboard"
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Back to boards"
        >
          <ArrowLeft size={18} />
        </Link>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-sm font-medium bg-transparent border-none outline-none text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 w-48 focus:ring-1 focus:ring-blue-200 dark:focus:ring-blue-500/30 rounded px-2 py-1 -ml-2"
          placeholder="Untitled Board"
        />
      </div>

      {/* Center: Zoom controls */}
      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100/80 dark:bg-zinc-800/80">
        <button
          onClick={onZoomOut}
          className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          title="Zoom out (⌘-)"
        >
          <ZoomOut size={14} />
        </button>
        <button
          onClick={onResetZoom}
          className="px-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors min-w-[3rem] text-center"
          title="Reset zoom (⌘0)"
        >
          {zoomPercent}%
        </button>
        <button
          onClick={onZoomIn}
          className="p-1 rounded text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          title="Zoom in (⌘+)"
        >
          <ZoomIn size={14} />
        </button>
      </div>

      {/* Right: Upload + Collab avatars + Share + Menu */}
      <div className="flex items-center gap-2">
        {/* Image Upload button */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Upload Image (I)"
        >
          <Upload size={18} />
        </button>

        <PresenceAvatars collaborators={collaborators} />

        <button
          onClick={onShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
        >
          <Share2 size={14} />
          Share
        </button>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={() => { setShowMenu(!showMenu); setShowBgPicker(false) }}
            className="p-2 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="absolute right-0 top-full mt-2 w-56 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl z-20"
              >
                {/* Background picker inline */}
                <button
                  onClick={() => { setShowBgPicker(!showBgPicker); }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <Grid3x3 size={16} />
                  Background
                </button>
                {showBgPicker && (
                  <div className="px-3 py-2 grid grid-cols-4 gap-1.5">
                    {backgrounds.map((bg) => (
                      <button
                        key={bg.type}
                        onClick={() => { onBackgroundChange(bg.type); setShowBgPicker(false); setShowMenu(false) }}
                        className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors ${
                          background === bg.type
                            ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-500/30"
                            : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                        title={bg.label}
                      >
                        <span className="text-base leading-none">{bg.icon}</span>
                        <span className="text-[10px] leading-none">{bg.label}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                <button
                  onClick={() => { onExportPng(); setShowMenu(false) }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <ImageIcon size={16} />
                  Export PNG
                </button>
                <button
                  onClick={() => { onExportPdf(); setShowMenu(false) }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <FileDown size={16} />
                  Export PDF
                </button>
                <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                <button
                  onClick={() => { onClear(); setShowMenu(false) }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                  Clear board
                </button>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
