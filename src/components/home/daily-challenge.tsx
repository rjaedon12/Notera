"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface DailyReviewData {
  totalDue: number
}

export function DailyChallenge() {
  const { data: session } = useSession()

  const { data } = useQuery<DailyReviewData>({
    queryKey: ["dailyReview"],
    queryFn: async () => {
      const res = await fetch("/api/daily-review")
      if (!res.ok) return { totalDue: 0 }
      return res.json()
    },
    enabled: !!session?.user,
    staleTime: 60_000,
  })

  if (!session?.user) return null

  const totalDue = data?.totalDue ?? 0

  return (
    <Link href="/daily-review">
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-4 transition-all hover:shadow-md cursor-pointer animate-fade-in"
        style={{
          background: "var(--glass-fill)",
          borderLeft: "3px solid var(--primary)",
          border: "1px solid var(--glass-border)",
          borderLeftWidth: "3px",
          borderLeftColor: "var(--primary)",
        }}
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-foreground font-heading">
            Daily Review
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {totalDue > 0
              ? `${totalDue} card${totalDue !== 1 ? "s" : ""} due for review`
              : "Keep your memory sharp with spaced repetition"}
          </p>
        </div>

        <div
          className="flex items-center gap-1 text-sm font-medium flex-shrink-0"
          style={{ color: "var(--primary)" }}
        >
          Start <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  )
}
