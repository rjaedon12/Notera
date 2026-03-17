"use client"

import { Card } from "@/components/ui/card"
import { StickyNote, MessageSquarePlus, Trash2, Highlighter, Palette } from "lucide-react"
import { useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { GuideHighlight, HighlightColor, GuideNote } from "@/types/studyguide"

// ---------------------------------------------------------------------------
// Highlight Color Picker
// ---------------------------------------------------------------------------

const highlightColors: { color: HighlightColor; bg: string; label: string }[] = [
  { color: "yellow", bg: "rgba(250, 204, 21, 0.35)", label: "Yellow" },
  { color: "green", bg: "rgba(74, 222, 128, 0.35)", label: "Green" },
  { color: "blue", bg: "rgba(96, 165, 250, 0.35)", label: "Blue" },
  { color: "pink", bg: "rgba(244, 114, 182, 0.35)", label: "Pink" },
  { color: "purple", bg: "rgba(167, 139, 250, 0.35)", label: "Purple" },
]

export function getHighlightBg(color: HighlightColor): string {
  return highlightColors.find((c) => c.color === color)?.bg ?? highlightColors[0].bg
}

// ---------------------------------------------------------------------------
// HighlightableText — wraps section text with selection→highlight support
// ---------------------------------------------------------------------------

interface HighlightableTextProps {
  sectionId: string
  children: React.ReactNode
  highlights: GuideHighlight[]
  onHighlight: (text: string, color: HighlightColor) => void
  onRemoveHighlight: (id: string) => void
}

export function HighlightableText({
  children,
  onHighlight,
}: HighlightableTextProps) {
  const [showPicker, setShowPicker] = useState(false)
  const [selectedText, setSelectedText] = useState("")
  const [pickerPos, setPickerPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (text && text.length > 1) {
      const range = sel?.getRangeAt(0)
      if (range) {
        const rect = range.getBoundingClientRect()
        const containerRect = containerRef.current?.getBoundingClientRect()
        if (containerRect) {
          setPickerPos({
            x: rect.left - containerRect.left + rect.width / 2,
            y: rect.top - containerRect.top - 8,
          })
          setSelectedText(text)
          setShowPicker(true)
        }
      }
    } else {
      setShowPicker(false)
    }
  }, [])

  const handleHighlight = (color: HighlightColor) => {
    if (selectedText) {
      onHighlight(selectedText, color)
      setShowPicker(false)
      setSelectedText("")
      window.getSelection()?.removeAllRanges()
    }
  }

  return (
    <div ref={containerRef} className="relative" onMouseUp={handleMouseUp}>
      {children}

      {/* Floating color picker */}
      {showPicker && (
        <div
          className="absolute z-50 flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 shadow-lg"
          style={{
            left: `${pickerPos.x}px`,
            top: `${pickerPos.y}px`,
            transform: "translate(-50%, -100%)",
            background: "var(--popover)",
            border: "1px solid var(--glass-border)",
            backdropFilter: "blur(20px)",
          }}
        >
          <Highlighter className="h-3.5 w-3.5 mr-0.5" style={{ color: "var(--muted-foreground)" }} />
          {highlightColors.map((c) => (
            <button
              key={c.color}
              onClick={() => handleHighlight(c.color)}
              className="w-5 h-5 rounded-full transition-transform hover:scale-125"
              style={{ background: c.bg, border: "2px solid transparent" }}
              title={c.label}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// NoteSidebar — per-section sticky notes
// ---------------------------------------------------------------------------

interface NoteSidebarProps {
  sectionId: string
  notes: GuideNote[]
  onAdd: (sectionId: string, text: string) => void
  onUpdate: (noteId: string, text: string) => void
  onDelete: (noteId: string) => void
}

export function NoteSidebar({ sectionId, notes, onAdd, onUpdate, onDelete }: NoteSidebarProps) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState("")

  const handleSave = () => {
    const trimmed = draft.trim()
    if (trimmed) {
      onAdd(sectionId, trimmed)
      setDraft("")
      setAdding(false)
    }
  }

  return (
    <div className="space-y-2">
      {/* Existing notes */}
      {notes.map((note) => (
        <NoteItem key={note.id} note={note} onUpdate={onUpdate} onDelete={onDelete} />
      ))}

      {/* Add note */}
      {adding ? (
        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write your note…"
            className="w-full rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
            style={{
              background: "var(--input)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground)",
            }}
            rows={3}
            autoFocus
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="text-xs font-medium px-3 py-1.5 rounded-lg glass-btn"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              Save
            </button>
            <button
              onClick={() => { setAdding(false); setDraft("") }}
              className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--glass-fill)]"
              style={{ color: "var(--muted-foreground)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors hover:bg-[var(--glass-fill)]"
          style={{ color: "var(--accent-color)" }}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          Add note
        </button>
      )}
    </div>
  )
}

function NoteItem({
  note,
  onUpdate,
  onDelete,
}: {
  note: GuideNote
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(note.text)

  const handleSave = () => {
    onUpdate(note.id, text)
    setEditing(false)
  }

  return (
    <div
      className="rounded-xl p-3 text-sm group"
      style={{
        background: "rgba(250, 204, 21, 0.06)",
        border: "1px solid rgba(250, 204, 21, 0.15)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <StickyNote className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: "#facc15" }} />
        {editing ? (
          <div className="flex-1 space-y-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              style={{ background: "var(--input)", border: "1px solid var(--glass-border)", color: "var(--foreground)" }}
              rows={2}
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={handleSave} className="text-xs font-medium" style={{ color: "var(--primary)" }}>Save</button>
              <button onClick={() => setEditing(false)} className="text-xs" style={{ color: "var(--muted-foreground)" }}>Cancel</button>
            </div>
          </div>
        ) : (
          <p
            className="flex-1 cursor-pointer"
            onClick={() => setEditing(true)}
            style={{ color: "var(--foreground)" }}
          >
            {note.text}
          </p>
        )}
        <button
          onClick={() => onDelete(note.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/10 rounded shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// HighlightsPanel — shows all highlights for the current guide
// ---------------------------------------------------------------------------

interface HighlightsPanelProps {
  highlights: GuideHighlight[]
  onRemove: (id: string) => void
}

export function HighlightsPanel({ highlights, onRemove }: HighlightsPanelProps) {
  if (highlights.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: "var(--muted-foreground)" }}>
        <Palette className="h-6 w-6 mx-auto mb-2 opacity-40" />
        Select text in the guide to highlight it.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {highlights.map((hl) => (
        <div
          key={hl.id}
          className="flex items-start gap-2 rounded-xl p-3 text-sm group"
          style={{ background: getHighlightBg(hl.color) }}
        >
          <p className="flex-1 line-clamp-3" style={{ color: "var(--foreground)" }}>
            &ldquo;{hl.text}&rdquo;
          </p>
          <button
            onClick={() => onRemove(hl.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded shrink-0"
          >
            <Trash2 className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      ))}
    </div>
  )
}
