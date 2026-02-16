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
  
  const { data: streakData, isLoading, isError } = useQuery<StreakData>({
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

  // Loading state - show skeleton
  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 mb-8 bg-gradient-to-b from-orange-50 to-transparent dark:from-orange-950/20 dark:to-transparent rounded-2xl">
        <div className="relative mb-4">
          <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-xl scale-150" />
          <Flame className="h-16 w-16 relative z-10 text-orange-300 dark:text-orange-600 animate-pulse" strokeWidth={1.5} />
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-orange-400 mb-2" />
        <div className="text-sm text-muted-foreground">Loading streak...</div>
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
  // For simplicity, mark today if studiedToday, and previous days based on streak count
  const weekStatus = weekDays.map((day, index) => {
    const daysAgo = currentDayIndex - index
    if (daysAgo < 0) {
      // Future days
      return { day, studied: false, isToday: false, isFuture: true }
    }
    if (daysAgo === 0) {
      // Today
      return { day, studied: studiedToday, isToday: true, isFuture: false }
    }
    // Past days - check if within streak
    const studied = daysAgo < currentStreak + (studiedToday ? 1 : 0)
    return { day, studied, isToday: false, isFuture: false }
  })

  return (
    <div className="flex flex-col items-center justify-center py-8 mb-8 bg-gradient-to-b from-orange-50 to-transparent dark:from-orange-950/20 dark:to-transparent rounded-2xl">
      {/* Flame Icon */}
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-orange-400/20 rounded-full blur-xl scale-150" />
        <Flame 
          className={cn(
            "h-16 w-16 relative z-10",
            studiedToday 
              ? "text-orange-500 fill-orange-400" 
              : "text-orange-300 dark:text-orange-600"
          )} 
          strokeWidth={1.5}
        />
      </div>
      
      {/* Streak Count */}
      <div className="text-5xl font-bold text-foreground mb-1">
        {currentStreak}
      </div>
      
      {/* Label */}
      <div className="text-lg text-orange-600 dark:text-orange-400 font-medium mb-6">
        {currentStreak === 0 ? "Start your streak!" : "day streak"}
      </div>
      
      {/* Weekly Progress */}
      <div className="flex gap-1 mb-4">
        {weekStatus.map((status, index) => (
          <div key={index} className="flex flex-col items-center gap-1">
            <span className={cn(
              "text-xs font-medium",
              status.isToday 
                ? "text-orange-600 dark:text-orange-400" 
                : "text-muted-foreground"
            )}>
              {status.day}
            </span>
            <div 
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center transition-all",
                status.studied 
                  ? "bg-orange-500 text-white" 
                  : status.isFuture
                    ? "bg-muted/50"
                    : "bg-muted",
                status.isToday && !status.studied && "ring-2 ring-orange-400 ring-offset-2 ring-offset-background"
              )}
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
        <p className="text-sm text-muted-foreground">
          You extended your streak with over{' '}
          <span className="text-orange-600 dark:text-orange-400 font-medium">
            {Math.max(1, 24 - new Date().getHours())} hours
          </span>{' '}
          left in the day. Nice work!
        </p>
      )}
      {!studiedToday && currentStreak > 0 && (
        <p className="text-sm text-muted-foreground">
          Study today to keep your {currentStreak} day streak going!
        </p>
      )}
      {!studiedToday && currentStreak === 0 && (
        <p className="text-sm text-muted-foreground">
          Study any set to start building your streak!
        </p>
      )}
    </div>
  )
}
