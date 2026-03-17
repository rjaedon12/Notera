"use client"

import { Card } from "@/components/ui/card"
import { ChevronDown, Lightbulb, BookMarked } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { LatexRenderer } from "./LatexRenderer"

interface TheoremCardProps {
  title: string
  content: string
  keyTakeaway?: string
  type?: "theorem" | "postulate" | "corollary"
}

export function TheoremCard({ title, content, keyTakeaway, type = "theorem" }: TheoremCardProps) {
  const [expanded, setExpanded] = useState(true)

  const accentColors = {
    theorem: "var(--accent-color)",
    postulate: "#10b981",
    corollary: "#8b5cf6",
  }
  const accent = accentColors[type]
  const label = type.charAt(0).toUpperCase() + type.slice(1)

  return (
    <Card className="overflow-hidden">
      <div
        className="px-1 py-0"
        style={{ borderLeft: `4px solid ${accent}` }}
      >
        {/* Header */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-3 w-full p-4 pb-2 text-left"
        >
          <BookMarked className="h-5 w-5 shrink-0" style={{ color: accent }} />
          <div className="flex-1 min-w-0">
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: accent }}
            >
              {label}
            </span>
            <h3 className="text-base font-semibold font-heading leading-snug mt-0.5">
              {title}
            </h3>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              expanded && "rotate-180"
            )}
            style={{ color: "var(--muted-foreground)" }}
          />
        </button>

        {/* Body */}
        {expanded && (
          <div className="px-4 pb-4 space-y-3">
            <div className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              <LatexRenderer content={content} />
            </div>

            {keyTakeaway && (
              <div
                className="flex items-start gap-2 rounded-xl p-3 text-sm"
                style={{
                  background: `color-mix(in srgb, ${accent} 8%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${accent} 15%, transparent)`,
                }}
              >
                <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" style={{ color: accent }} />
                <span style={{ color: "var(--foreground)" }}>{keyTakeaway}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
