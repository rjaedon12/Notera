"use client"

import { memo, useState, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChevronRight, MoreHorizontal, Plus, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NotePageNode } from "@/hooks/useNotePages"
import {
  useCreateNotePage,
  useUpdateNotePage,
  useDeleteNotePage,
} from "@/hooks/useNotePages"
import {
  NoteContextMenu,
  buildPageContextActions,
} from "./NoteContextMenu"

interface NotePageTreeProps {
  nodes: NotePageNode[]
  level?: number
  isTrash?: boolean
}

export const NotePageTree = memo(function NotePageTree({
  nodes,
  level = 0,
  isTrash = false,
}: NotePageTreeProps) {
  return (
    <div>
      {nodes.map((node) => (
        <NotePageTreeItem
          key={node.id}
          node={node}
          level={level}
          isTrash={isTrash}
        />
      ))}
    </div>
  )
})

const NotePageTreeItem = memo(function NotePageTreeItem({
  node,
  level,
  isTrash,
}: {
  node: NotePageNode
  level: number
  isTrash: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
  } | null>(null)

  const createPage = useCreateNotePage()
  const updatePage = useUpdateNotePage()
  const deletePage = useDeleteNotePage()

  const isActive = pathname === `/notes/${node.id}`
  const hasChildren = node.children.length > 0

  const handleClick = useCallback(() => {
    router.push(`/notes/${node.id}`)
  }, [router, node.id])

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setExpanded((prev) => !prev)
    },
    []
  )

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setContextMenu({ x: rect.right, y: rect.bottom })
  }, [])

  const handleAddSubpage = useCallback(async () => {
    const result = await createPage.mutateAsync({ parentId: node.id })
    setExpanded(true)
    router.push(`/notes/${result.id}`)
  }, [createPage, node.id, router])

  const actions = buildPageContextActions({
    pageId: node.id,
    isFavorite: node.isFavorite,
    isArchived: isTrash,
    onFavorite: () => {
      updatePage.mutate({
        pageId: node.id,
        isFavorite: !node.isFavorite,
      })
    },
    onDuplicate: async () => {
      await createPage.mutateAsync({
        title: `${node.title} (copy)`,
        parentId: node.parentId,
        icon: node.icon || undefined,
      })
    },
    onAddSubpage: handleAddSubpage,
    onCopyLink: () => {
      navigator.clipboard.writeText(`${window.location.origin}/notes/${node.id}`)
    },
    onArchive: () => {
      deletePage.mutate(node.id)
    },
    onRestore: isTrash
      ? () => {
          updatePage.mutate({ pageId: node.id, isArchived: false })
        }
      : undefined,
    onDelete: isTrash
      ? () => {
          deletePage.mutate(node.id)
        }
      : undefined,
  })

  return (
    <div>
      <div
        className={cn(
          "group flex items-center h-8 rounded-md cursor-pointer transition-colors text-sm",
          isActive
            ? "bg-black/[0.08] dark:bg-white/[0.08]"
            : "hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Chevron toggle */}
        <button
          onClick={handleToggle}
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-black/[0.08] dark:hover:bg-white/[0.08]",
            !hasChildren && "invisible"
          )}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 transition-transform",
              expanded && "rotate-90"
            )}
            style={{ color: "var(--muted-foreground)" }}
          />
        </button>

        {/* Icon */}
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-sm">
          {node.icon || <FileText className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />}
        </span>

        {/* Title */}
        <span
          className="ml-1.5 flex-1 truncate"
          style={{ color: isActive ? "var(--foreground)" : "var(--muted-foreground)" }}
        >
          {node.title || "Untitled"}
        </span>

        {/* Hover actions */}
        <div className="flex items-center gap-0.5 pr-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleMoreClick}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-black/[0.08] dark:hover:bg-white/[0.08]"
            title="More"
          >
            <MoreHorizontal className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
          </button>
          {!isTrash && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleAddSubpage()
              }}
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-black/[0.08] dark:hover:bg-white/[0.08]"
              title="Add subpage"
            >
              <Plus className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <NotePageTree nodes={node.children} level={level + 1} isTrash={isTrash} />
      )}

      {/* Context menu */}
      {contextMenu && (
        <NoteContextMenu
          isOpen={true}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          actions={actions}
        />
      )}
    </div>
  )
})
