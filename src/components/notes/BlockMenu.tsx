"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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

  const items = getSlashCommandItems().filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  )

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
        setSelectedIndex((i) => (i + 1) % items.length)
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + items.length) % items.length)
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (items[selectedIndex]) {
          handleSelect(items[selectedIndex])
        }
      } else if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, items, selectedIndex, handleSelect, onClose])

  // Scroll selected item into view
  useEffect(() => {
    if (!menuRef.current) return
    const selected = menuRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    selected?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  if (!isOpen || !editor) return null

  return (
    <div
      ref={refs.setFloating}
      style={floatingStyles}
      className="note-slash-menu z-50 w-72 max-h-80 overflow-y-auto rounded-lg py-2"
      role="listbox"
    >
      <div ref={menuRef}>
        {items.length === 0 ? (
          <div className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
            No results
          </div>
        ) : (
          items.map((item, index) => (
            <button
              key={item.title}
              data-index={index}
              role="option"
              aria-selected={index === selectedIndex}
              className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors"
              style={{
                background: index === selectedIndex ? "rgba(0,0,0,0.04)" : "transparent",
                color: "var(--foreground)",
              }}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => handleSelect(item)}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-sm"
                style={{
                  background: "rgba(55,53,47,0.04)",
                  border: "1px solid rgba(55,53,47,0.09)",
                }}
              >
                {item.icon}
              </span>
              <div>
                <div className="text-sm font-medium">{item.title}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {item.description}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
