"use client"

import { cn } from "@/lib/utils"

interface GuideProgressBarProps {
  correct: number
  total: number
  label?: string
  size?: "sm" | "md"
}

export function GuideProgressBar({ correct, total, label, size = "md" }: GuideProgressBarProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const isComplete = total > 0 && correct === total

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            {label}
          </span>
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: isComplete ? "#10b981" : "var(--accent-color)" }}
          >
            {pct}%
          </span>
        </div>
      )}
      <div
        className={cn(
          "w-full rounded-full overflow-hidden",
          size === "sm" ? "h-1" : "h-2"
        )}
        style={{ background: "var(--muted)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: isComplete
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : "linear-gradient(90deg, var(--accent-color), var(--accent-light))",
          }}
        />
      </div>
    </div>
  )
}
