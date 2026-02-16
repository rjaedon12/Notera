"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Flame } from "lucide-react"
import { cn } from "@/lib/utils"

interface StreakData {
  currentStreak: number
  longestStreak: number
  studiedToday: boolean
}

export function StreakIndicator() {
  const { data: session } = useSession()
  
  const { data: streakData } = useQuery<StreakData>({
    queryKey: ["streak"],
    queryFn: async () => {
      const res = await fetch("/api/streak")
      if (!res.ok) throw new Error("Failed to fetch streak")
      return res.json()
    },
    enabled: !!session?.user,
    refetchInterval: 60000 // Refresh every minute
  })

  if (!session?.user || !streakData) return null

  return (
    <div 
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-sm font-medium",
        streakData.studiedToday
          ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          : "bg-muted text-muted-foreground"
      )}
      title={`Current streak: ${streakData.currentStreak} days\nBest streak: ${streakData.longestStreak} days`}
    >
      <Flame 
        className={cn(
          "h-4 w-4",
          streakData.studiedToday && "text-orange-500"
        )} 
      />
      <span>{streakData.currentStreak}</span>
    </div>
  )
}
