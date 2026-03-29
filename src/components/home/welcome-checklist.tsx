"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { Check, X, Compass, PenLine, BookOpen, Target } from "lucide-react"

interface ChecklistItem {
  id: string
  label: string
  href: string
  icon: React.ElementType
  check: (ctx: { hasSets: boolean; hasStudied: boolean }) => boolean
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "browse",
    label: "Browse study sets",
    href: "/discover",
    icon: Compass,
    check: () => false, // always actionable until dismissed
  },
  {
    id: "create",
    label: "Create your first set",
    href: "/create",
    icon: PenLine,
    check: ({ hasSets }) => hasSets,
  },
  {
    id: "study",
    label: "Complete a study session",
    href: "/discover",
    icon: BookOpen,
    check: ({ hasStudied }) => hasStudied,
  },
  {
    id: "explore",
    label: "Explore study modes",
    href: "/discover",
    icon: Target,
    check: ({ hasStudied }) => hasStudied,
  },
]

const STORAGE_KEY = "notera-welcome-dismissed"

export function WelcomeChecklist() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(true) // default true to prevent flash

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true")
  }, [])

  const { data: userSets = [] } = useQuery<{ id: string }[]>({
    queryKey: ["studySets"],
    queryFn: async () => {
      const res = await fetch("/api/sets")
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!session?.user && !dismissed,
  })

  const { data: recentStudies = [] } = useQuery<{ id: string }[]>({
    queryKey: ["recentStudies"],
    queryFn: async () => {
      const res = await fetch("/api/user/recent-studies")
      if (!res.ok) return []
      return res.json()
    },
    enabled: !!session?.user && !dismissed,
  })

  if (dismissed) return null

  const ctx = {
    hasSets: userSets.length > 0,
    hasStudied: recentStudies.length > 0,
  }

  const completedCount = CHECKLIST_ITEMS.filter((item) => item.check(ctx)).length

  // Auto-dismiss once all items are completed
  if (completedCount === CHECKLIST_ITEMS.length) {
    localStorage.setItem(STORAGE_KEY, "true")
    return null
  }

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setDismissed(true)
  }

  return (
    <div
      className="rounded-2xl p-5 mb-6 animate-fade-in relative"
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full hover:bg-[var(--muted)] transition-colors"
        aria-label="Dismiss welcome checklist"
      >
        <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
      </button>

      <h3 className="text-base font-semibold text-foreground font-heading mb-1">
        Get started with Notera
      </h3>
      <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
        {completedCount}/{CHECKLIST_ITEMS.length} completed
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {CHECKLIST_ITEMS.map((item) => {
          const done = item.check(ctx)
          const Icon = item.icon
          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all hover:scale-[1.01]"
              style={{
                background: done ? "color-mix(in srgb, var(--primary) 10%, transparent)" : "var(--background)",
                border: `1px solid ${done ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: done ? "var(--primary)" : "var(--muted)",
                  color: done ? "#fff" : "var(--muted-foreground)",
                }}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>
              <span
                className="text-sm font-medium"
                style={{
                  color: done ? "var(--primary)" : "var(--foreground)",
                  textDecoration: done ? "line-through" : "none",
                }}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
