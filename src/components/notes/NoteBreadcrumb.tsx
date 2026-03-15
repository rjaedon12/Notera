"use client"

import { useMemo } from "react"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import type { NotePageMeta } from "@/hooks/useNotePages"

interface NoteBreadcrumbProps {
  pageId: string
  pages: NotePageMeta[]
}

export function NoteBreadcrumb({ pageId, pages }: NoteBreadcrumbProps) {
  const breadcrumbs = useMemo(() => {
    const crumbs: { id: string; title: string; icon: string | null }[] = []
    const pageMap = new Map(pages.map((p) => [p.id, p]))

    let current = pageMap.get(pageId)
    while (current) {
      crumbs.unshift({
        id: current.id,
        title: current.title || "Untitled",
        icon: current.icon,
      })
      current = current.parentId ? pageMap.get(current.parentId) : undefined
    }

    return crumbs
  }, [pageId, pages])

  if (breadcrumbs.length <= 1) return null

  return (
    <nav
      className="flex items-center gap-0.5 px-6 pt-3 pb-0 text-xs overflow-x-auto"
      style={{ color: "var(--muted-foreground)" }}
    >
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1
        return (
          <span key={crumb.id} className="flex items-center gap-0.5 shrink-0">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
            )}
            {isLast ? (
              <span className="truncate max-w-[160px]" style={{ color: "var(--foreground)" }}>
                {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
                {crumb.title}
              </span>
            ) : (
              <Link
                href={`/notes/${crumb.id}`}
                className="truncate max-w-[160px] hover:underline transition-colors"
              >
                {crumb.icon && <span className="mr-1">{crumb.icon}</span>}
                {crumb.title}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
