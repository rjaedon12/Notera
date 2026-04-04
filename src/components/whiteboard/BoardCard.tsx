"use client"

import { motion } from "framer-motion"
import { MoreHorizontal, Copy, Trash2, Users } from "lucide-react"
import { useState } from "react"
import type { BoardMeta } from "@/lib/whiteboard/types"

interface BoardCardProps {
  board: BoardMeta
  onOpen: (id: string) => void
  onDelete: (id: string) => void
  onDuplicate: (id: string) => void
}

export function BoardCard({ board, onOpen, onDelete, onDuplicate }: BoardCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  const timeAgo = getTimeAgo(new Date(board.updatedAt))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="group relative"
    >
      {/* Thumbnail */}
      <button
        onClick={() => onOpen(board.id)}
        className="w-full aspect-[16/10] rounded-2xl overflow-hidden transition-all duration-200 hover:shadow-lg"
        style={{
          background: "var(--glass-fill)",
          border: "1px solid var(--glass-border)",
        }}
      >
        {board.thumbnail ? (
          <img
            src={board.thumbnail}
            alt={board.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--glass-fill)" }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--muted-foreground)" }}>
                <rect x="2" y="4" width="20" height="14" rx="2" />
                <path d="M7 9l2.5 2.5L14 8" strokeWidth="1.7" />
              </svg>
            </div>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="mt-2.5 px-1">
        <div className="flex items-center justify-between">
          <h3
            className="text-sm font-medium truncate"
            style={{ color: "var(--foreground)" }}
          >
            {board.title}
          </h3>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--glass-fill)]"
              style={{ color: "var(--muted-foreground)" }}
            >
              <MoreHorizontal size={14} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div
                  className="absolute right-0 top-full mt-1 w-40 py-1.5 rounded-xl shadow-xl z-20 backdrop-blur-xl"
                  style={{
                    background: "var(--popover)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <button
                    onClick={() => { onDuplicate(board.id); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm transition-colors hover:bg-[var(--glass-fill)]"
                    style={{ color: "var(--foreground)" }}
                  >
                    <Copy size={14} /> Duplicate
                  </button>
                  <button
                    onClick={() => { onDelete(board.id); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
          <span>{timeAgo}</span>
          {board.memberCount > 1 && (
            <span className="flex items-center gap-0.5">
              <Users size={10} /> {board.memberCount}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
