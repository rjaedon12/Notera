"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  Trophy, Star, BookOpen, Brain, Clock, Flame,
  Target, Zap, Award, Crown, Medal, Heart,
  Loader2
} from "lucide-react"
import toast from "react-hot-toast"

interface Achievement {
  key: string
  title: string
  description: string
  icon: string  // emoji
  unlocked: boolean
  unlockedAt: string | null
}

export default function AchievementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: achievements = [], isLoading } = useQuery<Achievement[]>({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements")
      if (!res.ok) throw new Error("Failed to fetch achievements")
      const json = await res.json()
      // API returns { achievements: [...], total, unlocked } — extract the array
      return Array.isArray(json) ? json : (json.achievements ?? [])
    },
    enabled: !!session,
    retry: false,
  })

  // Check for new achievements on load
  const checkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/achievements", { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: (data) => {
      if (data.newAchievements?.length > 0) {
        data.newAchievements.forEach((a: { title?: string; name?: string }) => {
          toast.success(`🏆 Achievement unlocked: ${a.title ?? a.name}!`)
        })
        queryClient.invalidateQueries({ queryKey: ["achievements"] })
      }
    },
  })

  useEffect(() => {
    if (session) {
      checkMutation.mutate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

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

  const unlocked = achievements.filter(a => a.unlocked)
  const locked = achievements.filter(a => !a.unlocked)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground font-heading">Achievements</h1>
        <p className="text-muted-foreground mt-1">
          {unlocked.length} of {achievements.length} unlocked
        </p>
      </div>

      {/* Progress */}
      <div className="w-full h-3 rounded-full" style={{ background: "var(--glass-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: achievements.length > 0 ? `${(unlocked.length / achievements.length) * 100}%` : "0%",
            background: "linear-gradient(90deg, var(--primary), #f59e0b)",
          }}
        />
      </div>

      {/* Unlocked */}
      {unlocked.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" /> Unlocked
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlocked.map((a) => (
              <div
                key={a.key}
                className="rounded-xl border p-5 transition-all hover:scale-[1.02]"
                style={{ borderColor: "#f59e0b40", background: "#f59e0b08" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "#f59e0b20" }}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{a.description}</p>
                    {a.unlockedAt && (
                      <p className="text-xs mt-2" style={{ color: "#f59e0b" }}>
                        Unlocked {new Date(a.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            🔒 Locked
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {locked.map((a) => (
              <div
                key={a.key}
                className="rounded-xl border p-5 opacity-60"
                style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                    style={{ background: "var(--glass-fill)" }}
                  >
                    {a.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{a.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{a.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
