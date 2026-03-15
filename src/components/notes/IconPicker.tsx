"use client"

import { useState, useRef, useEffect, useMemo } from "react"

// Common emoji set for page icons (Notion-style categories)
const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: "Smileys",
    emojis: ["😀", "😊", "🥰", "😎", "🤓", "🧐", "😇", "🤩", "😴", "🤔", "😏", "😂"],
  },
  {
    name: "Objects",
    emojis: ["📝", "📒", "📓", "📕", "📗", "📘", "📙", "📚", "📖", "🗒️", "📋", "📎"],
  },
  {
    name: "Symbols",
    emojis: ["⭐", "🌟", "💡", "🔥", "✨", "💎", "🎯", "🏆", "🎨", "🎵", "💫", "🌈"],
  },
  {
    name: "Nature",
    emojis: ["🌸", "🌺", "🍀", "🌿", "🌻", "🌙", "☀️", "🌊", "🦋", "🐝", "🌴", "🍂"],
  },
  {
    name: "Food",
    emojis: ["🍎", "🍕", "🍰", "☕", "🧁", "🍩", "🍪", "🥑", "🍓", "🫐", "🍊", "🍋"],
  },
  {
    name: "Travel",
    emojis: ["🏠", "🏢", "🗺️", "✈️", "🚀", "🗼", "🏔️", "🏖️", "⛺", "🎢", "🚲", "⛵"],
  },
  {
    name: "Science",
    emojis: ["🔬", "🧪", "🧬", "💻", "🖥️", "📡", "🛸", "🧲", "⚡", "🔋", "💾", "📱"],
  },
]

interface IconPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (emoji: string | null) => void
  currentIcon: string | null
}

export function IconPicker({ isOpen, onClose, onSelect, currentIcon }: IconPickerProps) {
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)

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

  const filteredCategories = useMemo(() => {
    if (!search) return EMOJI_CATEGORIES
    return EMOJI_CATEGORIES.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter(() => true), // Emoji search would need a name mapping; keep all for now
    })).filter((cat) => cat.emojis.length > 0)
  }, [search])

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-2 w-72 rounded-lg border z-50"
      style={{
        background: "var(--popover)",
        borderColor: "var(--border)",
        boxShadow:
          "rgba(15,15,15,0.05) 0 0 0 1px, rgba(15,15,15,0.1) 0 3px 6px, rgba(15,15,15,0.2) 0 9px 24px",
      }}
    >
      <div className="p-2 border-b" style={{ borderColor: "var(--border)" }}>
        <input
          type="text"
          placeholder="Search emoji…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-7 rounded bg-transparent px-2 text-sm outline-none"
          style={{ background: "var(--muted)" }}
          autoFocus
        />
      </div>

      <div className="max-h-60 overflow-y-auto p-2">
        {filteredCategories.map((category) => (
          <div key={category.name} className="mb-2">
            <div
              className="text-[10px] font-semibold uppercase tracking-wider mb-1 px-1"
              style={{ color: "var(--muted-foreground)" }}
            >
              {category.name}
            </div>
            <div className="grid grid-cols-8 gap-0.5">
              {category.emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onSelect(emoji)
                    onClose()
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded text-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {currentIcon && (
        <div className="border-t p-2" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => {
              onSelect(null)
              onClose()
            }}
            className="w-full text-center text-xs py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: "var(--destructive)" }}
          >
            Remove icon
          </button>
        </div>
      )}
    </div>
  )
}
