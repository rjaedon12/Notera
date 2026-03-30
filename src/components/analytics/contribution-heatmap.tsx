"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface DayData {
  date: string
  count: number
}

export function ContributionHeatmap() {
  const { data: session } = useSession()
  const [monthOffset, setMonthOffset] = useState(0) // 0 = current month, -1 = last month, etc.

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

  const activityMap = useMemo(() => {
    const map = new Map<string, number>()
    let max = 0
    for (const d of activity) {
      map.set(d.date, d.count)
      if (d.count > max) max = d.count
    }
    return { map, maxCount: max }
  }, [activity])

  // Compute the displayed month's calendar grid
  const { weeks, monthLabel, totalSessions, maxCount } = useMemo(() => {
    const now = new Date()
    const viewMonth = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const year = viewMonth.getFullYear()
    const month = viewMonth.getMonth()
    const label = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

    // First day of month & last day
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // Rewind to previous Sunday
    const start = new Date(firstDay)
    start.setDate(start.getDate() - start.getDay())

    // Go forward to next Saturday after lastDay
    const end = new Date(lastDay)
    end.setDate(end.getDate() + (6 - end.getDay()))

    const allWeeks: (DayData & { inMonth: boolean; isFuture: boolean })[][] = []
    let total = 0
    const cursor = new Date(start)

    while (cursor <= end) {
      const week: (DayData & { inMonth: boolean; isFuture: boolean })[] = []
      for (let dow = 0; dow < 7; dow++) {
        const dateStr = cursor.toISOString().split("T")[0]
        const count = activityMap.map.get(dateStr) ?? 0
        const inMonth = cursor.getMonth() === month
        if (inMonth) total += count
        week.push({
          date: dateStr,
          count,
          inMonth,
          isFuture: cursor > today,
        })
        cursor.setDate(cursor.getDate() + 1)
      }
      allWeeks.push(week)
    }

    return { weeks: allWeeks, monthLabel: label, totalSessions: total, maxCount: activityMap.maxCount }
  }, [activity, activityMap, monthOffset])

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

  const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const isCurrentMonth = monthOffset === 0

  return (
    <div>
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Study Activity</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonthOffset((o) => o - 1)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80"
            style={{ background: "var(--muted)" }}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          </button>
          <span
            className="text-sm font-medium min-w-[130px] text-center"
            style={{ color: "var(--foreground)" }}
          >
            {monthLabel}
          </span>
          <button
            onClick={() => setMonthOffset((o) => Math.min(o + 1, 0))}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:opacity-80 disabled:opacity-30"
            style={{ background: "var(--muted)" }}
            disabled={isCurrentMonth}
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {dayHeaders.map((d) => (
          <div
            key={d}
            className="text-[10px] font-medium text-center"
            style={{ color: "var(--muted-foreground)" }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex flex-col gap-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((day, di) => {
              const level = day.isFuture || !day.inMonth ? -1 : getIntensity(day.count)
              return (
                <div
                  key={di}
                  className="aspect-square rounded-md transition-colors relative"
                  style={{
                    background:
                      level === -1
                        ? "transparent"
                        : intensityBg(level),
                    opacity: day.inMonth ? 1 : 0.2,
                  }}
                  title={
                    day.inMonth && !day.isFuture
                      ? `${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`
                      : undefined
                  }
                >
                  {day.inMonth && (
                    <span
                      className="absolute inset-0 flex items-center justify-center text-[10px] font-medium"
                      style={{
                        color:
                          level >= 3
                            ? "#fff"
                            : "var(--muted-foreground)",
                      }}
                    >
                      {new Date(day.date + "T00:00:00").getDate()}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer: legend + session count */}
      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="w-[11px] h-[11px] rounded-[2px]"
              style={{ background: intensityBg(level) }}
            />
          ))}
          <span>More</span>
        </div>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
          {totalSessions} session{totalSessions !== 1 ? "s" : ""} this month
        </span>
      </div>
    </div>
  )
}
