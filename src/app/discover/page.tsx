"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, BookOpen, Users, Tag as TagIcon } from "lucide-react"
import { getTagDef } from "@/data/tags"

interface StudySet {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  tags: string[]
  user: { id: string; name: string | null }
  _count: { cards: number }
}

function DiscoverContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") || ""
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Fetch public sets
  const { data: sets = [], isLoading } = useQuery<StudySet[]>({
    queryKey: ["publicSets", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      const res = await fetch(`/api/sets/public?${params}`)
      if (!res.ok) throw new Error("Failed to fetch sets")
      return res.json()
    }
  })

  // Collect unique tags from fetched sets and filter client-side
  const allTags = Array.from(new Set(sets.flatMap(s => s.tags ?? []))).sort()
  const filteredSets = selectedTag
    ? sets.filter(s => (s.tags ?? []).includes(selectedTag))
    : sets

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-foreground font-heading tracking-tight">Discover</h1>
        <p className="mb-8" style={{ color: "var(--muted-foreground)" }}>
          Explore public study sets and resources
        </p>

        {/* Search - glass pill */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="search"
            placeholder="Search study sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-full text-lg transition-all
              backdrop-blur-xl border focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-0
              placeholder:text-[var(--muted-foreground)]"
            style={{
              background: "var(--glass-fill)",
              borderColor: "var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Tags Filter - glass pills */}
        {allTags.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
              <TagIcon className="h-4 w-4" />
              Filter by tag
            </h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedTag === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedTag(null)}
              >
                All
              </Button>
              {allTags.slice(0, 15).map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTag === tag ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
            <h3 className="text-lg font-medium text-foreground mb-2 font-heading">
              No sets found
            </h3>
            <p style={{ color: "var(--muted-foreground)" }}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredSets.map((set) => (
              <Link key={set.id} href={`/sets/${set.id}`}>
                <Card className="h-full cursor-pointer">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2 font-heading">
                      {set.title}
                    </h3>
                    {set.description && (
                      <p className="text-sm line-clamp-2 mb-3" style={{ color: "var(--muted-foreground)" }}>
                        {set.description}
                      </p>
                    )}
                    
                    {/* Tags - colored pills */}
                    {set.tags && set.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {set.tags.slice(0, 3).map((tag) => {
                          const def = getTagDef(tag)
                          return (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs rounded-full font-medium"
                              style={{
                                background: `color-mix(in srgb, var(--${def.color === "blue" ? "primary" : def.color === "red" ? "destructive" : "primary"}) 12%, transparent)`,
                                color: "var(--primary)",
                                border: "1px solid rgba(79,142,247,0.2)",
                              }}
                            >
                              {def.label}
                            </span>
                          )
                        })}
                        {set.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-xs" style={{ color: "var(--muted-foreground)" }}>
                            +{set.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm" style={{ color: "var(--muted-foreground)" }}>
                      <span>{set._count?.cards ?? 0} cards</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-12 w-full mb-6 rounded-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  )
}
