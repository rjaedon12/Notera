"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { BarChart3, ArrowRight } from "lucide-react"
import Link from "next/link"

interface SnapshotData {
  totalStudySessions: number
  cardsMastered: number
  studyActivity: { date: string; count: number; minutesPracticed: number }[]
  currentStreak: number
  retentionRate: number
}

export function ActivitySnapshot() {
  const { data: session } = useSession()

  const { data, isLoading } = useQuery<SnapshotData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: !!session,
    staleTime: 2 * 60 * 1000,
  })

  if (isLoading || !data) return null

  // Last 7 days for sparkline
  const last7 = data.studyActivity.slice(-7)
  const max = Math.max(1, ...last7.map((d) => d.minutesPracticed))

  const todayMins = last7[last7.length - 1]?.minutesPracticed ?? 0
  const weekMins = last7.reduce((s, d) => s + d.minutesPracticed, 0)

  return (
    <Link
      href="/analytics"
      className="block rounded-xl border p-4 transition-all glass-card-hover"
      style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" style={{ color: "var(--primary)" }} />
          <span className="text-sm font-semibold text-foreground">Weekly Activity</span>
        </div>
        <span className="text-xs flex items-center gap-1" style={{ color: "var(--primary)" }}>
          Details <ArrowRight className="h-3 w-3" />
        </span>
      </div>

      {/* Sparkline + stats */}
      <div className="flex items-end gap-4">
        {/* Mini bar sparkline */}
        <div className="flex items-end gap-[3px] h-10 flex-1">
          {last7.map((d, i) => {
            const h = Math.max(3, (d.minutesPracticed / max) * 100)
            const isToday = i === last7.length - 1
            return (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${h}%`,
                  background: d.minutesPracticed > 0
                    ? isToday
                      ? "var(--primary)"
                      : "color-mix(in srgb, var(--primary) 50%, transparent)"
                    : "var(--muted)",
                }}
              />
            )
          })}
        </div>

        {/* Quick stats */}
        <div className="flex gap-4 shrink-0">
          <div className="text-right">
            <p className="text-lg font-bold text-foreground leading-none">{todayMins}m</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>today</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-foreground leading-none">{weekMins}m</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>this week</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
