"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { Tag as TagIcon, BookOpen, TrendingUp, Search } from "lucide-react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"

interface TagData {
  name: string
  slug: string
  count: number
  color: string
  description: string
}

const COLOR_CLASSES: Record<string, string> = {
  blue:   "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20",
  green:  "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/20",
  purple: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20",
  orange: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/20",
  pink:   "bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/20",
  red:    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
  yellow: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  cyan:   "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
}

export default function TagsPage() {
  const [search, setSearch] = useState("")

  const { data: tags, isLoading } = useQuery<TagData[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags")
      if (!res.ok) return []
      return res.json()
    },
  })

  const filteredTags = useMemo(() => {
    if (!tags) return []
    if (!search.trim()) return tags
    return tags.filter((t) => t.name.includes(search.toLowerCase()))
  }, [tags, search])

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-72" />
        </div>
        <Skeleton className="h-10 w-full mb-8" />
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <Skeleton key={i} className="h-10 w-28 rounded-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-2 rounded-xl"
            style={{ background: "var(--primary)", opacity: 0.9 }}
          >
            <TagIcon className="h-5 w-5" style={{ color: "var(--primary-foreground)" }} />
          </div>
          <h1 className="text-3xl font-bold font-heading">Browse Tags</h1>
        </div>
        <p className="text-muted-foreground">
          Explore topics across all public study sets. Click a tag to find matching sets.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Stats */}
      {tags && tags.length > 0 && (
        <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            {tags.length} tags across all sets
          </span>
        </div>
      )}

      {/* Tag cloud */}
      {filteredTags.length > 0 ? (
        <div className="flex flex-wrap gap-2.5">
          {filteredTags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/tags/${tag.slug}`}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all hover:scale-105 hover:shadow-md",
                COLOR_CLASSES[tag.color] ?? COLOR_CLASSES.blue
              )}
            >
              <span>{tag.name}</span>
              <span className="flex items-center gap-1 opacity-70 text-xs">
                <BookOpen className="h-3 w-3" />
                {tag.count}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <TagIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="font-semibold text-lg mb-2 text-foreground font-heading">
            {search ? "No matching tags" : "No tags yet"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {search
              ? "Try a different search term."
              : "Tags will appear here as sets are created with tags."}
          </p>
        </div>
      )}
    </div>
  )
}
