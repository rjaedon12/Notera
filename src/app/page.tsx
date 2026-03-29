"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePublicSets, useStarredSets, useToggleSetStar, useDiscover } from "@/hooks/useStudy"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SetCardSkeleton } from "@/components/ui/skeleton"
import { BookOpen, Users, Layers, ArrowRight, Clock, Star, TrendingUp, Sparkles } from "lucide-react"
import { Suspense, useEffect, useMemo } from "react"
import { StreakHero } from "@/components/streak/streak-hero"
import { QuickActions } from "@/components/home/quick-actions"
import { WelcomeChecklist } from "@/components/home/welcome-checklist"
import { DailyProgress } from "@/components/home/daily-progress"
import { RecentAchievement } from "@/components/home/recent-achievement"
import { CategoryChips } from "@/components/home/category-chips"
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

// ── Greeting header (compact) ──────────────────────────────────────────────────
function GreetingBanner({ name }: { name?: string | null }) {
  const { heading } = useTimeGreeting(name)
  return (
    <div className="animate-slide-up">
      <h1 className="text-2xl md:text-3xl font-bold tracking-[-0.03em] text-foreground font-heading">
        {heading}
      </h1>
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

  if (!session?.user) return null

  // New user empty state — show starter prompt instead of hiding
  if (recentStudies.length === 0) {
    return (
      <section className="py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 font-heading">
            <Sparkles className="h-4 w-4" style={{ color: "var(--primary)" }} />
            Start Studying
          </h2>
        </div>
        <div
          className="rounded-2xl p-6 text-center"
          style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}
        >
          <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--primary)", opacity: 0.7 }} />
          <h3 className="font-semibold text-base mb-1 text-foreground font-heading">Pick a set to begin</h3>
          <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
            Browse featured study sets or create your own.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/discover">
              <Button variant="outline" size="sm">Browse Sets</Button>
            </Link>
            <Link href="/create">
              <Button size="sm">Create a Set</Button>
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-6 border-b" style={{ borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 font-heading">
          <Clock className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
          Continue Studying
        </h2>
        <Link href="/library" className="text-sm font-medium hover:underline" style={{ color: "var(--primary)" }}>
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {recentStudies.slice(0, 4).map((study) => (
          <Link key={study.id} href={`/sets/${study.setId}`}>
            <Card className="cursor-pointer">
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-1 text-card-foreground font-heading">
                  {study.set.title}
                </h3>
                <div className="flex items-center justify-between mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
                  <span>{study.set._count.cards} cards</span>
                  <span className="capitalize">{study.mode}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  )
}

function HomeContent() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const search = searchParams.get("search") || ""
  // Use discover API for personalized recommendations, public sets for search
  const { data: discoverData, isLoading: discoverLoading } = useDiscover()
  const { data: searchSets, isLoading: searchLoading } = usePublicSets(search, { limit: 50 })
  const isSearchMode = !!search
  const isLoading = isSearchMode ? searchLoading : discoverLoading
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

  // For search: sort featured first, then starred, then recency
  // For home: use discover API's "forYou" section (personalized), fall back to featured
  const sortedSets = isSearchMode
    ? (searchSets
        ? [...searchSets].sort((a, b) => {
            const aFeatured = a.isFeatured ? 2 : 0
            const bFeatured = b.isFeatured ? 2 : 0
            const aStarred = starredSetIds.includes(a.id) ? 1 : 0
            const bStarred = starredSetIds.includes(b.id) ? 1 : 0
            return (bFeatured + bStarred) - (aFeatured + aStarred)
          })
        : [])
    : discoverData
      ? [...(discoverData.forYou?.length ? discoverData.forYou : discoverData.featured ?? [])].slice(0, 6)
      : []

  return (
    <div className="container mx-auto px-6 py-6">
      {/* ── Compact header row: greeting + streak ── */}
      {session?.user && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 mb-2">
          <div className="flex flex-col gap-2">
            <GreetingBanner name={session.user.name} />
            <RecentAchievement />
          </div>
          <StreakHero />
        </div>
      )}

      {/* ── Daily progress + quick actions ── */}
      {session?.user && (
        <div className="mb-4">
          <DailyProgress />
          <QuickActions />
        </div>
      )}

      {/* ── Welcome checklist for new users ── */}
      {session?.user && <WelcomeChecklist />}

      {/* ── Continue Studying ── */}
      {session?.user && <ContinueStudying />}

      {/* ── Browse by Subject ── */}
      {session?.user && <CategoryChips />}

      {/* ── Recommended / Search results ── */}
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2 font-heading">
            <TrendingUp className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
            {search ? `Search results for "${search}"` : "Recommended for You"}
          </h2>
          {!search && (
            <Link href="/discover" className="text-sm font-medium hover:underline flex items-center gap-1" style={{ color: "var(--primary)" }}>
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SetCardSkeleton key={i} />
            ))}
          </div>
        ) : sortedSets && sortedSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSets.map((set) => {
              const isStarred = starredSetIds.includes(set.id)
              const isFeatured = set.isFeatured
              return (
                <Link key={set.id} href={`/sets/${set.id}`}>
                  <Card className={`h-full cursor-pointer relative overflow-hidden ${isFeatured ? "ring-1 ring-amber-400/40" : isStarred ? "ring-1 ring-[var(--primary)]/20" : ""}`}>
                    {isFeatured && (
                      <div className="absolute top-0 right-0 z-10">
                        <div className="bg-amber-500 text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg flex items-center gap-1">
                          <Star className="h-2.5 w-2.5 fill-white" />
                          Featured
                        </div>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1 flex-1 font-heading">{set.title}</h3>
                        {session?.user && (
                          <button
                            onClick={(e) => handleToggleStar(set.id, e)}
                            className="ml-2 p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                            aria-label={isStarred ? "Unstar set" : "Star set"}
                          >
                            <Star className={`h-5 w-5 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {set._count?.cards || 0} cards
                      </p>
                      {set.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {set.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {isStarred && (
                          <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>★ Starred</span>
                        )}
                      </div>
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
