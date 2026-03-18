"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Search, Layout } from "lucide-react"
import { getBoards, createBoard, deleteBoard, duplicateBoard } from "@/lib/whiteboard/actions"
import { BoardCard } from "@/components/whiteboard/BoardCard"
import type { BoardMeta } from "@/lib/whiteboard/types"
import toast from "react-hot-toast"

export default function WhiteboardDashboard() {
  const router = useRouter()
  const [boards, setBoards] = useState<BoardMeta[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const loadBoards = async () => {
    try {
      const data = await getBoards()
      setBoards(data)
    } catch {
      toast.error("Failed to load boards")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadBoards() }, [])

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const boardId = await createBoard()
        router.push(`/whiteboard/${boardId}`)
      } catch {
        toast.error("Failed to create board")
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteBoard(id)
        setBoards((prev) => prev.filter((b) => b.id !== id))
        toast.success("Board deleted")
      } catch {
        toast.error("Failed to delete board")
      }
    })
  }

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      try {
        await duplicateBoard(id)
        await loadBoards()
        toast.success("Board duplicated")
      } catch {
        toast.error("Failed to duplicate board")
      }
    })
  }

  const filtered = boards.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-[calc(100vh-4rem)] px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Layout size={24} className="text-blue-500" />
            Whiteboard
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Collaborative boards for visual learning
          </p>
        </div>

        <button
          onClick={handleCreate}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
        >
          <Plus size={16} />
          New Board
        </button>
      </div>

      {/* Search */}
      {boards.length > 0 && (
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search boards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-sm pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/30 transition-all"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-zinc-400">Loading boards...</div>
        </div>
      )}

      {/* Empty state */}
      {!loading && boards.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-500">
              <rect x="2" y="4" width="20" height="14" rx="2" />
              <path d="M7 9l2.5 2.5L14 8" strokeWidth="1.7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200 mb-1">
            No boards yet
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 max-w-sm">
            Create your first whiteboard to start sketching, diagramming, and collaborating in real time.
          </p>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Plus size={16} />
            Create your first board
          </button>
        </motion.div>
      )}

      {/* Board grid */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* New board quick-create card */}
          <motion.button
            layout
            onClick={handleCreate}
            disabled={isPending}
            className="aspect-[16/10] rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-500/40 flex items-center justify-center transition-all hover:bg-blue-50/50 dark:hover:bg-blue-500/5 group"
          >
            <div className="flex flex-col items-center gap-2 text-zinc-400 group-hover:text-blue-500 transition-colors">
              <Plus size={24} />
              <span className="text-sm font-medium">New Board</span>
            </div>
          </motion.button>

          <AnimatePresence mode="popLayout">
            {filtered.map((board) => (
              <BoardCard
                key={board.id}
                board={board}
                onOpen={(id) => router.push(`/whiteboard/${id}`)}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* No search results */}
      {!loading && boards.length > 0 && filtered.length === 0 && search && (
        <div className="text-center py-12 text-zinc-400">
          No boards matching &ldquo;{search}&rdquo;
        </div>
      )}
    </div>
  )
}
