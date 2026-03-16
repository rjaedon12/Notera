"use client"

import { useState, useCallback, useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from "react"
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from "@floating-ui/react-dom"
import { Search } from "lucide-react"
import { getSlashCommandItems, type SlashCommandItem } from "./extensions/SlashCommands"

// Text icons that should render as styled spans instead of emoji
const TEXT_ICONS = new Set(["H1", "H2", "H3", "1.", "</>"]) 

function BlockIcon({ icon }: { icon: string }) {
  if (TEXT_ICONS.has(icon)) {
    return <span className="font-mono font-bold text-xs leading-none">{icon}</span>
  }
  return <span className="text-base leading-none">{icon}</span>
}

export interface BlockMenuHandle {
  moveDown: () => void
  moveUp: () => void
  selectCurrent: () => void
}

interface BlockMenuProps {
  editor: ReturnType<typeof import("@tiptap/react").useEditor>
  isOpen: boolean
  cursorRect: DOMRect | null
  query: string
  onClose: () => void
  command: (item: SlashCommandItem) => void
}

export const BlockMenu = forwardRef<BlockMenuHandle, BlockMenuProps>(
  function BlockMenu({ editor, isOpen, cursorRect, query, onClose, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const items = useMemo(
    () =>
      getSlashCommandItems().filter((item) =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
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

  const flatItems = items

  // Virtual reference for floating-ui positioning
  const virtualRef = useMemo(() => ({
    getBoundingClientRect: () => cursorRect ?? new DOMRect(0, 0, 0, 0),
  }), [cursorRect])

  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    placement: "bottom-start",
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  })

  // Set virtual reference for cursor-anchored positioning
  useEffect(() => {
    refs.setReference(virtualRef)
  }, [virtualRef, refs])

  // Reset state when menu opens or query changes
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0)
    }
  }, [isOpen, query])

  const handleSelect = useCallback(
    (item: SlashCommandItem) => {
      command(item)
      onClose()
    },
    [command, onClose]
  )

  // Expose imperative methods so the parent (suggestion onKeyDown) can drive navigation
  // without a document-level keydown listener that races with ProseMirror.
  useImperativeHandle(ref, () => ({
    moveDown() {
      setSelectedIndex((i) => (i + 1) % flatItems.length)
    },
    moveUp() {
      setSelectedIndex((i) => (i - 1 + flatItems.length) % flatItems.length)
    },
    selectCurrent() {
      if (flatItems[selectedIndex]) {
        handleSelect(flatItems[selectedIndex])
      }
    },
  }), [flatItems, selectedIndex, handleSelect])

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
      style={{
        ...floatingStyles,
        background: "var(--popover)",
        border: "1px solid var(--border)",
        boxShadow: "0 10px 40px -8px rgba(0,0,0,.2), 0 4px 12px -4px rgba(0,0,0,.1)",
      }}
      className="note-slash-menu z-50 w-72 max-h-80 rounded-xl overflow-hidden"
      role="listbox"
    >
      {/* Filter display */}
      <div className="px-2.5 pt-2.5 pb-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
          <div
            className="w-full pl-7 pr-2 py-1.5 text-sm rounded-lg flex items-center"
            style={{
              background: "var(--muted)",
              color: query ? "var(--foreground)" : "var(--muted-foreground)",
              minHeight: "32px",
            }}
          >
            {query || "Type to filter\u2026"}
            {query && <span className="animate-pulse ml-px">|</span>}
          </div>
        </div>
      </div>

      {/* Items */}
      <div ref={menuRef} className="overflow-y-auto" style={{ maxHeight: "calc(20rem - 3.5rem)" }}>
        <div className="py-1">
          {flatItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-8" style={{ color: "var(--muted-foreground)" }}>
              <Search className="h-5 w-5 opacity-40" />
              <span className="text-sm">No blocks match</span>
            </div>
          ) : (
            groupedItems.map((group) => (
              <div key={group.category}>
                <div
                  className="text-[10px] font-semibold uppercase tracking-widest px-3 pt-3 pb-1"
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
                      className="flex items-center gap-3 px-2 py-1.5 text-left transition-colors rounded-lg"
                      style={{
                        background: currentIndex === selectedIndex ? "var(--accent)" : "transparent",
                        color: "var(--foreground)",
                        margin: "0 4px",
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
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: "var(--muted)" }}
                      >
                        <BlockIcon icon={item.icon} />
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
    </div>
  )
})
