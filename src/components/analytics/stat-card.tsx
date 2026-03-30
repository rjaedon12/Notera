"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  label: string
  value: number | string
  icon: ReactNode
  color: string
  trend?: { thisWeek: number; lastWeek: number }
}

export function StatCard({ label, value, icon, color, trend }: StatCardProps) {
  const [displayed, setDisplayed] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const numeric = typeof value === "number" ? value : null

  useEffect(() => {
    if (numeric === null || numeric === 0) return
    let start = 0
    const end = numeric
    const duration = 600
    const stepTime = 16
    const steps = Math.ceil(duration / stepTime)
    const inc = end / steps
    const id = setInterval(() => {
      start += inc
      if (start >= end) {
        setDisplayed(end)
        clearInterval(id)
      } else {
        setDisplayed(Math.floor(start))
      }
    }, stepTime)
    return () => clearInterval(id)
  }, [numeric])

  const trendDirection =
    trend && trend.lastWeek > 0
      ? trend.thisWeek >= trend.lastWeek
        ? "up"
        : "down"
      : trend && trend.thisWeek > 0
        ? "up"
        : null

  return (
    <div
      ref={ref}
      className="rounded-xl border p-5 animate-fade-in"
      style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20`, color }}
        >
          {icon}
        </div>
        {trendDirection && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trendDirection === "up" ? "text-green-500" : "text-red-400"}`}>
            {trendDirection === "up" ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            <span>
              {trend!.lastWeek > 0
                ? `${Math.round(((trend!.thisWeek - trend!.lastWeek) / trend!.lastWeek) * 100)}%`
                : "New"}
            </span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">
        {numeric !== null ? displayed : value}
      </p>
      <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
        {label}
      </p>
    </div>
  )
}
