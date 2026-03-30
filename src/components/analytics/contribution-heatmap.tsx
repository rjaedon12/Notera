"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useMemo } from "react"

interface DayData {
  date: string
  count: number
}

export function ContributionHeatmap() {
  const { data: session } = useSession()

  const { data: activity = [] } = useQuery<DayData[]>({
    queryKey: ["analytics-heatmap"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/heatmap")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: !!session,
    staleTime: 5 * 60 * 1000,
  })

  const { weeks, months, maxCount, totalSessions } = useMemo(() => {
    if (activity.length === 0) return { weeks: [], months: [], maxCount: 0, totalSessions: 0 }

    const map = new Map<string, number>()
    let max = 0
    let total = 0
    for (const d of activity) {
      map.set(d.date, d.count)
      if (d.count > max) max = d.count
      total += d.count
    }

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    // Go back ~52 weeks from today
    const start = new Date(today)
    start.setDate(start.getDate() - 364)
    // Rewind to previous Sunday
    start.setDate(start.getDate() - start.getDay())

    const allWeeks: (DayData | null)[][] = []
    const monthLabels: { label: string; col: number }[] = []
    let lastMonth = -1

    const cursor = new Date(start)
    while (cursor <= today) {
      const week: (DayData | null)[] = []
      for (let dow = 0; dow < 7; dow++) {
        const dateStr = cursor.toISOString().split("T")[0]
        if (cursor > today) {
          week.push(null)
        } else {
          week.push({ date: dateStr, count: map.get(dateStr) ?? 0 })
        }
        // Track month transitions on first day-of-week (Sunday)
        if (dow === 0 && cursor.getMonth() !== lastMonth && cursor <= today) {
          lastMonth = cursor.getMonth()
          monthLabels.push({
            label: cursor.toLocaleDateString("en-US", { month: "short" }),
            col: allWeeks.length,
          })
        }
        cursor.setDate(cursor.getDate() + 1)
      }
      allWeeks.push(week)
    }

    return { weeks: allWeeks, months: monthLabels, maxCount: max, totalSessions: total }
  }, [activity])

  const getIntensity = (count: number) => {
    if (count === 0) return 0
    if (maxCount <= 1) return 4
    const ratio = count / maxCount
    if (ratio <= 0.25) return 1
    if (ratio <= 0.5) return 2
    if (ratio <= 0.75) return 3
    return 4
  }

  const intensityBg = (level: number) =>
    level === 0
      ? "var(--muted)"
      : level === 1
        ? "color-mix(in srgb, var(--primary) 25%, transparent)"
        : level === 2
          ? "color-mix(in srgb, var(--primary) 50%, transparent)"
          : level === 3
            ? "color-mix(in srgb, var(--primary) 75%, transparent)"
            : "var(--primary)"

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""]
  const cellSize = 10
  const gap = 2
  const step = cellSize + gap
  const labelWidth = 28
  const gridWidth = weeks.length * step
  const gridHeight = 7 * step

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground">Study Activity</h2>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {totalSessions} session{totalSessions !== 1 ? "s" : ""} in the last year
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          width={labelWidth + gridWidth + 2}
          height={gridHeight + 20}
          className="block"
          style={{ minWidth: labelWidth + gridWidth + 2 }}
        >
          {/* Month labels */}
          {months.map((m, i) => (
            <text
              key={i}
              x={labelWidth + m.col * step}
              y={10}
              fontSize={10}
              fill="var(--muted-foreground)"
            >
              {m.label}
            </text>
          ))}

          {/* Day-of-week labels */}
          {dayLabels.map((label, i) =>
            label ? (
              <text
                key={i}
                x={0}
                y={18 + i * step + cellSize - 1}
                fontSize={9}
                fill="var(--muted-foreground)"
              >
                {label}
              </text>
            ) : null
          )}

          {/* Cells */}
          {weeks.map((week, wi) =>
            week.map((day, di) => {
              if (!day) return null
              const level = getIntensity(day.count)
              return (
                <rect
                  key={`${wi}-${di}`}
                  x={labelWidth + wi * step}
                  y={16 + di * step}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  fill={intensityBg(level)}
                >
                  <title>{`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}</title>
                </rect>
              )
            })
          )}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="rounded-[2px]"
            style={{
              width: cellSize,
              height: cellSize,
              background: intensityBg(level),
            }}
          />
        ))}
        <span>More</span>
      </div>
    </div>
  )
}
