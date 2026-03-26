"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Info,
  AlertTriangle,
  Sparkles,
  Wrench,
  Megaphone,
} from "lucide-react"

interface Announcement {
  id: string
  title: string
  message: string
  type: string // INFO, WARNING, UPDATE, MAINTENANCE
  createdAt: string
  expiresAt: string | null
}

const typeConfig: Record<
  string,
  { icon: React.ReactNode; gradient: string; borderColor: string; iconColor: string }
> = {
  INFO: {
    icon: <Info className="h-4 w-4" />,
    gradient: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))",
    borderColor: "rgba(59,130,246,0.25)",
    iconColor: "var(--accent-color)",
  },
  WARNING: {
    icon: <AlertTriangle className="h-4 w-4" />,
    gradient: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
    borderColor: "rgba(245,158,11,0.25)",
    iconColor: "#f59e0b",
  },
  UPDATE: {
    icon: <Sparkles className="h-4 w-4" />,
    gradient: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))",
    borderColor: "rgba(16,185,129,0.25)",
    iconColor: "#10b981",
  },
  MAINTENANCE: {
    icon: <Wrench className="h-4 w-4" />,
    gradient: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))",
    borderColor: "rgba(239,68,68,0.25)",
    iconColor: "#ef4444",
  },
}

const DISMISSED_KEY = "dismissed_announcements"

function getLocalDismissals(): string[] {
  if (typeof window === "undefined") return []
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]")
  } catch {
    return []
  }
}

function addLocalDismissal(id: string) {
  const current = getLocalDismissals()
  if (!current.includes(id)) {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...current, id]))
  }
}

export function AnnouncementBanner() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [localDismissed, setLocalDismissed] = useState<string[]>([])

  useEffect(() => {
    setLocalDismissed(getLocalDismissals())
  }, [])

  const { data } = useQuery<{ announcements: Announcement[] }>({
    queryKey: ["announcements"],
    queryFn: async () => {
      const res = await fetch("/api/announcements")
      if (!res.ok) throw new Error("Failed to fetch announcements")
      return res.json()
    },
    refetchInterval: 60_000, // poll every 60 seconds
    staleTime: 30_000,
  })

  const dismissMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      if (session?.user?.id) {
        await fetch("/api/announcements/dismiss", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ announcementId }),
        })
      }
      // Always store locally as fallback
      addLocalDismissal(announcementId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] })
    },
  })

  const handleDismiss = useCallback(
    (id: string) => {
      setLocalDismissed((prev) => [...prev, id])
      dismissMutation.mutate(id)
    },
    [dismissMutation]
  )

  // Filter out locally dismissed ones (covers logged-out users and optimistic UI)
  const visibleAnnouncements =
    data?.announcements.filter((a) => !localDismissed.includes(a.id)) ?? []

  if (visibleAnnouncements.length === 0) return null

  return (
    <div className="space-y-2 px-6 pt-4">
      <AnimatePresence mode="popLayout">
        {visibleAnnouncements.map((announcement) => {
          const config = typeConfig[announcement.type] || typeConfig.INFO

          return (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative rounded-xl border px-4 py-3"
              style={{
                background: config.gradient,
                borderColor: config.borderColor,
                backdropFilter: "blur(12px)",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-0.5 shrink-0"
                  style={{ color: config.iconColor }}
                >
                  {config.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Megaphone className="h-3 w-3" style={{ color: "var(--muted-foreground)" }} />
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      Announcement
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {announcement.title}
                  </h4>
                  <p
                    className="text-xs mt-0.5 leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {announcement.message}
                  </p>
                </div>
                <button
                  onClick={() => handleDismiss(announcement.id)}
                  className="shrink-0 p-1 rounded-lg transition-colors hover:bg-white/10"
                  aria-label="Dismiss announcement"
                >
                  <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
