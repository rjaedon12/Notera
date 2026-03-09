"use client"

import { useState, useCallback, useRef, use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useDBQPrompt, useDBQEssays, useSubmitDBQEssay } from "@/hooks/useDBQ"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Send,
  Highlighter,
  Eraser,
  ChevronDown,
  ChevronUp,
  Clock,
  ScrollText,
  FileText,
  ChevronRight,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

// ─── Highlight Types ─────────────────────────────────────

interface Highlight {
  id: string
  docId: string
  text: string
  color: string
  startOffset: number
  endOffset: number
  parentSelector: string
}

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef08a", border: "#eab308" },
  { name: "Green", value: "#bbf7d0", border: "#22c55e" },
  { name: "Blue", value: "#bfdbfe", border: "#3b82f6" },
  { name: "Pink", value: "#fbcfe8", border: "#ec4899" },
  { name: "Orange", value: "#fed7aa", border: "#f97316" },
]

export default function DBQWritePage({
  params,
}: {
  params: Promise<{ promptId: string }>
}) {
  const { promptId } = use(params)
  const { status } = useSession()
  const router = useRouter()

  const { data: prompt, isLoading } = useDBQPrompt(promptId)
  const { data: essays } = useDBQEssays(promptId)
  const submitEssay = useSubmitDBQEssay()

  const [essayContent, setEssayContent] = useState("")
  const [highlights, setHighlights] = useState<Highlight[]>([])
  const [activeColor, setActiveColor] = useState(HIGHLIGHT_COLORS[0].value)
  const [highlightMode, setHighlightMode] = useState(false)
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const docPanelRef = useRef<HTMLDivElement>(null)

  const wordCount = essayContent
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const toggleDoc = (docId: string) => {
    setExpandedDocs((prev) => {
      const next = new Set(prev)
      if (next.has(docId)) next.delete(docId)
      else next.add(docId)
      return next
    })
  }

  const expandAll = () => {
    if (prompt?.documents) {
      setExpandedDocs(new Set(prompt.documents.map((d) => d.id)))
    }
  }

  const collapseAll = () => {
    setExpandedDocs(new Set())
  }

  // ─── Highlight handling ──────────────────────────────────

  const handleTextSelect = useCallback(
    (docId: string) => {
      if (!highlightMode) return

      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.rangeCount) return

      const range = selection.getRangeAt(0)
      const text = selection.toString().trim()
      if (!text) return

      // Get start/end offsets relative to the document content container
      const container = document.querySelector(`[data-doc-id="${docId}"]`)
      if (!container || !container.contains(range.startContainer)) return

      const newHighlight: Highlight = {
        id: crypto.randomUUID(),
        docId,
        text,
        color: activeColor,
        startOffset: getTextOffset(container, range.startContainer, range.startOffset),
        endOffset: getTextOffset(container, range.endContainer, range.endOffset),
        parentSelector: `[data-doc-id="${docId}"]`,
      }

      setHighlights((prev) => [...prev, newHighlight])
      selection.removeAllRanges()
    },
    [highlightMode, activeColor]
  )

  const removeHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id))
  }

  const clearAllHighlights = () => {
    setHighlights([])
  }

  // ─── Submit ──────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!essayContent.trim()) {
      toast.error("Please write your essay before submitting.")
      return
    }

    try {
      const result = await submitEssay.mutateAsync({
        promptId,
        content: essayContent,
        highlights: highlights.map((h) => ({
          docId: h.docId,
          text: h.text,
          color: h.color,
          startOffset: h.startOffset,
          endOffset: h.endOffset,
        })),
      })
      toast.success("Essay submitted successfully!")
      setShowConfirm(false)
      router.push(`/dbq/${promptId}/essays/${result.id}`)
    } catch {
      toast.error("Failed to submit essay. Please try again.")
    }
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--muted-foreground)]">Loading DBQ...</div>
      </div>
    )
  }

  if (!prompt) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Prompt not found</h2>
          <Link href="/dbq">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to DBQs
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Full-screen layout */}
      <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--background)" }}>
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-4 h-12 flex-shrink-0"
          style={{
            borderBottom: "1px solid var(--glass-border)",
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-3">
            <Link href="/dbq" className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="text-sm font-medium truncate max-w-[300px]">
              {prompt.title}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "var(--glass-fill)",
                border: "1px solid var(--glass-border)",
                color: "var(--muted-foreground)",
              }}
            >
              {prompt.era}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Past essays button */}
            {essays && essays.length > 0 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: showHistory ? "var(--primary)" : "var(--glass-fill)",
                  color: showHistory ? "white" : "var(--muted-foreground)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                <Clock className="h-3.5 w-3.5" />
                {essays.length} past {essays.length === 1 ? "essay" : "essays"}
              </button>
            )}

            <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
              {wordCount} {wordCount === 1 ? "word" : "words"}
            </span>
            <Button
              size="sm"
              onClick={() => setShowConfirm(true)}
              disabled={!essayContent.trim() || submitEssay.isPending}
              className="gap-1.5 h-8"
            >
              <Send className="h-3.5 w-3.5" />
              Submit
            </Button>
          </div>
        </header>

        {/* Main split pane */}
        <div className="flex-1 flex overflow-hidden">
          {/* ─── Left: Document Panel ─── */}
          <div
            ref={docPanelRef}
            className="w-1/2 overflow-y-auto"
            style={{
              borderRight: "1px solid var(--glass-border)",
            }}
          >
            {/* Highlight toolbar */}
            <div
              className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2"
              style={{
                background: "var(--glass-bg)",
                backdropFilter: "blur(20px)",
                borderBottom: "1px solid var(--glass-border)",
              }}
            >
              <button
                onClick={() => setHighlightMode(!highlightMode)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                )}
                style={{
                  background: highlightMode ? activeColor : "var(--glass-fill)",
                  border: `1px solid ${highlightMode ? HIGHLIGHT_COLORS.find(c => c.value === activeColor)?.border ?? "var(--glass-border)" : "var(--glass-border)"}`,
                  color: highlightMode ? "#1a1a1a" : "var(--muted-foreground)",
                }}
              >
                <Highlighter className="h-3.5 w-3.5" />
                {highlightMode ? "Highlighting" : "Highlight"}
              </button>

              {highlightMode && (
                <div className="flex items-center gap-1">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setActiveColor(color.value)}
                      className={cn(
                        "w-5 h-5 rounded-full transition-all",
                        activeColor === color.value
                          ? "ring-2 ring-offset-1 scale-110"
                          : "hover:scale-105"
                      )}
                      style={{
                        background: color.value,
                        border: `2px solid ${color.border}`,
                        // ring color set via Tailwind ring utility
                        ["--tw-ring-color" as string]: color.border,
                      }}
                      title={color.name}
                    />
                  ))}
                </div>
              )}

              {highlights.length > 0 && (
                <button
                  onClick={clearAllHighlights}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                  style={{
                    background: "var(--glass-fill)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <Eraser className="h-3 w-3" />
                  Clear ({highlights.length})
                </button>
              )}

              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={expandAll}
                  className="px-2 py-1 rounded text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Expand all
                </button>
                <span className="text-[var(--glass-border)]">|</span>
                <button
                  onClick={collapseAll}
                  className="px-2 py-1 rounded text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  Collapse all
                </button>
              </div>
            </div>

            {/* Documents */}
            <div className="p-4 space-y-3">
              {prompt.documents.map((doc) => {
                const isExpanded = expandedDocs.has(doc.id)
                const docHighlights = highlights.filter((h) => h.docId === doc.id)

                return (
                  <div
                    key={doc.id}
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: "var(--glass-bg)",
                      border: "1px solid var(--glass-border)",
                    }}
                  >
                    {/* Doc header — always visible */}
                    <button
                      onClick={() => toggleDoc(doc.id)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--glass-fill)] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
                          style={{
                            background: "var(--primary)",
                            color: "white",
                          }}
                        >
                          {doc.docNumber}
                        </span>
                        <span className="text-sm font-semibold">{doc.title}</span>
                        {docHighlights.length > 0 && (
                          <span className="flex items-center gap-0.5">
                            {docHighlights.slice(0, 3).map((h) => (
                              <span
                                key={h.id}
                                className="w-2 h-2 rounded-full"
                                style={{ background: h.color }}
                              />
                            ))}
                            {docHighlights.length > 3 && (
                              <span className="text-xs text-[var(--muted-foreground)]">
                                +{docHighlights.length - 3}
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
                      )}
                    </button>

                    {/* Doc content — collapsible */}
                    {isExpanded && (
                      <div className="px-4 pb-4">
                        <p
                          className="text-xs mb-3 leading-relaxed"
                          style={{ color: "var(--muted-foreground)" }}
                        >
                          <span className="font-semibold">Source: </span>
                          {doc.source}
                        </p>

                        {/* Image if present */}
                        {doc.imageUrl && (
                          <div className="mb-3 rounded-lg overflow-hidden" style={{ border: "1px solid var(--glass-border)" }}>
                            <Image
                              src={doc.imageUrl}
                              alt={doc.imageAlt || doc.title}
                              width={600}
                              height={420}
                              className="w-full h-auto"
                              style={{ maxHeight: "400px", objectFit: "contain", background: "white" }}
                            />
                          </div>
                        )}

                        {/* Document text content with highlight support */}
                        <div
                          data-doc-id={doc.id}
                          onMouseUp={() => handleTextSelect(doc.id)}
                          className={cn(
                            "text-sm leading-relaxed whitespace-pre-wrap select-text",
                            highlightMode && "cursor-crosshair"
                          )}
                          style={{ color: "var(--foreground)" }}
                        >
                          <HighlightedText
                            text={doc.content}
                            highlights={docHighlights}
                            onRemoveHighlight={removeHighlight}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── Right: Essay Panel ─── */}
          <div className="w-1/2 flex flex-col overflow-hidden">
            {/* Question prompt - sticky at top */}
            <div
              className="flex-shrink-0 px-6 py-4"
              style={{
                background: "var(--glass-bg)",
                borderBottom: "1px solid var(--glass-border)",
                backdropFilter: "blur(20px)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                  style={{
                    background: "var(--primary)",
                    color: "white",
                  }}
                >
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                    Prompt
                  </h3>
                  <p className="text-sm font-medium leading-relaxed">
                    {prompt.question}
                  </p>
                </div>
              </div>
            </div>

            {/* Essay textarea */}
            <div className="flex-1 relative">
              <textarea
                value={essayContent}
                onChange={(e) => setEssayContent(e.target.value)}
                placeholder="Begin writing your essay here..."
                className="w-full h-full resize-none p-6 text-sm leading-relaxed focus:outline-none"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-body), 'DM Sans', sans-serif",
                }}
                spellCheck
              />
            </div>
          </div>
        </div>
      </div>

      {/* History slide-over panel */}
      {showHistory && essays && essays.length > 0 && (
        <div className="fixed inset-0 z-[60]" onClick={() => setShowHistory(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute right-0 top-12 bottom-0 w-80 overflow-y-auto"
            style={{
              background: "var(--glass-bg)",
              borderLeft: "1px solid var(--glass-border)",
              backdropFilter: "blur(40px)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Past Essays</h3>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {essays.map((essay) => (
                <Link
                  key={essay.id}
                  href={`/dbq/${promptId}/essays/${essay.id}`}
                  className="block rounded-lg p-3 hover:bg-[var(--glass-fill)] transition-colors"
                  style={{ border: "1px solid var(--glass-border)" }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {new Date(essay.submittedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-xs text-[var(--muted-foreground)]">
                      {essay.wordCount} words
                    </span>
                  </div>
                  <p className="text-xs line-clamp-2 text-[var(--muted-foreground)]">
                    {essay.content.slice(0, 100)}...
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: "var(--primary)" }}>
                    View <ChevronRight className="h-3 w-3" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Submit confirmation dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center"
          onClick={() => setShowConfirm(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4"
            style={{
              background: "var(--glass-bg)",
              border: "1px solid var(--glass-border)",
              backdropFilter: "blur(40px)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <div
                className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center"
                style={{ background: "var(--primary)", color: "white" }}
              >
                <Send className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">Submit Essay?</h3>
              <p className="text-sm text-[var(--muted-foreground)]">
                Your essay ({wordCount} words) will be saved. You can view it
                later or write a new attempt.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={submitEssay.isPending}
              >
                {submitEssay.isPending ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Utility: compute text offset within container ───────

function getTextOffset(container: Node, node: Node, offset: number): number {
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  let totalOffset = 0

  while (walker.nextNode()) {
    if (walker.currentNode === node) {
      return totalOffset + offset
    }
    totalOffset += (walker.currentNode.textContent?.length ?? 0)
  }

  return totalOffset + offset
}

// ─── Highlighted Text Component ──────────────────────────

function HighlightedText({
  text,
  highlights,
  onRemoveHighlight,
}: {
  text: string
  highlights: Highlight[]
  onRemoveHighlight?: (id: string) => void
}) {
  if (!highlights.length) return <>{text}</>

  // Sort highlights by startOffset
  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset)

  const parts: React.ReactNode[] = []
  let lastIndex = 0

  for (const h of sorted) {
    // Skip overlapping or out-of-range highlights
    if (h.startOffset < lastIndex || h.startOffset >= text.length) continue
    const end = Math.min(h.endOffset, text.length)

    // Text before this highlight
    if (h.startOffset > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`}>{text.slice(lastIndex, h.startOffset)}</span>
      )
    }

    // The highlighted text
    parts.push(
      <mark
        key={h.id}
        className="rounded-sm px-0 cursor-pointer transition-opacity hover:opacity-70 group/mark relative"
        style={{
          background: h.color,
          color: "#1a1a1a",
        }}
        onClick={(e) => {
          e.stopPropagation()
          onRemoveHighlight?.(h.id)
        }}
        title="Click to remove highlight"
      >
        {text.slice(h.startOffset, end)}
      </mark>
    )

    lastIndex = end
  }

  // Remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>)
  }

  return <>{parts}</>
}
