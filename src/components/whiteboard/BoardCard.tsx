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
        className="w-full aspect-[16/10] rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-800 hover:border-blue-300 dark:hover:border-blue-500/40 transition-all hover:shadow-md"
      >
        {board.thumbnail ? (
          <img
            src={board.thumbnail}
            alt={board.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-zinc-400">
                <rect x="2" y="4" width="20" height="14" rx="2" />
                <path d="M7 9l2.5 2.5L14 8" />
              </svg>
            </div>
          </div>
        )}
      </button>

      {/* Info */}
      <div className="mt-2 px-1">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
            {board.title}
          </h3>

          {/* Menu */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-all"
            >
              <MoreHorizontal size={14} />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl z-20">
                  <button
                    onClick={() => { onDuplicate(board.id); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <Copy size={14} /> Duplicate
                  </button>
                  <button
                    onClick={() => { onDelete(board.id); setShowMenu(false) }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
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
