"use client"

import { ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"

export type SortOption = "recent" | "popular" | "rating" | "cards"

const SORT_LABELS: Record<SortOption, string> = {
  recent: "Recently Added",
  popular: "Most Popular",
  rating: "Highest Rated",
  cards: "Most Cards",
}

interface SortDropdownProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border"
        style={{
          background: "var(--glass-fill)",
          borderColor: "var(--glass-border)",
          color: "var(--foreground)",
        }}
      >
        {SORT_LABELS[value]}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 z-20 rounded-lg py-1 shadow-lg min-w-[160px]"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          {(Object.keys(SORT_LABELS) as SortOption[]).map(option => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option)
                setOpen(false)
              }}
              className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--glass-fill-hover)]"
              style={{
                color: option === value ? "var(--primary)" : "var(--foreground)",
                fontWeight: option === value ? 600 : 400,
              }}
            >
              {SORT_LABELS[option]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
