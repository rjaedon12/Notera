"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { Search, FileText, Plus } from "lucide-react"
import type { NotePageMeta } from "@/hooks/useNotePages"

interface PageLinkPickerProps {
  isOpen: boolean
  pages: NotePageMeta[]
  cursorRect: DOMRect | null
  onSelect: (page: NotePageMeta) => void
  onCreateSubpage: (title: string) => void
  onClose: () => void
}

export function PageLinkPicker({
  isOpen,
  pages,
  cursorRect,
  onSelect,
  onCreateSubpage,
  onClose,
}: PageLinkPickerProps) {
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredPages = useMemo(() => {
    if (!search) return pages.filter((p) => !p.isArchived)
    const q = search.toLowerCase()
    return pages
      .filter((p) => !p.isArchived && p.title.toLowerCase().includes(q))
  }, [pages, search])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSearch("")
      setSelectedIndex(0)
      // Delay focus to let the DOM render
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isOpen])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [isOpen, onClose])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      const totalItems = filteredPages.length + (search.trim() ? 1 : 0) // +1 for "Create subpage"
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % totalItems)
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + totalItems) % totalItems)
      }
      if (e.key === "Enter") {
        e.preventDefault()
        if (selectedIndex < filteredPages.length) {
          onSelect(filteredPages[selectedIndex])
        } else if (search.trim()) {
          onCreateSubpage(search.trim())
        }
        onClose()
      }
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, filteredPages, selectedIndex, search, onSelect, onCreateSubpage, onClose])

  // Reset index when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [search])

  if (!isOpen) return null

  const top = cursorRect ? cursorRect.bottom + 8 : 200
  const left = cursorRect ? cursorRect.left : 200

  return (
    <>
      <div className="page-link-picker-overlay" onClick={onClose} />
      <div
        ref={ref}
        className="fixed z-50 w-72 rounded-xl overflow-hidden"
        style={{
          top: Math.min(top, window.innerHeight - 350),
          left: Math.min(left, window.innerWidth - 300),
          background: "var(--popover)",
          border: "1px solid var(--border)",
          boxShadow: "0 10px 40px -8px rgba(0,0,0,.2), 0 4px 12px -4px rgba(0,0,0,.1)",
        }}
      >
        <div className="p-2.5 pb-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for a page…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 text-sm rounded-lg bg-transparent outline-none"
              style={{
                background: "var(--muted)",
                color: "var(--foreground)",
              }}
            />
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: "260px" }}>
          <div className="py-1">
            {filteredPages.length === 0 && !search.trim() && (
              <div className="px-4 py-6 text-center" style={{ color: "var(--muted-foreground)" }}>
                <FileText className="h-5 w-5 mx-auto mb-2 opacity-40" />
                <span className="text-sm">No pages found</span>
              </div>
            )}

            {/* Existing pages */}
            {filteredPages.map((page, i) => (
              <button
                key={page.id}
                className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors rounded-lg text-sm"
                style={{
                  background: i === selectedIndex ? "var(--accent)" : "transparent",
                  color: "var(--foreground)",
                  margin: "0 4px",
                  width: "calc(100% - 8px)",
                }}
                onMouseEnter={() => setSelectedIndex(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onSelect(page)
                  onClose()
                }}
              >
                <span className="text-base leading-none flex-shrink-0">
                  {page.icon || "📄"}
                </span>
                <span className="truncate">{page.title || "Untitled"}</span>
              </button>
            ))}

            {/* Create new subpage option */}
            {search.trim() && (
              <button
                className="flex items-center gap-2.5 w-full px-3 py-1.5 text-left transition-colors rounded-lg text-sm"
                style={{
                  background: selectedIndex === filteredPages.length ? "var(--accent)" : "transparent",
                  color: "#2383e2",
                  margin: "0 4px",
                  width: "calc(100% - 8px)",
                }}
                onMouseEnter={() => setSelectedIndex(filteredPages.length)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  onCreateSubpage(search.trim())
                  onClose()
                }}
              >
                <Plus className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  Create &ldquo;{search.trim()}&rdquo; subpage
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
