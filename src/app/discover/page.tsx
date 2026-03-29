"use client"

import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, BookOpen, ChevronDown, ChevronRight, FolderOpen } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  children?: Category[]
}

interface StudySet {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  categoryId: string | null
  category: { id: string; name: string; slug: string; icon: string | null; parent?: { id: string; name: string; slug: string } | null } | null
  user: { id: string; name: string | null }
  _count: { cards: number }
}

function CategorySection({ category, sets, expandedIds, toggleExpand }: {
  category: Category
  sets: StudySet[]
  expandedIds: Set<string>
  toggleExpand: (id: string) => void
}) {
  const isExpanded = expandedIds.has(category.id)
  const hasChildren = category.children && category.children.length > 0

  // Collect all descendant category IDs for this category
  const descendantIds = collectIds(category)
  const matchingSets = sets.filter(s => s.categoryId && descendantIds.has(s.categoryId))
  const directSets = sets.filter(s => s.categoryId === category.id)

  if (matchingSets.length === 0) return null

  return (
    <div>
      <button
        type="button"
        className="w-full flex items-center gap-2 py-2 px-1 text-left transition-colors rounded-lg hover:bg-[var(--accent)]"
        onClick={() => toggleExpand(category.id)}
      >
        {isExpanded
          ? <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />
          : <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />}
        {category.icon && <span className="text-lg">{category.icon}</span>}
        <span className="font-semibold text-foreground font-heading">{category.name}</span>
        <span className="text-xs ml-1" style={{ color: "var(--muted-foreground)" }}>
          ({matchingSets.length})
        </span>
      </button>

      {isExpanded && (
        <div className="ml-6 mt-1 space-y-3">
          {/* Direct sets at this level */}
          {directSets.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {directSets.map(set => <SetCard key={set.id} set={set} />)}
            </div>
          )}

          {/* Child categories */}
          {hasChildren && category.children!.map(child => (
            <CategorySection
              key={child.id}
              category={child}
              sets={sets}
              expandedIds={expandedIds}
              toggleExpand={toggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SetCard({ set }: { set: StudySet }) {
  return (
    <Link href={`/sets/${set.id}`}>
      <Card className="h-full cursor-pointer transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <h3 className="font-semibold text-base mb-1 line-clamp-2 font-heading">
            {set.title}
          </h3>
          {set.description && (
            <p className="text-sm line-clamp-2 mb-2" style={{ color: "var(--muted-foreground)" }}>
              {set.description}
            </p>
          )}
          {set.category && (
            <div className="flex items-center gap-1 mb-2">
              <span
                className="px-2 py-0.5 text-xs rounded-full font-medium"
                style={{
                  background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  color: "var(--primary)",
                }}
              >
                {set.category.icon ? `${set.category.icon} ` : ""}{set.category.name}
              </span>
            </div>
          )}
          <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            {set._count?.cards ?? 0} cards
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function DiscoverContent() {
  const searchParams = useSearchParams()
  const initialSearch = searchParams.get("search") || ""
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
    staleTime: 60_000,
  })

  const { data: sets = [], isLoading } = useQuery<StudySet[]>({
    queryKey: ["publicSets", searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      const res = await fetch(`/api/sets/public?${params}`)
      if (!res.ok) throw new Error("Failed to fetch sets")
      return res.json()
    },
  })

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandAll() {
    const allIds = new Set<string>()
    function walk(cats: Category[]) {
      for (const c of cats) {
        allIds.add(c.id)
        if (c.children) walk(c.children)
      }
    }
    walk(categories)
    setExpandedIds(allIds)
  }

  function collapseAll() {
    setExpandedIds(new Set())
  }

  // Sets without a category
  const uncategorizedSets = sets.filter(s => !s.categoryId)

  // When searching, show flat grid instead of tree
  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-foreground font-heading tracking-tight">Discover</h1>
        <p className="mb-8" style={{ color: "var(--muted-foreground)" }}>
          Explore public study sets and resources
        </p>

        {/* Search */}
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

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : sets.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
            <h3 className="text-lg font-medium text-foreground mb-2 font-heading">No sets found</h3>
            <p style={{ color: "var(--muted-foreground)" }}>Try adjusting your search</p>
          </div>
        ) : isSearching ? (
          /* Flat grid when actively searching */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sets.map(set => <SetCard key={set.id} set={set} />)}
          </div>
        ) : (
          /* Category tree view */
          <div>
            {/* Expand / Collapse controls */}
            <div className="flex gap-3 mb-4">
              <button
                type="button"
                onClick={expandAll}
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: "var(--primary)" }}
              >
                Expand all
              </button>
              <button
                type="button"
                onClick={collapseAll}
                className="text-sm font-medium transition-colors hover:underline"
                style={{ color: "var(--muted-foreground)" }}
              >
                Collapse all
              </button>
            </div>

            <div className="space-y-2">
              {categories.map(cat => (
                <CategorySection
                  key={cat.id}
                  category={cat}
                  sets={sets}
                  expandedIds={expandedIds}
                  toggleExpand={toggleExpand}
                />
              ))}

              {/* Uncategorized */}
              {uncategorizedSets.length > 0 && (
                <div>
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 py-2 px-1 text-left transition-colors rounded-lg hover:bg-[var(--accent)]"
                    onClick={() => toggleExpand("__uncategorized")}
                  >
                    {expandedIds.has("__uncategorized")
                      ? <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />
                      : <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--muted-foreground)" }} />}
                    <FolderOpen className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                    <span className="font-semibold text-foreground font-heading">Other</span>
                    <span className="text-xs ml-1" style={{ color: "var(--muted-foreground)" }}>
                      ({uncategorizedSets.length})
                    </span>
                  </button>
                  {expandedIds.has("__uncategorized") && (
                    <div className="ml-6 mt-1">
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {uncategorizedSets.map(set => <SetCard key={set.id} set={set} />)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Collect all IDs in a category subtree */
function collectIds(cat: Category): Set<string> {
  const ids = new Set<string>([cat.id])
  if (cat.children) {
    for (const child of cat.children) {
      for (const id of collectIds(child)) ids.add(id)
    }
  }
  return ids
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
