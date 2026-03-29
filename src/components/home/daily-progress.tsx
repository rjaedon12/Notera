"use client"

import { useAnalytics } from "@/hooks/useStudy"
import { useSession } from "next-auth/react"
import { BarChart3 } from "lucide-react"
import Link from "next/link"

export function DailyProgress() {
  const { data: session } = useSession()
  const { data: analytics } = useAnalytics()

  if (!session?.user || !analytics) return null

  const { totalStudySessions, cardsMastered, cardsLearning, cardsNew, averageQuizScore } = analytics
  const totalCards = cardsMastered + cardsLearning + cardsNew
  const masteryPct = totalCards > 0 ? Math.round((cardsMastered / totalCards) * 100) : 0

  return (
    <Link
      href="/analytics"
      className="rounded-2xl px-4 py-3 flex items-center gap-4 transition-all hover:scale-[1.01] animate-fade-in"
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
      }}
    >
      {/* Progress ring */}
      <div className="relative h-11 w-11 flex-shrink-0">
        <svg className="h-11 w-11 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18" cy="18" r="15.5"
            fill="none"
            stroke="var(--muted)"
            strokeWidth="3"
          />
          <circle
            cx="18" cy="18" r="15.5"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${masteryPct} ${100 - masteryPct}`}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
          style={{ color: "var(--primary)" }}
        >
          {masteryPct}%
        </span>
      </div>

      {/* Stats */}
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <BarChart3 className="h-3.5 w-3.5" style={{ color: "var(--primary)" }} />
          <span className="text-xs font-semibold text-foreground font-heading">Progress</span>
        </div>
        <div className="flex gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
          <span><strong className="text-foreground">{cardsMastered}</strong> mastered</span>
          <span><strong className="text-foreground">{totalStudySessions}</strong> sessions</span>
          {averageQuizScore > 0 && (
            <span><strong className="text-foreground">{Math.round(averageQuizScore)}%</strong> avg quiz</span>
          )}
        </div>
      </div>
    </Link>
  )
}
