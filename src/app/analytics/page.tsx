"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  BarChart3, TrendingUp, Clock, Brain, BookOpen,
  Calendar, Target, Flame, Loader2
} from "lucide-react"

interface AnalyticsData {
  totalSets: number
  totalCards: number
  cardsMastered: number
  cardsLearning: number
  cardsNew: number
  currentStreak: number
  totalStudySessions: number
  quizzesTaken: number
  averageQuizScore: number
  studyActivity: { date: string; count: number; minutesPracticed: number }[]
  achievementsUnlocked: number
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const { data: analytics, isLoading, isError } = useQuery<AnalyticsData>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics")
      if (!res.ok) throw new Error("Failed to fetch analytics")
      return res.json()
    },
    enabled: !!session,
    retry: false,
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

  const totalProgressCards = (analytics?.cardsMastered ?? 0) + (analytics?.cardsLearning ?? 0) + (analytics?.cardsNew ?? 0)
  const masteredPct = totalProgressCards > 0 ? Math.round(((analytics?.cardsMastered ?? 0) / totalProgressCards) * 100) : 0
  const learningPct = totalProgressCards > 0 ? Math.round(((analytics?.cardsLearning ?? 0) / totalProgressCards) * 100) : 0
  const newPct = totalProgressCards > 0 ? Math.round(((analytics?.cardsNew ?? 0) / totalProgressCards) * 100) : 0

  const stats = [
    { label: "Study Sets", value: analytics?.totalSets ?? 0, icon: <BookOpen className="h-5 w-5" />, color: "#4F8EF7" },
    { label: "Cards Mastered", value: analytics?.cardsMastered ?? 0, icon: <Brain className="h-5 w-5" />, color: "#42d9a0" },
    { label: "Study Sessions", value: analytics?.totalStudySessions ?? 0, icon: <Clock className="h-5 w-5" />, color: "#a050dc" },
    { label: "Avg Quiz Score", value: `${analytics?.averageQuizScore ?? 0}%`, icon: <Target className="h-5 w-5" />, color: "#f59e0b" },
  ]

  // Calculate max values for the activity chart
  const activityData = analytics?.studyActivity ?? Array.from({ length: 30 }, () => ({ date: "", count: 0, minutesPracticed: 0 }))
  const maxMinutes = Math.max(1, ...activityData.map((d) => d.minutesPracticed ?? 0))
  // Y-axis tick values for time practiced
  const yTicks = (() => {
    if (maxMinutes <= 5) return [0, 1, 2, 3, 4, 5]
    if (maxMinutes <= 15) return [0, 5, 10, 15]
    if (maxMinutes <= 30) return [0, 10, 20, 30]
    if (maxMinutes <= 60) return [0, 15, 30, 45, 60]
    const step = Math.ceil(maxMinutes / 4 / 15) * 15
    return [0, step, step * 2, step * 3, step * 4].filter(v => v <= maxMinutes + step)
  })()
  const yMax = yTicks[yTicks.length - 1] || 1

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

      {/* Streak + Cards Progress */}
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
              <p className="text-2xl font-bold text-muted-foreground">{analytics?.quizzesTaken ?? 0}</p>
              <p className="text-sm text-muted-foreground">Quizzes taken</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border p-6" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-green-500" />
            <h2 className="text-lg font-semibold text-foreground">Cards Progress</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Mastered", value: analytics?.cardsMastered ?? 0, pct: masteredPct, color: "#42d9a0" },
              { label: "Learning", value: analytics?.cardsLearning ?? 0, pct: learningPct, color: "#f59e0b" },
              { label: "New", value: analytics?.cardsNew ?? 0, pct: newPct, color: "#4F8EF7" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className="text-sm font-semibold" style={{ color: item.color }}>
                    {item.value} ({item.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: "var(--muted)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.pct}%`, background: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 30-day Activity Chart with Y-axis */}
      <div className="rounded-xl border p-6" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Last 30 Days Activity</h2>
        </div>
        <div className="flex">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between h-36 pr-3 text-xs text-muted-foreground shrink-0 py-0.5" style={{ minWidth: "40px" }}>
            {[...yTicks].reverse().map((tick) => (
              <span key={tick} className="text-right leading-none">{tick}m</span>
            ))}
          </div>
          {/* Bars */}
          <div className="flex-1 flex items-end gap-[2px] h-36 border-l" style={{ borderColor: "var(--glass-border)" }}>
            {activityData.map((day, i) => {
              const mins = day.minutesPracticed ?? 0
              const height = Math.max(2, (mins / yMax) * 100)
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all hover:opacity-80 group relative"
                  style={{
                    height: `${height}%`,
                    background: mins > 0 ? "var(--primary)" : "var(--glass-border)",
                    opacity: mins > 0 ? 1 : 0.3,
                  }}
                  title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}, ${mins} min`}
                />
              )
            })}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground" style={{ paddingLeft: "52px" }}>
          <span>30 days ago</span>
          <span>Today</span>
        </div>
        <div className="mt-2 text-center">
          <span className="text-xs text-muted-foreground">Time Practiced (minutes)</span>
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
