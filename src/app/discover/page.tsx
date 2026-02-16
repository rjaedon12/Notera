"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, BookOpen, Users, Tag as TagIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Tag {
  id: string
  name: string
  slug: string
  category: string | null
  _count: { sets: number; resources: number }
}

interface StudySet {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  isPremade: boolean
  owner: { id: string; name: string | null }
  _count: { cards: number }
  tags?: { tag: Tag }[]
}

function DiscoverContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") || ""
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Fetch tags
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags")
      if (!res.ok) throw new Error("Failed to fetch tags")
      return res.json()
    }
  })

  // Fetch public sets
  const { data: sets = [], isLoading } = useQuery<StudySet[]>({
    queryKey: ["publicSets", searchQuery, selectedTag],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (selectedTag) params.set("tag", selectedTag)
      const res = await fetch(`/api/sets/public?${params}`)
      if (!res.ok) throw new Error("Failed to fetch sets")
      return res.json()
    }
  })

  // Group tags by category
  const tagsByCategory = tags.reduce((acc, tag) => {
    const category = tag.category || "Other"
    if (!acc[category]) acc[category] = []
    acc[category].push(tag)
    return acc
  }, {} as Record<string, Tag[]>)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-foreground">Discover</h1>
        <p className="text-muted-foreground mb-8">
          Explore public study sets and resources
        </p>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search study sets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-lg"
          />
        </div>

        {/* Tags Filter */}
        {Object.keys(tagsByCategory).length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
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
              {tags.slice(0, 15).map((tag) => (
                <Button
                  key={tag.id}
                  variant={selectedTag === tag.slug ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(tag.slug === selectedTag ? null : tag.slug)}
                  className="gap-1"
                >
                  {tag.name}
                  <span className="text-xs opacity-70">({tag._count.sets})</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No sets found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sets.map((set) => (
              <Link key={set.id} href={`/sets/${set.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {set.title}
                    </h3>
                    {set.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {set.description}
                      </p>
                    )}
                    
                    {/* Tags */}
                    {set.tags && set.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {set.tags.slice(0, 3).map((t) => (
                          <span
                            key={t.tag.id}
                            className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full"
                          >
                            {t.tag.name}
                          </span>
                        ))}
                        {set.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-xs text-muted-foreground">
                            +{set.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{set._count.cards} cards</span>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {set.owner.name || "Anonymous"}
                      </div>
                    </div>
                    
                    {set.isPremade && (
                      <span className="mt-2 inline-block px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full">
                        Featured
                      </span>
                    )}
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
        <Skeleton className="h-12 w-full mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  )
}
