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

  const { weeks, months, maxCount } = useMemo(() => {
    if (activity.length === 0) return { weeks: [], months: [], maxCount: 0 }

    const map = new Map<string, number>()
    let max = 0
    for (const d of activity) {
      map.set(d.date, d.count)
      if (d.count > max) max = d.count
    }

    // Build week columns from first Sunday before start through today
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = new Date(activity[0].date + "T00:00:00")
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
        // Month label
        if (cursor.getMonth() !== lastMonth && cursor <= today) {
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

    return { weeks: allWeeks, months: monthLabels, maxCount: max }
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

  const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""]

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Study Activity</h2>
      <div className="overflow-x-auto">
        {/* Month labels */}
        <div className="flex text-xs mb-1" style={{ color: "var(--muted-foreground)", paddingLeft: "32px" }}>
          {months.map((m, i) => (
            <span
              key={i}
              className="absolute"
              style={{ left: `${32 + m.col * 14}px` }}
            >
              {m.label}
            </span>
          ))}
          {/* placeholder height */}
          <span className="invisible">Mon</span>
        </div>

        <div className="flex gap-0">
          {/* Day of week labels */}
          <div className="flex flex-col gap-[3px] mr-1.5 shrink-0">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="h-[11px] text-[10px] leading-[11px] flex items-center justify-end"
                style={{ color: "var(--muted-foreground)", width: "24px" }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => {
                  if (!day) {
                    return <div key={di} className="w-[11px] h-[11px]" />
                  }
                  const level = getIntensity(day.count)
                  return (
                    <div
                      key={di}
                      className="w-[11px] h-[11px] rounded-[2px] transition-colors"
                      style={{
                        background:
                          level === 0
                            ? "var(--muted)"
                            : level === 1
                              ? "color-mix(in srgb, var(--primary) 25%, transparent)"
                              : level === 2
                                ? "color-mix(in srgb, var(--primary) 50%, transparent)"
                                : level === 3
                                  ? "color-mix(in srgb, var(--primary) 75%, transparent)"
                                  : "var(--primary)",
                      }}
                      title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="w-[11px] h-[11px] rounded-[2px]"
              style={{
                background:
                  level === 0
                    ? "var(--muted)"
                    : level === 1
                      ? "color-mix(in srgb, var(--primary) 25%, transparent)"
                      : level === 2
                        ? "color-mix(in srgb, var(--primary) 50%, transparent)"
                        : level === 3
                          ? "color-mix(in srgb, var(--primary) 75%, transparent)"
                          : "var(--primary)",
              }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  )
}
