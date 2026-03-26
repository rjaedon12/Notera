"use client"

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, BookOpen, Check, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useDebouncedCallback } from "use-debounce"
import type { SetForHomework } from "@/types/homework"

interface SetSelectorProps {
  selectedSetIds: string[]
  onToggle: (set: SetForHomework, selected: boolean) => void
}

export function SetSelector({ selectedSetIds, onToggle }: SetSelectorProps) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value)
  }, 300)

  const handleSearch = (value: string) => {
    setSearch(value)
    debouncedSetSearch(value)
  }

  // Fetch sets — public sets + user's own sets
  const { data: sets = [], isLoading } = useQuery<SetForHomework[]>({
    queryKey: ["homework-sets", debouncedSearch],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      params.set("includeCards", "true")
      params.set("limit", "20")
      params.set("scope", "browse")

      // Try fetching from the sets API
      const res = await fetch(`/api/sets?${params}`)
      if (!res.ok) throw new Error("Failed to fetch sets")
      const data = await res.json()

      // Handle both array and { sets: [...] } response shapes
      const setsArray = Array.isArray(data) ? data : data.sets || []
      return setsArray.map((s: Record<string, unknown>) => ({
        id: s.id as string,
        title: s.title as string,
        cards: ((s.cards as Array<Record<string, unknown>>) || []).map((c) => ({
          id: c.id as string,
          term: c.term as string,
          definition: c.definition as string,
        })),
        _count: s._count as { cards: number } | undefined,
        user: s.user as { name: string | null } | undefined,
      }))
    },
  })

  const selectedMap = useMemo(
    () => new Set(selectedSetIds),
    [selectedSetIds]
  )

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
          style={{ color: "var(--muted-foreground)" }}
        />
        <input
          type="text"
          placeholder="Search sets by title…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-xl text-sm bg-transparent border outline-none focus:ring-2 focus:ring-[var(--accent-color)]/30 text-foreground"
          style={{ borderColor: "var(--glass-border)" }}
        />
      </div>

      {/* Selected chips */}
      {selectedSetIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sets
            .filter((s) => selectedMap.has(s.id))
            .map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                style={{
                  background: "color-mix(in srgb, var(--accent-color) 12%, transparent)",
                  color: "var(--accent-color)",
                }}
              >
                {s.title}
                <button
                  onClick={() => onToggle(s, false)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
        </div>
      )}

      {/* Sets grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--accent-color)" }} />
        </div>
      ) : sets.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {search ? "No sets match your search" : "No sets available"}
          </p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[300px] overflow-y-auto pr-1">
          {sets.map((set) => {
            const isSelected = selectedMap.has(set.id)
            const cardCount = set._count?.cards ?? set.cards?.length ?? 0

            return (
              <button
                key={set.id}
                onClick={() => onToggle(set, !isSelected)}
                className={cn(
                  "relative text-left rounded-xl border p-3 transition-all hover:shadow-sm",
                  isSelected
                    ? "ring-2 ring-blue-400/50"
                    : "hover:border-[var(--accent-color)]/40"
                )}
                style={{
                  borderColor: isSelected ? "var(--accent-color)" : "var(--glass-border)",
                  background: isSelected
                    ? "color-mix(in srgb, var(--accent-color) 6%, transparent)"
                    : "transparent",
                }}
              >
                {/* Check badge */}
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: "var(--accent-color)" }}
                  >
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}

                <p className="text-sm font-medium text-foreground truncate pr-6">
                  {set.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                    {cardCount} card{cardCount !== 1 ? "s" : ""}
                  </span>
                  {set.user?.name && (
                    <>
                      <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                        ·
                      </span>
                      <span className="text-[11px] truncate" style={{ color: "var(--muted-foreground)" }}>
                        {set.user.name}
                      </span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
