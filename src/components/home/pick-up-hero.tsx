"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Star, ArrowRight } from "lucide-react"

interface RecentStudy {
  id: string
  setId: string
  set: {
    id: string
    title: string
    _count: { cards: number }
    category?: { name: string } | null
  }
  studiedAt: string
  mode: string
}

interface SetProgress {
  masteredCount: number
  totalCards: number
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function PickUpHero() {
  const { data: session } = useSession()

  const { data: recentStudies = [] } = useQuery<RecentStudy[]>({
    queryKey: ["recentStudies"],
    queryFn: async () => {
      const res = await fetch("/api/user/recent-studies")
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!session?.user,
  })

  const mostRecent = recentStudies[0]

  const { data: progress } = useQuery<SetProgress>({
    queryKey: ["setProgress", mostRecent?.setId],
    queryFn: async () => {
      const res = await fetch(`/api/progress?setId=${mostRecent.setId}`)
      if (!res.ok) return { masteredCount: 0, totalCards: 0 }
      const data = await res.json()
      // API returns array of progress records; pick the one matching this set
      if (Array.isArray(data)) {
        const match = data.find((p: { setId: string }) => p.setId === mostRecent.setId)
        return match ?? { masteredCount: 0, totalCards: 0 }
      }
      return data
    },
    enabled: !!mostRecent?.setId,
  })

  if (!session?.user || !mostRecent) return null

  const masteryPct = progress?.totalCards
    ? Math.round((progress.masteredCount / progress.totalCards) * 100)
    : 0
  const categoryName = mostRecent.set.category?.name

  return (
    <section className="py-4 animate-fade-in">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-3 font-heading">
        <Star className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
        Pick up where you left off
      </h2>

      <Link href={`/sets/${mostRecent.setId}`}>
        <div
          className="rounded-2xl p-5 flex items-center gap-5 transition-all hover:shadow-md cursor-pointer"
          style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}
        >
          {/* Icon */}
          <div
            className="h-12 w-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            {mostRecent.set.title.charAt(0).toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {categoryName && (
              <p className="text-[10px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "var(--primary)" }}>
                Recommended · {categoryName}
              </p>
            )}
            <h3 className="font-semibold text-foreground font-heading line-clamp-1 text-base">
              {mostRecent.set.title}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {mostRecent.set._count.cards} cards · Last studied {timeAgo(mostRecent.studiedAt)}
            </p>

            {/* Progress bar */}
            {masteryPct > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div
                  className="h-1.5 flex-1 rounded-full overflow-hidden"
                  style={{ background: "var(--muted)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${masteryPct}%`, background: "var(--primary)" }}
                  />
                </div>
                <span className="text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>
                  {masteryPct}% mastered
                </span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div
            className="flex items-center gap-1 text-sm font-medium flex-shrink-0"
            style={{ color: "var(--primary)" }}
          >
            Continue <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </Link>
    </section>
  )
}
