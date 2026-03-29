"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { StudySet } from "@/types"
import { SetCard } from "./set-card"

interface SetRowProps {
  title: string
  icon?: React.ReactNode
  sets: StudySet[]
  isLoading?: boolean
  onSeeAll?: () => void
  starredSetIds?: string[]
  onToggleStar?: (setId: string, e: React.MouseEvent) => void
  showStar?: boolean
}

export function SetRow({
  title,
  icon,
  sets,
  isLoading,
  onSeeAll,
  starredSetIds = [],
  onToggleStar,
  showStar,
}: SetRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", checkScroll, { passive: true })
    const observer = new ResizeObserver(checkScroll)
    observer.observe(el)
    return () => {
      el.removeEventListener("scroll", checkScroll)
      observer.disconnect()
    }
  }, [checkScroll, sets])

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.75
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" })
  }

  if (!isLoading && sets.length === 0) return null

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 font-heading">
          {icon}
          {title}
        </h2>
        {onSeeAll && (
          <button
            onClick={onSeeAll}
            className="text-sm font-medium hover:underline flex items-center gap-1"
            style={{ color: "var(--primary)" }}
          >
            See all <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-36 min-w-[240px] max-w-[320px] flex-shrink-0 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="relative group">
          {/* Left arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide pb-1"
          >
            {sets.map(set => (
              <SetCard
                key={set.id}
                set={set}
                isStarred={starredSetIds.includes(set.id)}
                onToggleStar={onToggleStar}
                showStar={showStar}
              />
            ))}
          </div>

          {/* Right arrow */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full flex items-center justify-center
                opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </section>
  )
}
