"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePublicSets, useStarredSets, useToggleSetStar } from "@/hooks/useStudy"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SetCardSkeleton } from "@/components/ui/skeleton"
import { BookOpen, Users, Layers, ArrowRight, Clock, Star, TrendingUp } from "lucide-react"
import { Suspense, useMemo } from "react"
import { StreakHero } from "@/components/streak/streak-hero"
import toast from "react-hot-toast"

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

// ── Greeting header ────────────────────────────────────────────────────────────
function GreetingBanner({ name }: { name?: string | null }) {
  const { heading, subtext } = useTimeGreeting(name)
  return (
    <div className="mb-8 animate-slide-up">
      <h1 className="text-3xl font-bold tracking-tight text-foreground font-heading">
        {heading}
      </h1>
      <p className="mt-1 text-base" style={{ color: "var(--muted-foreground)" }}>
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

  return (
    <section className="py-8 border-b" style={{ borderColor: "var(--glass-border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2 font-heading">
          <Clock className="h-5 w-5" style={{ color: "var(--primary)" }} />
          Continue Studying
        </h2>
        <Link href="/library" className="text-sm hover:underline" style={{ color: "var(--primary)" }}>
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const search = searchParams.get("search") || ""
  const { data: publicSets, isLoading } = usePublicSets(search)
  const { data: starredSetIds = [] } = useStarredSets()
  const toggleStar = useToggleSetStar()

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

  // Sort starred sets to the top
  const sortedSets = publicSets
    ? [...publicSets].sort((a, b) => {
        const aStarred = starredSetIds.includes(a.id) ? 1 : 0
        const bStarred = starredSetIds.includes(b.id) ? 1 : 0
        return bStarred - aStarred
      })
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Time-based greeting for logged-in users */}
      {session?.user && <GreetingBanner name={session.user.name} />}

      {/* Streak Hero - Duolingo-style streak display for logged-in users */}
      {session?.user && <StreakHero />}

      {/* Continue Studying - shown for logged-in users */}
      {session?.user && <ContinueStudying />}

      {/* Hero Section - shown for non-logged-in users */}
      {!session?.user && (
        <section className="text-center py-12 md:py-20">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-heading tracking-tight">
            Learn Smarter with <span style={{ color: "var(--primary)" }}>Koda</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: "var(--muted-foreground)" }}>
            Create flashcards, study with multiple modes, and track your progress.
            Master any subject faster with our adaptive learning system.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </Link>
          </div>
        </section>
      )}

      {/* Features - only show for non-logged-in users */}
      {!session?.user && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12">
          <Card className="p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.2)" }}>
              <Layers className="h-6 w-6" style={{ color: "var(--primary)" }} />
            </div>
            <h3 className="font-semibold text-lg mb-2 font-heading">Multiple Study Modes</h3>
            <p style={{ color: "var(--muted-foreground)" }}>
              Flashcards, Learn, Test, Match, and Timed modes to suit your learning style.
            </p>
          </Card>
          <Card className="p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(66,217,160,0.12)", border: "1px solid rgba(66,217,160,0.2)" }}>
              <BookOpen className="h-6 w-6" style={{ color: "#42d9a0" }} />
            </div>
            <h3 className="font-semibold text-lg mb-2 font-heading">Progress Tracking</h3>
            <p style={{ color: "var(--muted-foreground)" }}>
              Track your mastery level and focus on cards you need to practice most.
            </p>
          </Card>
          <Card className="p-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "rgba(160,80,220,0.12)", border: "1px solid rgba(160,80,220,0.2)" }}>
              <Users className="h-6 w-6" style={{ color: "#a050dc" }} />
            </div>
            <h3 className="font-semibold text-lg mb-2 font-heading">Share & Collaborate</h3>
            <p style={{ color: "var(--muted-foreground)" }}>
              Share your study sets with friends or discover public sets from others.
            </p>
          </Card>
        </section>
      )}

      {/* Featured Sets */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2 font-heading">
            <Star className="h-6 w-6" style={{ color: "var(--primary)" }} />
            {search ? `Search results for "${search}"` : "Featured Study Sets"}
          </h2>
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
              return (
                <Link key={set.id} href={`/sets/${set.id}`}>
                  <Card className={`h-full cursor-pointer ${isStarred ? "ring-2 ring-[var(--primary)]/30" : ""}`}>
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
                        <div className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.2)" }}>
                          <span className="font-medium" style={{ color: "var(--primary)", fontSize: "0.65rem" }}>
                            {set.owner?.name?.[0]?.toUpperCase() || "U"}
                          </span>
                        </div>
                        <span>{set.owner?.name || "Anonymous"}</span>
                        {isStarred && (
                          <span className="ml-auto text-xs font-medium" style={{ color: "var(--primary)" }}>★ Starred</span>
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
