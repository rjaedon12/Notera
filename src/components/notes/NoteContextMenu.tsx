"use client"

import { useRef, useEffect } from "react"
import {
  Star,
  Copy,
  Trash2,
  Link2,
  FilePlus,
  ArchiveRestore,
} from "lucide-react"

export interface ContextMenuAction {
  label: string
  icon: React.ReactNode
  action: () => void
  variant?: "default" | "danger"
}

interface NoteContextMenuProps {
  isOpen: boolean
  x: number
  y: number
  onClose: () => void
  actions: ContextMenuAction[]
}

export function NoteContextMenu({ isOpen, x, y, onClose, actions }: NoteContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleEscape)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className="fixed rounded-lg border py-1 z-[100] min-w-[180px]"
      style={{
        left: x,
        top: y,
        background: "var(--popover)",
        borderColor: "var(--border)",
        boxShadow:
          "rgba(15,15,15,0.05) 0 0 0 1px, rgba(15,15,15,0.1) 0 3px 6px, rgba(15,15,15,0.2) 0 9px 24px",
      }}
    >
      {actions.map((item) => (
        <button
          key={item.label}
          onClick={() => {
            item.action()
            onClose()
          }}
          className="flex w-full items-center gap-2.5 px-3 py-1.5 text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          style={{
            color: item.variant === "danger" ? "var(--destructive)" : "var(--foreground)",
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  )
}

// Helper to build common actions for sidebar items
export function buildPageContextActions({
  pageId,
  isFavorite,
  isArchived,
  onFavorite,
  onDuplicate,
  onAddSubpage,
  onCopyLink,
  onArchive,
  onRestore,
  onDelete,
}: {
  pageId: string
  isFavorite: boolean
  isArchived: boolean
  onFavorite: () => void
  onDuplicate: () => void
  onAddSubpage: () => void
  onCopyLink: () => void
  onArchive: () => void
  onRestore?: () => void
  onDelete?: () => void
}): ContextMenuAction[] {
  if (isArchived) {
    return [
      ...(onRestore
        ? [
            {
              label: "Restore",
              icon: <ArchiveRestore className="h-4 w-4" />,
              action: onRestore,
            },
          ]
        : []),
      ...(onDelete
        ? [
            {
              label: "Delete permanently",
              icon: <Trash2 className="h-4 w-4" />,
              action: onDelete,
              variant: "danger" as const,
            },
          ]
        : []),
    ]
  }

  return [
    {
      label: isFavorite ? "Remove from favorites" : "Add to favorites",
      icon: <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />,
      action: onFavorite,
    },
    {
      label: "Duplicate",
      icon: <Copy className="h-4 w-4" />,
      action: onDuplicate,
    },
    {
      label: "Add subpage",
      icon: <FilePlus className="h-4 w-4" />,
      action: onAddSubpage,
    },
    {
      label: "Copy link",
      icon: <Link2 className="h-4 w-4" />,
      action: onCopyLink,
    },
    {
      label: "Archive",
      icon: <Trash2 className="h-4 w-4" />,
      action: onArchive,
      variant: "danger",
    },
  ]
}
