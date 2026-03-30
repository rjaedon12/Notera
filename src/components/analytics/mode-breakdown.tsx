"use client"

import { useEffect, useState } from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from "chart.js"
import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip)

interface ModeBreakdownProps {
  breakdown: Record<string, number>
}

const MODE_CONFIG: Record<string, { label: string; color: string }> = {
  FLASHCARD: { label: "Flashcards", color: "#4F8EF7" },
  QUIZ: { label: "Quizzes", color: "#a050dc" },
  MATCH: { label: "Match", color: "#42d9a0" },
  TIMED: { label: "Timed", color: "#f59e0b" },
  SIGHTREADING: { label: "Sightreading", color: "#FB7185" },
}

export function ModeBreakdown({ breakdown }: ModeBreakdownProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Filter out modes with no sessions
  const entries = Object.entries(breakdown)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)

  const total = entries.reduce((s, [, c]) => s + c, 0)

  const data = {
    labels: entries.map(([key]) => MODE_CONFIG[key]?.label ?? key),
    datasets: [
      {
        data: entries.map(([, count]) => count),
        backgroundColor: entries.map(([key]) => MODE_CONFIG[key]?.color ?? "#888"),
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    plugins: {
      tooltip: {
        callbacks: {
          label: (item: { label?: string; raw: unknown }) => {
            const val = item.raw as number
            const pct = total > 0 ? Math.round((val / total) * 100) : 0
            return ` ${item.label}: ${val} (${pct}%)`
          },
        },
      },
    },
  } as const

  if (!mounted) return null

  if (entries.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Study Modes</h2>
        <p className="text-sm text-muted-foreground py-8 text-center">
          Start studying to see your mode breakdown
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Study Modes</h2>
      <div className="flex items-center gap-6">
        <div className="relative w-36 h-36 shrink-0">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-foreground">{total}</span>
            <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>sessions</span>
          </div>
        </div>
        <div className="space-y-2 flex-1">
          {entries.map(([key, count]) => {
            const cfg = MODE_CONFIG[key] ?? { label: key, color: "#888" }
            return (
              <div key={key} className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cfg.color }} />
                <span className="text-sm text-foreground flex-1">{cfg.label}</span>
                <span className="text-sm font-medium" style={{ color: cfg.color }}>
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
