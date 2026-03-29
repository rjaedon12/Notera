"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface StreakData {
  currentStreak: number
  longestStreak: number
  studiedToday: boolean
  weeklyStudyDays?: string[]
}

export function StreakHero() {
  const { data: session, status: sessionStatus } = useSession()
  
  const { data: streakData, isLoading } = useQuery<StreakData>({
    queryKey: ["streak"],
    queryFn: async () => {
      const res = await fetch("/api/streak")
      if (!res.ok) throw new Error("Failed to fetch streak")
      return res.json()
    },
    enabled: !!session?.user,
    refetchInterval: 60000
  })

  if (sessionStatus === "unauthenticated") return null

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div
        className="flex items-center gap-4 rounded-full px-5 py-3"
        style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}
      >
        <div className="h-5 w-5 rounded-full glass-shimmer" />
        <div className="h-4 w-20 glass-shimmer rounded" />
        <div className="flex gap-1.5">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-7 w-7 rounded-full glass-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  const currentStreak = streakData?.currentStreak ?? 0
  const studiedToday = streakData?.studiedToday ?? false

  const today = new Date()
  const currentDayIndex = today.getDay()
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  
  const weekStatus = weekDays.map((day, index) => {
    const daysAgo = currentDayIndex - index
    if (daysAgo < 0) return { day, studied: false, isToday: false, isFuture: true }
    if (daysAgo === 0) return { day, studied: studiedToday, isToday: true, isFuture: false }
    const studied = daysAgo < currentStreak + (studiedToday ? 1 : 0)
    return { day, studied, isToday: false, isFuture: false }
  })

  const hoursLeft = Math.max(1, 24 - today.getHours())

  return (
    <div
      className="flex items-center gap-4 rounded-full px-5 py-2.5 animate-fade-in flex-wrap"
      style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}
    >
      {/* Flame + streak count */}
      <div className="flex items-center gap-2">
        <Flame 
          className={cn(
            "h-5 w-5 flame-breathe",
            studiedToday 
              ? "text-orange-500 fill-orange-400" 
              : "text-orange-300 dark:text-orange-600"
          )} 
          strokeWidth={1.5}
        />
        <span className="text-sm font-semibold text-foreground">
          {currentStreak}
        </span>
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          day streak
        </span>
      </div>

      {/* Weekly dots */}
      <div className="flex gap-1.5">
        {weekStatus.map((status, index) => (
          <div
            key={index}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all"
            style={{
              background: status.studied
                ? "var(--primary)"
                : status.isToday
                  ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                  : "transparent",
              border: status.studied
                ? "none"
                : status.isToday
                  ? "2px solid var(--primary)"
                  : "1.5px solid var(--border)",
              color: status.studied
                ? "#fff"
                : status.isToday
                  ? "var(--primary)"
                  : "var(--muted-foreground)",
            }}
          >
            {status.studied ? (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              status.day
            )}
          </div>
        ))}
      </div>

      {/* Status text */}
      <Link
        href="/analytics"
        className="text-xs font-medium hover:underline ml-auto flex items-center gap-1"
        style={{ color: "var(--primary)" }}
      >
        {studiedToday
          ? `${hoursLeft}h left today`
          : currentStreak > 0
            ? "Study to keep streak"
            : "Start your streak"}
        <span className="text-xs">→</span>
      </Link>
    </div>
  )
}
