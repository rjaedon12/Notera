"use client"

import { useState, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Search, BookOpen, Sparkles, TrendingUp, Star, Clock, X } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useDiscover, useInfinitePublicSets, useStarredSets, useToggleSetStar } from "@/hooks/useStudy"
import { SetRow } from "@/components/discover/set-row"
import { SetCardGrid } from "@/components/discover/set-card"
import { SubjectPills } from "@/components/discover/subject-pills"
import { SortDropdown, type SortOption } from "@/components/discover/sort-dropdown"
import toast from "react-hot-toast"

function DiscoverContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // URL state
  const initialSearch = searchParams.get("search") || ""
  const initialCategory = searchParams.get("category") || null
  const initialSort = (searchParams.get("sort") as SortOption) || "recent"
  const initialSection = searchParams.get("section") || null

  const [searchInput, setSearchInput] = useState(initialSearch)
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(initialCategory)
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null)
  const [sort, setSort] = useState<SortOption>(initialSort)

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set("search", debouncedSearch)
    if (selectedCategoryId) params.set("category", selectedCategoryId)
    if (sort !== "recent") params.set("sort", sort)
    if (initialSection) params.set("section", initialSection)
    const qs = params.toString()
    const url = qs ? `/discover?${qs}` : "/discover"
    router.replace(url, { scroll: false })
  }, [debouncedSearch, selectedCategoryId, sort, initialSection, router])

  // Browse mode = searching, filtering by category, or viewing a "see all" section
  const isBrowseMode = debouncedSearch.length > 0 || selectedCategoryId !== null || initialSection !== null

  // Starred sets & star toggle
  const { data: starredSetIds = [] } = useStarredSets()
  const toggleStar = useToggleSetStar()

  const handleToggleStar = useCallback((setId: string, e: React.MouseEvent) => {
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
        onSuccess: () => toast.success(isStarred ? "Removed from starred" : "Added to starred"),
        onError: () => toast.error("Failed to update star"),
      }
    )
  }, [session, starredSetIds, toggleStar])

  // ── Default mode: curated sections ──
  const { data: discover, isLoading: discoverLoading } = useDiscover()

  // ── Browse mode: infinite scroll ──
  const {
    data: browseData,
    isLoading: browseLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePublicSets({
    search: debouncedSearch || undefined,
    categoryId: selectedCategoryId || undefined,
    sort,
    enabled: isBrowseMode,
  })

  const browseSets = browseData?.pages.flatMap(p => p.sets) ?? []

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const handleCategorySelect = (catId: string | null, slug: string | null) => {
    setSelectedCategoryId(catId)
    setSelectedCategorySlug(slug)
  }

  const clearFilters = () => {
    setSearchInput("")
    setDebouncedSearch("")
    setSelectedCategoryId(null)
    setSelectedCategorySlug(null)
    setSort("recent")
    router.replace("/discover", { scroll: false })
  }

  const handleSeeAll = (section: string) => {
    const params = new URLSearchParams()
    params.set("section", section)
    router.push(`/discover?${params}`, { scroll: false })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <h1 className="text-3xl font-bold mb-1 text-foreground font-heading tracking-tight">Discover</h1>
        <p className="mb-6" style={{ color: "var(--muted-foreground)" }}>
          Find study sets to learn anything
        </p>

        {/* Search bar */}
        <div className="relative mb-5">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
          <input
            type="search"
            placeholder="Search study sets..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-12 pl-12 pr-10 rounded-full text-lg transition-all
              backdrop-blur-xl border focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-0
              placeholder:text-[var(--muted-foreground)]"
            style={{
              background: "var(--glass-fill)",
              borderColor: "var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(""); setDebouncedSearch("") }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[var(--glass-fill-hover)] transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
            </button>
          )}
        </div>

        {/* Subject pills — always visible */}
        <div className="mb-6">
          <SubjectPills selectedCategoryId={selectedCategoryId} onSelect={handleCategorySelect} />
        </div>

        {isBrowseMode ? (
          /* ═══════════ Browse / Search Mode ═══════════ */
          <div>
            {/* Sort + result count */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                {browseLoading ? "Searching..." : `${browseSets.length}${hasNextPage ? "+" : ""} results`}
                {debouncedSearch && (
                  <span>
                    {" "}for &ldquo;<span className="text-foreground font-medium">{debouncedSearch}</span>&rdquo;
                  </span>
                )}
              </p>
              <div className="flex items-center gap-3">
                <SortDropdown value={sort} onChange={setSort} />
                <button
                  onClick={clearFilters}
                  className="text-sm font-medium hover:underline"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Results grid */}
            {browseLoading ? (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
            ) : browseSets.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
                <h3 className="text-lg font-medium text-foreground mb-2 font-heading">No sets found</h3>
                <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>
                  {debouncedSearch
                    ? "Try a different search term or broaden your filters."
                    : "No sets in this category yet. Be the first to create one!"}
                </p>
                <Link href="/create">
                  <Button>Create a Study Set</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {browseSets.map(set => (
                    <SetCardGrid
                      key={set.id}
                      set={set}
                      isStarred={starredSetIds.includes(set.id)}
                      onToggleStar={handleToggleStar}
                      showStar={!!session?.user}
                    />
                  ))}
                </div>

                {/* Infinite scroll sentinel */}
                <div ref={sentinelRef} className="py-6 text-center">
                  {isFetchingNextPage && (
                    <div className="flex gap-3 justify-center">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-36 w-64 rounded-xl" />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* ═══════════ Default Mode: Curated Sections ═══════════ */
          <div className="space-y-2">
            {/* For You */}
            <SetRow
              title="For You"
              icon={<Sparkles className="h-5 w-5" style={{ color: "var(--primary)" }} />}
              sets={discover?.forYou ?? []}
              isLoading={discoverLoading}
              onSeeAll={() => handleSeeAll("foryou")}
              starredSetIds={starredSetIds}
              onToggleStar={handleToggleStar}
              showStar={!!session?.user}
            />

            {/* Trending */}
            <SetRow
              title="Trending"
              icon={<TrendingUp className="h-5 w-5" style={{ color: "var(--primary)" }} />}
              sets={discover?.trending ?? []}
              isLoading={discoverLoading}
              onSeeAll={() => handleSeeAll("trending")}
              starredSetIds={starredSetIds}
              onToggleStar={handleToggleStar}
              showStar={!!session?.user}
            />

            {/* Featured */}
            {(discoverLoading || (discover?.featured?.length ?? 0) > 0) && (
              <SetRow
                title="Featured"
                icon={<Star className="h-5 w-5" style={{ color: "var(--amber-500, #f59e0b)" }} />}
                sets={discover?.featured ?? []}
                isLoading={discoverLoading}
                starredSetIds={starredSetIds}
                onToggleStar={handleToggleStar}
                showStar={!!session?.user}
              />
            )}

            {/* Recently Added */}
            <SetRow
              title="Recently Added"
              icon={<Clock className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />}
              sets={discover?.recent ?? []}
              isLoading={discoverLoading}
              onSeeAll={() => handleSeeAll("recent")}
              starredSetIds={starredSetIds}
              onToggleStar={handleToggleStar}
              showStar={!!session?.user}
            />

            {/* Empty state when all sections are empty */}
            {!discoverLoading &&
              !discover?.forYou?.length &&
              !discover?.trending?.length &&
              !discover?.featured?.length &&
              !discover?.recent?.length && (
              <div className="text-center py-16">
                <BookOpen className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
                <h3 className="text-lg font-medium text-foreground mb-2 font-heading">No study sets yet</h3>
                <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>
                  Be the first to create a public study set!
                </p>
                <Link href="/create">
                  <Button>Create a Study Set</Button>
                </Link>
              </div>
            )}
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
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64 mb-6" />
          <Skeleton className="h-12 w-full mb-5 rounded-full" />
          <div className="flex gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-8 w-24 rounded-full" />)}
          </div>
          {[1, 2, 3].map(section => (
            <div key={section} className="mb-8">
              <Skeleton className="h-6 w-40 mb-3" />
              <div className="flex gap-3">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36 min-w-[240px] rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    }>
      <DiscoverContent />
    </Suspense>
  )
}
