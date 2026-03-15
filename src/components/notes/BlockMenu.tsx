"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react-dom"
import { getSlashCommandItems, type SlashCommandItem } from "./extensions/SlashCommands"

interface BlockMenuProps {
  editor: ReturnType<typeof import("@tiptap/react").useEditor>
  isOpen: boolean
  onClose: () => void
  command: (item: SlashCommandItem) => void
}

export function BlockMenu({ editor, isOpen, onClose, command }: BlockMenuProps) {
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const items = useMemo(
    () =>
      getSlashCommandItems().filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  )

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: { category: string; items: SlashCommandItem[] }[] = []
    const seen = new Set<string>()
    for (const item of items) {
      if (!seen.has(item.category)) {
        seen.add(item.category)
        groups.push({ category: item.category, items: [] })
      }
      groups.find((g) => g.category === item.category)!.items.push(item)
    }
    return groups
  }, [items])

  // Flat list for keyboard navigation
  const flatItems = items

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: "bottom-start",
    middleware: [offset(8), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  // Reset state when menu opens
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [isOpen])

  const handleSelect = useCallback(
    (item: SlashCommandItem) => {
      command(item)
      onClose()
    },
    [command, onClose]
  )

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % flatItems.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + flatItems.length) % flatItems.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (flatItems[selectedIndex]) {
          handleSelect(flatItems[selectedIndex])
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, flatItems, selectedIndex, handleSelect, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (!menuRef.current) return
    const selected = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    selected?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  if (!isOpen || !editor) return null

  let flatIndex = 0

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="note-slash-menu z-50 w-80 max-h-[340px] overflow-y-auto rounded-xl py-1.5"
      role="listbox"
    >
      <div ref={menuRef}>
        {flatItems.length === 0 ? (
          <div className="px-4 py-6 text-sm text-center" style={{ color: "var(--muted-foreground)" }}>
            No results
          </div>
        ) : (
          groupedItems.map((group) => (
            <div key={group.category}>
              <div
                className="px-3 pt-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--muted-foreground)" }}
              >
                {group.category}
              </div>
              {group.items.map((item) => {
                const currentIndex = flatIndex++
                return (
                  <button
                    key={item.title}
                    data-index={currentIndex}
                    role="option"
                    aria-selected={currentIndex === selectedIndex}
                    className="flex w-full items-center gap-3 px-2.5 py-1.5 mx-1 rounded-lg text-left transition-colors"
                    style={{
                      background:
                        currentIndex === selectedIndex
                          ? "var(--muted)"
                          : "transparent",
                      color: "var(--foreground)",
                      width: "calc(100% - 8px)",
                    }}
                    onMouseEnter={() => setSelectedIndex(currentIndex)}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleSelect(item)
                    }}
                  >
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-base"
                      style={{
                        background: "var(--secondary)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{item.title}</div>
                      <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>
                        {item.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
