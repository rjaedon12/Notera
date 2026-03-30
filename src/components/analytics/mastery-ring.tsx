"use client"

import { useEffect, useRef, useState } from "react"
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
} from "chart.js"
import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip)

interface MasteryRingProps {
  mastered: number
  learning: number
  newCards: number
}

const COLORS = {
  mastered: "#42d9a0",
  learning: "#f59e0b",
  new: "#4F8EF7",
}

export function MasteryRing({ mastered, learning, newCards }: MasteryRingProps) {
  const total = mastered + learning + newCards
  const containerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const data = {
    labels: ["Mastered", "Learning", "New"],
    datasets: [
      {
        data: total > 0 ? [mastered, learning, newCards] : [1],
        backgroundColor: total > 0 ? [COLORS.mastered, COLORS.learning, COLORS.new] : ["var(--muted)"],
        borderWidth: 0,
        hoverOffset: 4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "72%",
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

  return (
    <div ref={containerRef}>
      <h2 className="text-lg font-semibold text-foreground mb-4">Card Mastery</h2>
      <div className="flex items-center gap-6">
        <div className="relative w-40 h-40 shrink-0">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-foreground">{total}</span>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>cards</span>
          </div>
        </div>
        <div className="space-y-3 flex-1">
          {[
            { label: "Mastered", value: mastered, color: COLORS.mastered },
            { label: "Learning", value: learning, color: COLORS.learning },
            { label: "New", value: newCards, color: COLORS.new },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
              <div className="flex items-center justify-between flex-1">
                <span className="text-sm text-foreground">{item.label}</span>
                <span className="text-sm font-semibold" style={{ color: item.color }}>
                  {item.value}
                  {total > 0 && (
                    <span className="text-xs font-normal ml-1" style={{ color: "var(--muted-foreground)" }}>
                      ({Math.round((item.value / total) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
