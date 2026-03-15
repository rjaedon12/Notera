"use client"

import { useState, useRef, useEffect } from "react"

const COVER_GRADIENTS = [
  "linear-gradient(135deg, #f5af19, #f12711)",
  "linear-gradient(135deg, #56ab2f, #a8e063)",
  "linear-gradient(135deg, #2980b9, #6dd5fa)",
  "linear-gradient(135deg, #8360c3, #2ebf91)",
  "linear-gradient(135deg, #f953c6, #b91d73)",
  "linear-gradient(135deg, #f7971e, #ffd200)",
  "linear-gradient(135deg, #00b4db, #0083b0)",
  "linear-gradient(135deg, #c94b4b, #4b134f)",
]

interface CoverImagePickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (value: string | null) => void
  currentCover: string | null
}

export function CoverImagePicker({
  isOpen,
  onClose,
  onSelect,
  currentCover,
}: CoverImagePickerProps) {
  const [urlInput, setUrlInput] = useState("")
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

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-80 rounded-lg border p-3 z-50"
      style={{
        background: "var(--popover)",
        borderColor: "var(--border)",
        boxShadow:
          "rgba(15,15,15,0.05) 0 0 0 1px, rgba(15,15,15,0.1) 0 3px 6px, rgba(15,15,15,0.2) 0 9px 24px",
      }}
    >
      <div className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>
        Gradients
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {COVER_GRADIENTS.map((gradient) => (
          <button
            key={gradient}
            onClick={() => {
              onSelect(gradient)
              onClose()
            }}
            className={`h-9 rounded-md transition-all hover:ring-2 hover:ring-[var(--primary)] ${currentCover === gradient ? "ring-2 ring-[var(--primary)]" : ""}`}
            style={{ background: gradient }}
          />
        ))}
      </div>

      <div className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>
        Link
      </div>
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="Paste image URL…"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="flex-1 h-8 rounded border bg-transparent px-2 text-sm outline-none"
          style={{ borderColor: "var(--border)" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && urlInput) {
              onSelect(urlInput)
              onClose()
            }
          }}
        />
        <button
          onClick={() => {
            if (urlInput) {
              onSelect(urlInput)
              onClose()
            }
          }}
          className="h-8 px-3 rounded text-xs font-medium"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Apply
        </button>
      </div>

      {currentCover && (
        <button
          onClick={() => {
            onSelect(null)
            onClose()
          }}
          className="mt-2 w-full text-center text-xs py-1.5 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          style={{ color: "var(--destructive)" }}
        >
          Remove cover
        </button>
      )}
    </div>
  )
}
