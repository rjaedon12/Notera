"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Plus, Star, Trash2, ChevronRight, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  useNotePages,
  useCreateNotePage,
  useUpdateNotePage,
  useDeleteNotePage,
  buildTree,
  type NotePageMeta,
} from "@/hooks/useNotePages"
import { NotePageTree } from "./NotePageTree"

interface NoteSidebarProps {
  isCollapsed: boolean
  onToggle: () => void
}

export function NoteSidebar({ isCollapsed, onToggle }: NoteSidebarProps) {
  const router = useRouter()
  const { data: pages = [], isLoading } = useNotePages()
  const createPage = useCreateNotePage()
  const [showTrash, setShowTrash] = useState(false)

  // Separate favorites and non-archived pages
  const favorites = useMemo(
    () => pages.filter((p) => p.isFavorite && !p.isArchived),
    [pages]
  )
  const tree = useMemo(
    () => buildTree(pages.filter((p) => !p.isArchived)),
    [pages]
  )
  const favoriteTree = useMemo(
    () => buildTree(favorites),
    [favorites]
  )

  // Fetch archived pages separately for trash
  const archivedPages = useMemo(
    () => pages.filter((p) => p.isArchived),
    [pages]
  )

  const handleNewPage = useCallback(async () => {
    const result = await createPage.mutateAsync({})
    router.push(`/notes/${result.id}`)
  }, [createPage, router])

  // Keyboard shortcut: Cmd+N for new page
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault()
        handleNewPage()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault()
        onToggle()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleNewPage, onToggle])

  if (isCollapsed) {
    return (
      <aside
        className="h-full w-0 overflow-hidden transition-all duration-300"
        style={{ background: "var(--notes-sidebar-bg, var(--sidebar-bg))" }}
      />
    )
  }

  return (
    <aside
      className="h-full w-[240px] shrink-0 flex flex-col border-r transition-all duration-300 overflow-hidden"
      style={{
        background: "var(--notes-sidebar-bg, var(--sidebar-bg))",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-11 shrink-0">
        <span className="text-sm font-semibold" style={{ color: "var(--muted-foreground)" }}>
          Notes
        </span>
        <button
          onClick={handleNewPage}
          className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          title="New page"
          disabled={createPage.isPending}
        >
          <Plus className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-1 pb-2">
        {isLoading ? (
          <div className="flex flex-col gap-1 px-2 pt-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-7 rounded-md animate-pulse"
                style={{ background: "var(--muted)", opacity: 0.5 }}
              />
            ))}
          </div>
        ) : (
          <>
            {/* Favorites section */}
            {favorites.length > 0 && (
              <div className="mb-3">
                <div
                  className="flex items-center gap-1 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <Star className="h-3 w-3" />
                  Favorites
                </div>
                <NotePageTree nodes={favoriteTree} />
              </div>
            )}

            {/* Main page tree */}
            <div className="mb-3">
              {favorites.length > 0 && (
                <div
                  className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Pages
                </div>
              )}
              {tree.length === 0 ? (
                <div
                  className="px-3 py-8 text-center text-sm"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>No pages yet</p>
                  <p className="text-xs mt-1">Click + to create one</p>
                </div>
              ) : (
                <NotePageTree nodes={tree} />
              )}
            </div>

            {/* Trash section */}
            <div className="border-t pt-2" style={{ borderColor: "var(--border)" }}>
              <button
                onClick={() => setShowTrash(!showTrash)}
                className="flex w-full items-center gap-2 px-3 py-1 text-sm rounded-md transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
                style={{ color: "var(--muted-foreground)" }}
              >
                <Trash2 className="h-4 w-4" />
                <span className="flex-1 text-left">Trash</span>
                <ChevronRight
                  className={cn(
                    "h-3 w-3 transition-transform",
                    showTrash && "rotate-90"
                  )}
                />
              </button>
              {showTrash && archivedPages.length > 0 && (
                <div className="mt-1">
                  <NotePageTree
                    nodes={buildTree(archivedPages as NotePageMeta[])}
                    isTrash
                  />
                </div>
              )}
              {showTrash && archivedPages.length === 0 && (
                <div
                  className="px-3 py-3 text-xs text-center"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Trash is empty
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Bottom: New page button */}
      <div className="shrink-0 border-t px-2 py-2" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={handleNewPage}
          disabled={createPage.isPending}
          className="flex w-full items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Plus className="h-4 w-4" />
          New page
        </button>
      </div>
    </aside>
  )
}
