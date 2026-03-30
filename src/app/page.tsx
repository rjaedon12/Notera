"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePublicSets, useStarredSets, useToggleSetStar } from "@/hooks/useStudy"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SetCardSkeleton } from "@/components/ui/skeleton"
import { BookOpen, ArrowRight, Clock, Star, Layers } from "lucide-react"
import { Suspense, useEffect, useMemo } from "react"
import { StreakHero } from "@/components/streak/streak-hero"
import { PickUpHero } from "@/components/home/pick-up-hero"
import { DailyChallenge } from "@/components/home/daily-challenge"
import { ActivitySnapshot } from "@/components/home/activity-snapshot"
import toast from "react-hot-toast"
import {
  LandingNavbar,
  HeroSection,
  FeatureSections,
  PopularSetsPreview,
  CTASection,
  LandingFooter,
} from "@/components/landing"

// ── Time-based greeting ──────────────────────────────────────────────────────
const GREETINGS = {
  night: [
    { line1: (n: string | null) => n ? `Up late, ${n}.` : "Up late.", line2: "Let's make it count." },
    { line1: (n: string | null) => n ? `Still at it, ${n}.` : "Still at it.", line2: "The quiet hours are good for focus." },
    { line1: (n: string | null) => n ? `Late night, ${n}.` : "Late night.", line2: "Night sessions stick." },
  ],
  morning: [
    { line1: (n: string | null) => n ? `Morning, ${n}.` : "Good morning.", line2: "Fresh start." },
    { line1: (n: string | null) => n ? `Early start, ${n}.` : "Early start.", line2: "Best time to learn something new." },
    { line1: (n: string | null) => n ? `Good morning, ${n}.` : "Good morning.", line2: "Let's get into it." },
  ],
  afternoon: [
    { line1: (n: string | null) => n ? `Afternoon, ${n}.` : "Good afternoon.", line2: "Midday momentum." },
    { line1: (n: string | null) => n ? `Good afternoon, ${n}.` : "Good afternoon.", line2: "Keep it going." },
    { line1: (n: string | null) => n ? `Hey, ${n}.` : "Hey there.", line2: "What are we working on?" },
  ],
  evening: [
    { line1: (n: string | null) => n ? `Evening, ${n}.` : "Good evening.", line2: "End-of-day review? Solid habit." },
    { line1: (n: string | null) => n ? `Good evening, ${n}.` : "Good evening.", line2: "Evening sessions are great for retention." },
    { line1: (n: string | null) => n ? `Hey, ${n}.` : "Hey.", line2: "What's on the study list tonight?" },
  ],
} as const

function useTimeGreeting(name?: string | null) {
  return useMemo(() => {
    const hour = new Date().getHours()
    const period =
      hour >= 5 && hour < 12 ? "morning"
      : hour >= 12 && hour < 17 ? "afternoon"
      : hour >= 17 && hour < 21 ? "evening"
      : "night"

    const options = GREETINGS[period]
    const pick = options[Math.floor(Math.random() * options.length)]
    const firstName = name?.split(" ")[0] ?? null
    return {
      heading: pick.line1(firstName),
      subtext: pick.line2,
      period,
    }
  }, [name])
}

// ── Greeting header ──────────────────────────────────────────────────────────
function GreetingBanner({ name }: { name?: string | null }) {
  const { heading, subtext } = useTimeGreeting(name)
  return (
    <div className="animate-slide-up text-center">
      <h1 className="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-foreground font-heading">
        {heading}
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--muted-foreground)" }}>
        {subtext}
      </p>
    </div>
  )
}

interface RecentStudy {
  id: string
  setId: string
  set: {
    id: string
    title: string
    _count: { cards: number }
  }
  studiedAt: string
  mode: string
}

function ContinueStudying() {
  const { data: session } = useSession()
  
  const { data: recentStudies = [] } = useQuery<RecentStudy[]>({
    queryKey: ["recentStudies"],
    queryFn: async () => {
      const res = await fetch("/api/user/recent-studies")
      if (!res.ok) throw new Error("Failed to fetch recent studies")
      return res.json()
    },
    enabled: !!session?.user
  })

  if (!session?.user || recentStudies.length === 0) return null

  // Skip the first one — it's shown in PickUpHero
  const studies = recentStudies.slice(1, 4)
  if (studies.length === 0) return null

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2 font-heading">
          <Clock className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
          Continue studying
        </h2>
        <Link href="/library" className="text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {studies.map((study) => {
          const modeColors: Record<string, { bg: string; text: string; bar: string }> = {
            timed: { bg: "color-mix(in srgb, #3B82F6 15%, transparent)", text: "#3B82F6", bar: "#3B82F6" },
            match: { bg: "color-mix(in srgb, #F59E0B 15%, transparent)", text: "#D97706", bar: "#F59E0B" },
            learn: { bg: "color-mix(in srgb, #10B981 15%, transparent)", text: "#059669", bar: "#10B981" },
            flashcard: { bg: "color-mix(in srgb, #8B5CF6 15%, transparent)", text: "#7C3AED", bar: "#8B5CF6" },
            test: { bg: "color-mix(in srgb, #EF4444 15%, transparent)", text: "#DC2626", bar: "#EF4444" },
          }
          const mode = study.mode.toLowerCase()
          const colors = modeColors[mode] ?? modeColors.learn

          return (
            <Link key={study.id} href={`/sets/${study.setId}`}>
              <Card className="cursor-pointer h-full relative overflow-hidden">
                <CardContent className="p-4 pb-3">
                  <h3 className="font-semibold line-clamp-1 text-card-foreground font-heading text-sm">
                    {study.set.title}
                  </h3>
                  <div className="flex items-center justify-between mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span>{study.set._count.cards} cards</span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {study.mode.charAt(0).toUpperCase() + study.mode.slice(1).toLowerCase()}
                    </span>
                  </div>
                </CardContent>
                {/* Bottom color bar */}
                <div
                  className="h-0.5 w-full"
                  style={{ background: `linear-gradient(to right, ${colors.bar} 60%, transparent)` }}
                />
              </Card>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

function HomeContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const search = searchParams.get("search") || ""
  const { data: publicSets, isLoading } = usePublicSets(search, { limit: search ? 50 : 6 })
  const { data: starredSetIds = [] } = useStarredSets()
  const toggleStar = useToggleSetStar()

  // ── Dynamic page title ──
  useEffect(() => {
    if (status === "loading") return
    document.title = session?.user ? "Notera | Home" : "Notera | Landing"
  }, [session, status])

  // ── Landing page for unauthenticated users ──
  if (status !== "loading" && !session?.user) {
    return (
      <>
        <LandingNavbar />
        <HeroSection />
        <FeatureSections />
        <PopularSetsPreview />
        <CTASection />
        <LandingFooter />
      </>
    )
  }

  const handleToggleStar = (setId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!session?.user) {
      toast.error("Sign in to star sets")
      return
    }
    const isStarred = starredSetIds.includes(setId)
    toggleStar.mutate(
      { setId, starred: !isStarred },
      {
        onSuccess: () => {
          toast.success(isStarred ? "Removed from starred" : "Added to starred")
        },
        onError: () => {
          toast.error("Failed to update star")
        },
      }
    )
  }

  // Sort: featured first, then starred, then by recency
  const sortedSets = publicSets
    ? [...publicSets].sort((a, b) => {
        const aFeatured = a.isFeatured ? 2 : 0
        const bFeatured = b.isFeatured ? 2 : 0
        const aStarred = starredSetIds.includes(a.id) ? 1 : 0
        const bStarred = starredSetIds.includes(b.id) ? 1 : 0
        return (bFeatured + bStarred) - (aFeatured + aStarred)
      })
    : []

  return (
    <div className="container mx-auto px-6 py-6 max-w-3xl">
      {/* ── Greeting ── */}
      {session?.user && <GreetingBanner name={session.user.name} />}

      {/* ── Streak pill ── */}
      {session?.user && (
        <div className="mt-5 mb-6">
          <StreakHero />
        </div>
      )}

      {/* ── Pick up where you left off ── */}
      {session?.user && <PickUpHero />}

      {/* ── Continue studying ── */}
      {session?.user && <ContinueStudying />}

      {/* ── Daily challenge ── */}
      {session?.user && (
        <div className="py-4">
          <DailyChallenge />
        </div>
      )}

      {/* ── Weekly activity snapshot ── */}
      {session?.user && (
        <div className="py-4">
          <ActivitySnapshot />
        </div>
      )}

      {/* ── Recent study sets ── */}
      <section className="py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 font-heading">
            <Layers className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            {search ? `Search results for "${search}"` : "Recent study sets"}
          </h2>
          {!search && (
            <Link href="/discover" className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: "var(--primary)" }}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <SetCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedSets && sortedSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sortedSets.map((set) => {
              const isStarred = starredSetIds.includes(set.id)
              return (
                <Link key={set.id} href={`/sets/${set.id}`}>
                  <Card className="h-full cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold line-clamp-1 flex-1 font-heading text-sm text-card-foreground">{set.title}</h3>
                        {session?.user && (
                          <button
                            onClick={(e) => handleToggleStar(set.id, e)}
                            className="ml-2 p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                            aria-label={isStarred ? "Unstar set" : "Star set"}
                          >
                            <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                          </button>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                        {set._count?.cards || 0} cards
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
            <h3 className="font-semibold text-lg mb-2 text-card-foreground font-heading">No study sets found</h3>
            <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>
              {search 
                ? "Try a different search term or create your own set."
                : "Be the first to create a public study set!"}
            </p>
            <Link href="/create">
              <Button>Create a Study Set</Button>
            </Link>
          </Card>
        )}
      </section>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div>
            <div className="h-12 glass-shimmer rounded-2xl w-96 mx-auto mb-4" />
            <div className="h-6 glass-shimmer rounded-2xl w-64 mx-auto" />
          </div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
