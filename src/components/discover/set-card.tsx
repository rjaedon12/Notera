"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Star } from "lucide-react"
import type { StudySet } from "@/types"

interface SetCardProps {
  set: StudySet
  isStarred?: boolean
  onToggleStar?: (setId: string, e: React.MouseEvent) => void
  showStar?: boolean
}

export function SetCard({ set, isStarred, onToggleStar, showStar }: SetCardProps) {
  const starCount = set._count?.starredBy ?? 0

  return (
    <Link href={`/sets/${set.id}`} className="block min-w-[240px] max-w-[320px] flex-shrink-0 snap-start">
      <Card className={`h-full cursor-pointer relative overflow-hidden ${set.isFeatured ? "ring-1 ring-amber-400/40" : ""}`}>
        {set.isFeatured && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-amber-500 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
              <Star className="h-2.5 w-2.5 fill-white" />
              Featured
            </div>
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base mb-1 line-clamp-2 flex-1 font-heading">
              {set.title}
            </h3>
            {showStar && onToggleStar && (
              <button
                onClick={(e) => onToggleStar(set.id, e)}
                className="ml-1 p-1 rounded-full hover:bg-[var(--glass-fill-hover)] transition-colors flex-shrink-0"
                aria-label={isStarred ? "Unstar set" : "Star set"}
              >
                <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-[var(--muted-foreground)]"}`} />
              </button>
            )}
          </div>

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

          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span>{set._count?.cards ?? 0} cards</span>
            {starCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3" /> {starCount}
              </span>
            )}
            {set.user?.name && (
              <span className="ml-auto truncate max-w-[120px]">{set.user.name}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

/** Grid variant for browse/search mode — fills column instead of fixed width */
export function SetCardGrid({ set, isStarred, onToggleStar, showStar }: SetCardProps) {
  const starCount = set._count?.starredBy ?? 0

  return (
    <Link href={`/sets/${set.id}`} className="block">
      <Card className={`h-full cursor-pointer relative overflow-hidden ${set.isFeatured ? "ring-1 ring-amber-400/40" : ""}`}>
        {set.isFeatured && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-amber-500 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-bl-lg flex items-center gap-1">
              <Star className="h-2.5 w-2.5 fill-white" />
              Featured
            </div>
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base mb-1 line-clamp-2 flex-1 font-heading">
              {set.title}
            </h3>
            {showStar && onToggleStar && (
              <button
                onClick={(e) => onToggleStar(set.id, e)}
                className="ml-1 p-1 rounded-full hover:bg-[var(--glass-fill-hover)] transition-colors flex-shrink-0"
                aria-label={isStarred ? "Unstar set" : "Star set"}
              >
                <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-[var(--muted-foreground)]"}`} />
              </button>
            )}
          </div>

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

          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span>{set._count?.cards ?? 0} cards</span>
            {starCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3" /> {starCount}
              </span>
            )}
            {set.user?.name && (
              <span className="ml-auto truncate max-w-[120px]">{set.user.name}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
