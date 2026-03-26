"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import "katex/dist/katex.min.css"
import { BlockMath, InlineMath } from "react-katex"

interface VisualizerShellProps {
  title: string
  formula?: string
  description: string
  controls: React.ReactNode
  canvas: React.ReactNode
  difficulty: "high-school" | "college" | "both"
}

const difficultyConfig = {
  "high-school": { label: "High School", bg: "color-mix(in srgb, var(--accent-color) 12%, transparent)", text: "var(--accent-color)" },
  college: { label: "College", bg: "rgba(160,80,220,0.12)", text: "#a050dc" },
  both: { label: "HS + College", bg: "rgba(48,209,88,0.12)", text: "#30d158" },
}

export function VisualizerShell({
  title,
  formula,
  description,
  controls,
  canvas,
  difficulty,
}: VisualizerShellProps) {
  const diff = difficultyConfig[difficulty]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl font-bold font-heading tracking-tight" style={{ color: "var(--foreground)" }}>
          {title}
        </h1>
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full w-fit"
          style={{ background: diff.bg, color: diff.text }}
        >
          {diff.label}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Canvas area */}
        <div className="min-w-0">{canvas}</div>

        {/* Controls + info sidebar */}
        <div className="space-y-4">
          {/* Formula card */}
          {formula && (
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
                  Formula
                </p>
                <div className="overflow-x-auto" style={{ color: "var(--foreground)" }}>
                  <BlockMath math={formula} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Description */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "var(--muted-foreground)" }}>
                About
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--card-foreground)" }}>
                {description}
              </p>
            </CardContent>
          </Card>

          {/* Controls */}
          <Card>
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>
                Controls
              </p>
              <div className="space-y-3">{controls}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
