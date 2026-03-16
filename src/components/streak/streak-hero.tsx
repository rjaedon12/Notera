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

  // Loading state - glass shimmer
  if (sessionStatus === "loading" || isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center py-8 mb-8 rounded-2xl backdrop-blur-[24px]"
        style={{
          background: "var(--glass-fill)",
          border: "1px solid var(--glass-border)",
          boxShadow: "var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)",
        }}
      >
        <div className="relative mb-4">
          <div className="absolute inset-0 rounded-full blur-xl scale-150" style={{ background: "rgba(247,150,50,0.15)" }} />
          <Flame className="h-16 w-16 relative z-10 text-orange-400/50 animate-pulse" strokeWidth={1.5} />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-orange-400 mb-2" />
        <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading streak...</div>
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
    <div
      className="flex flex-col items-center justify-center py-8 mb-8 rounded-2xl backdrop-blur-[24px]"
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)",
      }}
    >
      {/* Flame Icon with hue-rotate breathing */}
      <div className="relative mb-4">
        <div className="absolute inset-0 rounded-full blur-xl scale-150" style={{ background: "rgba(247,150,50,0.2)" }} />
        <Flame 
          className={cn(
            "h-16 w-16 relative z-10 flame-breathe",
            studiedToday 
              ? "text-orange-500 fill-orange-400" 
              : "text-orange-300 dark:text-orange-600"
          )} 
          strokeWidth={1.5}
        />
      </div>
      
      {/* Streak Count with count-up animation */}
      <div className="text-5xl font-bold text-foreground mb-1 animate-count-up font-heading">
        {currentStreak}
      </div>
      
      {/* Label */}
      <div className="text-lg font-medium mb-6" style={{ color: "var(--primary)" }}>
        {currentStreak === 0 ? "Start your streak!" : "day streak"}
      </div>
      
      {/* Weekly Progress - glass day pills */}
      <div className="flex gap-2 mb-4">
        {weekStatus.map((status, index) => (
          <div key={index} className="flex flex-col items-center gap-1.5">
            <span className={cn(
              "text-xs font-medium",
              status.isToday 
                ? "text-[var(--primary)]" 
                : "text-[var(--muted-foreground)]"
            )} style={{ fontSize: "0.7rem" }}>
              {status.day}
            </span>
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all backdrop-blur-sm",
              )}
              style={{
                background: status.studied
                  ? "var(--primary)"
                  : status.isToday
                    ? "color-mix(in srgb, var(--primary) 22%, transparent)"
                    : status.isFuture
                      ? "var(--glass-fill)"
                      : "var(--muted)",
                border: status.studied
                  ? "none"
                  : status.isToday
                    ? "2px solid var(--primary)"
                    : "1px solid var(--glass-border)",
                color: status.studied ? "#fff" : "var(--muted-foreground)",
              }}
            >
              {status.studied && (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Motivational Message */}
      {studiedToday && (
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          You extended your streak with over{' '}
          <span className="font-medium" style={{ color: "var(--primary)" }}>
            {Math.max(1, 24 - new Date().getHours())} hours
          </span>{' '}
          left in the day. Nice work!
        </p>
      )}
      {!studiedToday && currentStreak > 0 && (
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Study today to keep your {currentStreak} day streak going!
        </p>
      )}
      {!studiedToday && currentStreak === 0 && (
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Study any set to start building your streak!
        </p>
      )}
    </div>
  )
}
