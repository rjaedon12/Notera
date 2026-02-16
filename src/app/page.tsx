"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { usePublicSets } from "@/hooks/useStudy"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SetCardSkeleton } from "@/components/ui/skeleton"
import { BookOpen, Users, Layers, ArrowRight, Clock, Star, TrendingUp } from "lucide-react"
import { Suspense } from "react"
import { StreakHero } from "@/components/streak/streak-hero"

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
    <section className="py-8 border-b border-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Continue Studying
        </h2>
        <Link href="/library" className="text-sm text-blue-500 hover:underline">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {recentStudies.slice(0, 4).map((study) => (
          <Link key={study.id} href={`/sets/${study.setId}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <h3 className="font-semibold line-clamp-1 text-card-foreground">
                  {study.set.title}
                </h3>
                <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Streak Hero - Duolingo-style streak display for logged-in users */}
      {session?.user && <StreakHero />}

      {/* Continue Studying - shown for logged-in users */}
      {session?.user && <ContinueStudying />}

      {/* Hero Section - shown for non-logged-in users */}
      {!session?.user && (
        <section className="text-center py-12 md:py-20">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Learn Smarter with <span className="text-primary">StudyApp</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
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
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <Layers className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-card-foreground">Multiple Study Modes</h3>
            <p className="text-muted-foreground">
              Flashcards, Learn, Test, Match, and Timed modes to suit your learning style.
            </p>
          </Card>
          <Card className="p-6">
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-card-foreground">Progress Tracking</h3>
            <p className="text-muted-foreground">
              Track your mastery level and focus on cards you need to practice most.
            </p>
          </Card>
          <Card className="p-6">
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-lg mb-2 text-card-foreground">Share & Collaborate</h3>
            <p className="text-muted-foreground">
              Share your study sets with friends or discover public sets from others.
            </p>
          </Card>
        </section>
      )}

      {/* Featured Sets */}
      <section className="py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" />
            {search ? `Search results for "${search}"` : "Featured Study Sets"}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SetCardSkeleton key={i} />
            ))}
          </div>
        ) : publicSets && publicSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {publicSets.map((set) => (
              <Link key={set.id} href={`/sets/${set.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1 text-card-foreground">{set.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {set._count?.cards || 0} cards
                    </p>
                    {set.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {set.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {set.owner?.name?.[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <span>{set.owner?.name || "Anonymous"}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-card-foreground">No study sets found</h3>
            <p className="text-muted-foreground mb-4">
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
          <div className="animate-pulse">
            <div className="h-12 bg-muted rounded w-96 mx-auto mb-4" />
            <div className="h-6 bg-muted rounded w-64 mx-auto" />
          </div>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
