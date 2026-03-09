"use client"

import { use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { useDBQEssay } from "@/hooks/useDBQ"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  FileText,
  Clock,
  ScrollText,
  RotateCcw,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useState } from "react"

// ─── Highlight Type ──────────────────────────────────────

interface SavedHighlight {
  docId: string
  text: string
  color: string
  startOffset: number
  endOffset: number
}

export default function EssayReviewPage({
  params,
}: {
  params: Promise<{ promptId: string; essayId: string }>
}) {
  const { promptId, essayId } = use(params)
  const { status } = useSession()
  const router = useRouter()
  const { data: essay, isLoading } = useDBQEssay(essayId)
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set())

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
    if (essay?.prompt?.documents) {
      setExpandedDocs(new Set(essay.prompt.documents.map((d) => d.id)))
    }
  }

  const collapseAll = () => {
    setExpandedDocs(new Set())
  }

  // Parse saved highlights
  const savedHighlights: SavedHighlight[] = essay?.highlights
    ? (() => {
        try {
          return JSON.parse(essay.highlights!)
        } catch {
          return []
        }
      })()
    : []

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--muted-foreground)]">Loading essay...</div>
      </div>
    )
  }

  if (!essay || !essay.prompt) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-semibold">Essay not found</h2>
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
          <Link
            href="/dbq"
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="text-sm font-medium truncate max-w-[300px]">
            {essay.prompt.title}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
              color: "var(--muted-foreground)",
            }}
          >
            <ScrollText className="h-3 w-3" />
            Review
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
            <Clock className="h-3.5 w-3.5" />
            {new Date(essay.submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </div>
          <span className="text-xs text-[var(--muted-foreground)] tabular-nums">
            {essay.wordCount} words
          </span>
          <Link href={`/dbq/${promptId}`}>
            <Button size="sm" variant="outline" className="gap-1.5 h-8">
              <RotateCcw className="h-3.5 w-3.5" />
              New Attempt
            </Button>
          </Link>
        </div>
      </header>

      {/* Main split pane */}
      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left: Document Panel with highlights ─── */}
        <div
          className="w-1/2 overflow-y-auto"
          style={{ borderRight: "1px solid var(--glass-border)" }}
        >
          {/* Toolbar */}
          <div
            className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2"
            style={{
              background: "var(--glass-bg)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid var(--glass-border)",
            }}
          >
            <span className="text-xs font-medium text-[var(--muted-foreground)]">
              {essay.prompt.documents?.length ?? 0} Documents
            </span>
            {savedHighlights.length > 0 && (
              <span className="text-xs text-[var(--muted-foreground)] flex items-center gap-1 ml-2">
                •
                <span className="flex items-center gap-0.5 ml-1">
                  {Array.from(new Set(savedHighlights.map(h => h.color))).map((c, i) => (
                    <span key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
                  ))}
                </span>
                {savedHighlights.length} highlights
              </span>
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
            {essay.prompt.documents?.map((doc) => {
              const isExpanded = expandedDocs.has(doc.id)
              const docHighlights = savedHighlights.filter((h) => h.docId === doc.id)

              return (
                <div
                  key={doc.id}
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: "var(--glass-bg)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <button
                    onClick={() => toggleDoc(doc.id)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--glass-fill)] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold"
                        style={{ background: "var(--primary)", color: "white" }}
                      >
                        {doc.docNumber}
                      </span>
                      <span className="text-sm font-semibold">{doc.title}</span>
                      {docHighlights.length > 0 && (
                        <span className="flex items-center gap-0.5">
                          {docHighlights.slice(0, 3).map((h, i) => (
                            <span
                              key={i}
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

                  {isExpanded && (
                    <div className="px-4 pb-4">
                      <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                        <span className="font-semibold">Source: </span>
                        {doc.source}
                      </p>

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

                      <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--foreground)" }}>
                        <ReviewHighlightedText
                          text={doc.content}
                          highlights={docHighlights}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── Right: Essay (read-only) ─── */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          {/* Question prompt */}
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
                style={{ background: "var(--primary)", color: "white" }}
              >
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)] mb-1">
                  Prompt
                </h3>
                <p className="text-sm font-medium leading-relaxed">
                  {essay.prompt.question}
                </p>
              </div>
            </div>
          </div>

          {/* Essay content (read-only) */}
          <div className="flex-1 overflow-y-auto p-6">
            <div
              className="text-sm leading-relaxed whitespace-pre-wrap"
              style={{
                color: "var(--foreground)",
                fontFamily: "var(--font-body), 'DM Sans', sans-serif",
              }}
            >
              {essay.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Review Highlighted Text (read-only, no click to remove) ─

function ReviewHighlightedText({
  text,
  highlights,
}: {
  text: string
  highlights: SavedHighlight[]
}) {
  if (!highlights.length) return <>{text}</>

  const sorted = [...highlights].sort((a, b) => a.startOffset - b.startOffset)

  const parts: React.ReactNode[] = []
  let lastIndex = 0

  for (let i = 0; i < sorted.length; i++) {
    const h = sorted[i]
    if (h.startOffset < lastIndex || h.startOffset >= text.length) continue
    const end = Math.min(h.endOffset, text.length)

    if (h.startOffset > lastIndex) {
      parts.push(
        <span key={`t-${lastIndex}`}>{text.slice(lastIndex, h.startOffset)}</span>
      )
    }

    parts.push(
      <mark
        key={`h-${i}`}
        className="rounded-sm px-0"
        style={{ background: h.color, color: "#1a1a1a" }}
      >
        {text.slice(h.startOffset, end)}
      </mark>
    )

    lastIndex = end
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`t-${lastIndex}`}>{text.slice(lastIndex)}</span>)
  }

  return <>{parts}</>
}
