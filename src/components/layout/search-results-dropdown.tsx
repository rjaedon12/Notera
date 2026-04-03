"use client"

import Link from "next/link"
import { BookOpen, HelpCircle, FileText, Layout, FolderOpen, Scroll } from "lucide-react"

export interface SearchResult {
  type: "set" | "quiz" | "dbq" | "note" | "whiteboard" | "resource"
  id: string
  title: string
  subtitle: string
  href: string
}

const typeConfig: Record<
  SearchResult["type"],
  { label: string; icon: typeof BookOpen; color: string }
> = {
  set: { label: "Sets", icon: BookOpen, color: "text-blue-500" },
  quiz: { label: "Practice Tests", icon: HelpCircle, color: "text-purple-500" },
  dbq: { label: "DBQs", icon: Scroll, color: "text-amber-500" },
  note: { label: "Notes", icon: FileText, color: "text-green-500" },
  whiteboard: { label: "Whiteboards", icon: Layout, color: "text-pink-500" },
  resource: { label: "Resources", icon: FolderOpen, color: "text-teal-500" },
}

interface Props {
  results: SearchResult[]
  isLoading: boolean
  onSelect: () => void
}

export function SearchResultsDropdown({ results, isLoading, onSelect }: Props) {
  if (isLoading) {
    return (
      <div
        className="absolute top-full left-0 right-0 mt-1.5 rounded-xl py-3 px-2 z-[100]"
        style={{
          background: "var(--popover)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
        }}
      >
        <div className="flex items-center justify-center py-4">
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ color: "var(--muted-foreground)" }} />
          <span className="ml-2 text-sm" style={{ color: "var(--muted-foreground)" }}>Searching…</span>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div
        className="absolute top-full left-0 right-0 mt-1.5 rounded-xl py-4 px-4 z-[100] text-center"
        style={{
          background: "var(--popover)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No results found</p>
      </div>
    )
  }

  // Group results by type
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = []
    acc[r.type].push(r)
    return acc
  }, {})

  const typeOrder: SearchResult["type"][] = ["set", "quiz", "dbq", "note", "whiteboard", "resource"]

  return (
    <div
      className="absolute top-full left-0 right-0 mt-1.5 rounded-xl py-1.5 z-[100] max-h-[60vh] overflow-y-auto"
      style={{
        background: "var(--popover)",
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
      }}
    >
      {typeOrder.map((type) => {
        const items = grouped[type]
        if (!items?.length) return null
        const config = typeConfig[type]
        const Icon = config.icon

        return (
          <div key={type}>
            <div className="px-3 pt-2.5 pb-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                {config.label}
              </p>
            </div>
            {items.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={onSelect}
                className="flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg transition-colors hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              >
                <Icon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                    {item.title}
                  </p>
                  {item.subtitle && (
                    <p className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )
      })}
    </div>
  )
}
