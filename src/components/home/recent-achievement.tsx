"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { Trophy } from "lucide-react"
import Link from "next/link"

interface AchievementData {
  key: string
  title: string
  icon: string
  unlocked: boolean
  unlockedAt: string | null
}

export function RecentAchievement() {
  const { data: session } = useSession()

  const { data: achievements = [] } = useQuery<AchievementData[]>({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements")
      if (!res.ok) return []
      const json = await res.json()
      return Array.isArray(json) ? json : (json.achievements ?? [])
    },
    enabled: !!session?.user,
    staleTime: 60_000,
  })

  const unlocked = achievements
    .filter((a) => a.unlocked && a.unlockedAt)
    .sort((a, b) => new Date(b.unlockedAt!).getTime() - new Date(a.unlockedAt!).getTime())

  if (unlocked.length === 0) return null

  const latest = unlocked[0]

  return (
    <Link
      href="/achievements"
      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all hover:scale-[1.03] animate-fade-in"
      style={{
        background: "color-mix(in srgb, var(--primary) 10%, transparent)",
        border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
        color: "var(--primary)",
      }}
    >
      <Trophy className="h-3.5 w-3.5" />
      <span>{latest.icon}</span>
      <span>{latest.title}</span>
    </Link>
  )
}
