"use client"

import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  BookOpen, Brain, Clock, Target, Flame, Loader2, Zap
} from "lucide-react"
import { StatCard } from "@/components/analytics/stat-card"
import { ActivityChart } from "@/components/analytics/activity-chart"
import { MasteryRing } from "@/components/analytics/mastery-ring"
import { ContributionHeatmap } from "@/components/analytics/contribution-heatmap"
import { QuizTrend } from "@/components/analytics/quiz-trend"
import { ModeBreakdown } from "@/components/analytics/mode-breakdown"
import { ReviewForecast } from "@/components/analytics/review-forecast"
import Link from "next/link"

interface AnalyticsData {
  totalSets: number
  totalCards: number
  cardsMastered: number
  cardsLearning: number
  cardsNew: number
  currentStreak: number
  longestStreak: number
  totalStudySessions: number
  quizzesTaken: number
  averageQuizScore: number
  studyActivity: { date: string; count: number; minutesPracticed: number }[]
  achievementsUnlocked: number
  quizScoreHistory: { date: string; score: number; bankName: string }[]
  studyModeBreakdown: Record<string, number>
  reviewForecast: { date: string; count: number }[]
  weeklyComparison: { thisWeek: number; lastWeek: number }
  topSets: { id: string; title: string; mastered: number; total: number }[]
  retentionRate: number
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

  const trend = analytics?.weeklyComparison

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground font-heading">Study Analytics</h1>
        <p className="text-muted-foreground mt-1">Track your learning progress and study habits</p>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Study Sets"
          value={analytics?.totalSets ?? 0}
          icon={<BookOpen className="h-5 w-5" />}
          color="#4F8EF7"
        />
        <StatCard
          label="Cards Mastered"
          value={analytics?.cardsMastered ?? 0}
          icon={<Brain className="h-5 w-5" />}
          color="#42d9a0"
          trend={trend}
        />
        <StatCard
          label="Study Sessions"
          value={analytics?.totalStudySessions ?? 0}
          icon={<Clock className="h-5 w-5" />}
          color="#a050dc"
          trend={trend}
        />
        <StatCard
          label="Avg Quiz Score"
          value={`${analytics?.averageQuizScore ?? 0}%`}
          icon={<Target className="h-5 w-5" />}
          color="#f59e0b"
        />
        <StatCard
          label="Retention Rate"
          value={`${analytics?.retentionRate ?? 0}%`}
          icon={<Zap className="h-5 w-5" />}
          color="#FB7185"
        />
      </div>

      {/* Streak + Heatmap */}
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
      >
        <div className="flex items-center gap-3 mb-5">
          <Flame className="h-6 w-6 text-orange-500" />
          <h2 className="text-lg font-semibold text-foreground">Study Streak</h2>
        </div>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex items-end gap-8">
            <div>
              <p className="text-4xl font-bold text-foreground">
                {analytics?.currentStreak ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Current streak</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">
                {analytics?.longestStreak ?? 0}
              </p>
              <p className="text-sm text-muted-foreground">Longest streak</p>
            </div>
          </div>
        </div>
        <ContributionHeatmap />
      </div>

      {/* Activity Chart */}
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
      >
        <ActivityChart data={analytics?.studyActivity ?? []} />
      </div>

      {/* Mastery Ring + Mode Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
        >
          <MasteryRing
            mastered={analytics?.cardsMastered ?? 0}
            learning={analytics?.cardsLearning ?? 0}
            newCards={analytics?.cardsNew ?? 0}
          />
        </div>
        <div
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
        >
          <ModeBreakdown breakdown={analytics?.studyModeBreakdown ?? {}} />
        </div>
      </div>

      {/* Quiz Performance */}
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
      >
        <QuizTrend
          history={analytics?.quizScoreHistory ?? []}
          average={analytics?.averageQuizScore ?? 0}
        />
      </div>

      {/* Review Forecast */}
      <div
        className="rounded-xl border p-6"
        style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
      >
        <ReviewForecast forecast={analytics?.reviewForecast ?? []} />
      </div>

      {/* Top Sets */}
      {(analytics?.topSets?.length ?? 0) > 0 && (
        <div
          className="rounded-xl border p-6"
          style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Top Sets by Mastery</h2>
          <div className="space-y-3">
            {analytics!.topSets.map((set) => {
              const pct = set.total > 0 ? Math.round((set.mastered / set.total) * 100) : 0
              return (
                <Link
                  key={set.id}
                  href={`/sets/${set.id}`}
                  className="flex items-center gap-4 group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {set.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--muted)" }}>
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: "#42d9a0" }}
                        />
                      </div>
                      <span className="text-xs font-medium shrink-0" style={{ color: "var(--muted-foreground)" }}>
                        {set.mastered}/{set.total}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-bold" style={{ color: "#42d9a0" }}>
                    {pct}%
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
