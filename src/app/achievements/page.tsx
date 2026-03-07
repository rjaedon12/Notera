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
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  requirement: number
  unlockedAt: string | null
}

const ICON_MAP: Record<string, React.ReactNode> = {
  bookOpen: <BookOpen className="h-6 w-6" />,
  brain: <Brain className="h-6 w-6" />,
  star: <Star className="h-6 w-6" />,
  flame: <Flame className="h-6 w-6" />,
  target: <Target className="h-6 w-6" />,
  zap: <Zap className="h-6 w-6" />,
  trophy: <Trophy className="h-6 w-6" />,
  award: <Award className="h-6 w-6" />,
  crown: <Crown className="h-6 w-6" />,
  medal: <Medal className="h-6 w-6" />,
  heart: <Heart className="h-6 w-6" />,
  clock: <Clock className="h-6 w-6" />,
}

const COLOR_MAP: Record<string, string> = {
  bookOpen: "#4F8EF7",
  brain: "#a050dc",
  star: "#f59e0b",
  flame: "#ef4444",
  target: "#42d9a0",
  zap: "#eab308",
  trophy: "#f59e0b",
  award: "#8b5cf6",
  crown: "#f59e0b",
  medal: "#6366f1",
  heart: "#ec4899",
  clock: "#06b6d4",
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
      return res.json()
    },
    enabled: !!session,
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
        data.newAchievements.forEach((a: { name: string }) => {
          toast.success(`🏆 Achievement unlocked: ${a.name}!`)
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

  const unlocked = achievements.filter(a => a.unlockedAt)
  const locked = achievements.filter(a => !a.unlockedAt)

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
            {unlocked.map((a) => {
              const color = COLOR_MAP[a.icon] || "#4F8EF7"
              return (
                <div
                  key={a.id}
                  className="rounded-xl border p-5 transition-all hover:scale-[1.02]"
                  style={{
                    borderColor: `${color}40`,
                    background: `${color}08`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${color}20`, color }}
                    >
                      {ICON_MAP[a.icon] || <Trophy className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{a.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">{a.description}</p>
                      <p className="text-xs mt-2" style={{ color }}>
                        Unlocked {new Date(a.unlockedAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
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
                key={a.id}
                className="rounded-xl border p-5 opacity-60"
                style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: "var(--glass-fill)", color: "var(--muted-foreground)" }}
                  >
                    {ICON_MAP[a.icon] || <Trophy className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{a.name}</h3>
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
