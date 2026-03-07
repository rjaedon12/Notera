"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  BarChart3, TrendingUp, Clock, Brain, BookOpen,
  Calendar, Target, Flame, Loader2
} from "lucide-react"

interface AnalyticsData {
  totalSetsStudied: number
  totalCardsReviewed: number
  totalStudyTime: number
  averageAccuracy: number
  currentStreak: number
  longestStreak: number
  last30Days: { date: string; cardsReviewed: number; minutesStudied: number }[]
  topSets: { setId: string; title: string; cardsReviewed: number }[]
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics")
      if (!res.ok) throw new Error("Failed to fetch analytics")
      return res.json()
    },
    enabled: !!session,
  })

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session) {
    router.push("/login")
    return null
  }

  const stats = [
    { label: "Sets Studied", value: analytics?.totalSetsStudied ?? 0, icon: <BookOpen className="h-5 w-5" />, color: "#4F8EF7" },
    { label: "Cards Reviewed", value: analytics?.totalCardsReviewed ?? 0, icon: <Brain className="h-5 w-5" />, color: "#42d9a0" },
    { label: "Study Minutes", value: analytics?.totalStudyTime ?? 0, icon: <Clock className="h-5 w-5" />, color: "#a050dc" },
    { label: "Accuracy", value: `${analytics?.averageAccuracy ?? 0}%`, icon: <Target className="h-5 w-5" />, color: "#f59e0b" },
  ]

  const maxCards = Math.max(1, ...(analytics?.last30Days?.map(d => d.cardsReviewed) ?? [1]))

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-heading">Study Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your learning progress and study habits</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-5"
            style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}20`, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border p-6" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
          <div className="flex items-center gap-3 mb-4">
            <Flame className="h-6 w-6 text-orange-500" />
            <h2 className="text-lg font-semibold text-foreground">Study Streak</h2>
          </div>
          <div className="flex items-end gap-8">
            <div>
              <p className="text-4xl font-bold text-foreground">{analytics?.currentStreak ?? 0}</p>
              <p className="text-sm text-muted-foreground">Current streak (days)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">{analytics?.longestStreak ?? 0}</p>
              <p className="text-sm text-muted-foreground">Longest streak</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">Top Sets</h2>
          </div>
          <div className="space-y-3">
            {(analytics?.topSets ?? []).slice(0, 3).map((set, i) => (
              <div key={set.setId} className="flex items-center justify-between">
                <span className="text-sm text-foreground truncate max-w-[200px]">
                  <span className="text-muted-foreground mr-2">#{i + 1}</span>
                  {set.title}
                </span>
                <span className="text-sm text-muted-foreground">{set.cardsReviewed} cards</span>
              </div>
            ))}
            {(!analytics?.topSets || analytics.topSets.length === 0) && (
              <p className="text-sm text-muted-foreground">Start studying to see your top sets!</p>
            )}
          </div>
        </div>
      </div>

      {/* 30-day Activity Chart */}
      <div className="rounded-xl border p-6" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Last 30 Days Activity</h2>
        </div>
        <div className="flex items-end gap-[2px] h-32">
          {(analytics?.last30Days ?? Array.from({ length: 30 }, () => ({ date: "", cardsReviewed: 0, minutesStudied: 0 }))).map((day, i) => {
            const height = Math.max(2, (day.cardsReviewed / maxCards) * 100)
            return (
              <div
                key={i}
                className="flex-1 rounded-t-sm transition-all hover:opacity-80 group relative"
                style={{
                  height: `${height}%`,
                  background: day.cardsReviewed > 0 ? "var(--primary)" : "var(--glass-border)",
                  opacity: day.cardsReviewed > 0 ? 1 : 0.3,
                }}
                title={`${day.date}: ${day.cardsReviewed} cards`}
              />
            )
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Calendar heatmap hint */}
      <div className="rounded-xl border p-6 text-center" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
        <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Keep studying daily to build your streak and improve retention!</p>
      </div>
    </div>
  )
}
