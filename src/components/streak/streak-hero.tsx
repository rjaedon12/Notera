"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Flame, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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

  // Don't render for non-authenticated users
  if (sessionStatus === "unauthenticated") return null

  // Loading state — compact shimmer
  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="h-6 w-6 rounded-full glass-shimmer" />
        <div className="h-4 w-16 glass-shimmer rounded-lg" />
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="h-5 w-5 rounded-full glass-shimmer" />
          ))}
        </div>
      </div>
    )
  }

  // Use default values if no streak data (new user or error)
  const currentStreak = streakData?.currentStreak ?? 0
  const studiedToday = streakData?.studiedToday ?? false
  const longestStreak = streakData?.longestStreak ?? 0

  // Generate week data (Su - Sa)
  const today = new Date()
  const currentDayIndex = today.getDay() // 0 = Sunday
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
  
  // Build week status based on streak data
  const weekStatus = weekDays.map((day, index) => {
    const daysAgo = currentDayIndex - index
    if (daysAgo < 0) {
      return { day, studied: false, isToday: false, isFuture: true }
    }
    if (daysAgo === 0) {
      return { day, studied: studiedToday, isToday: true, isFuture: false }
    }
    const studied = daysAgo < currentStreak + (studiedToday ? 1 : 0)
    return { day, studied, isToday: false, isFuture: false }
  })

  return (
    <div className="flex items-center gap-4 py-2 animate-fade-in">
      {/* Flame + count + label */}
      <div className="flex items-center gap-2">
        <Flame 
          className={cn(
            "h-6 w-6 flame-breathe",
            studiedToday 
              ? "text-orange-500 fill-orange-400" 
              : "text-orange-300 dark:text-orange-600"
          )} 
          strokeWidth={1.5}
        />
        <span className="text-xl font-bold text-foreground font-heading">
          {currentStreak}
        </span>
        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
          {currentStreak === 0 ? "Start your streak" : "day streak"}
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px" style={{ background: "var(--border)" }} />

      {/* Weekly dots */}
      <div className="flex gap-1">
        {weekStatus.map((status, index) => (
          <div key={index} className="flex flex-col items-center gap-0.5">
            <span className={cn(
              "text-[9px] font-medium leading-none",
              status.isToday 
                ? "text-[var(--primary)]" 
                : "text-[var(--muted-foreground)]"
            )}>
              {status.day}
            </span>
            <div 
              className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
              style={{
                background: status.studied
                  ? "var(--primary)"
                  : status.isToday
                    ? "color-mix(in srgb, var(--primary) 15%, transparent)"
                    : "var(--muted)",
                border: status.studied
                  ? "none"
                  : status.isToday
                    ? "1.5px solid var(--primary)"
                    : "1px solid var(--border)",
                color: status.studied ? "#fff" : "var(--muted-foreground)",
              }}
            >
              {status.studied && (
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Compact motivational text */}
      <span className="text-xs hidden md:inline" style={{ color: "var(--muted-foreground)" }}>
        {studiedToday
          ? <>Streak extended — <span className="font-medium" style={{ color: "var(--primary)" }}>{Math.max(1, 24 - new Date().getHours())}h</span> left</>
          : currentStreak > 0
            ? `Study to keep your ${currentStreak} day streak`
            : "Study any set to start"}
      </span>
    </div>
  )
}
