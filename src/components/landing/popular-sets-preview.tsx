"use client"

import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, BookOpen } from "lucide-react"
import { usePublicSets } from "@/hooks/useStudy"

function SetCard({ title, cardCount, owner, description }: {
  title: string
  cardCount: number
  owner: string
  description?: string | null
}) {
  return (
    <div
      className="rounded-2xl p-5 transition-all duration-300 glass-card-hover h-full flex flex-col"
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
        boxShadow: "var(--glass-shadow), inset 0 1px 0 0 var(--glass-highlight)",
      }}
    >
      <h3 className="font-heading font-semibold text-base mb-1 line-clamp-1" style={{ color: "var(--foreground)" }}>
        {title}
      </h3>
      <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
        {cardCount} cards
      </p>
      {description && (
        <p className="text-sm line-clamp-2 mb-4 flex-1" style={{ color: "var(--muted-foreground)" }}>
          {description}
        </p>
      )}
      <div className="flex items-center gap-2 text-xs mt-auto" style={{ color: "var(--muted-foreground)" }}>
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: "color-mix(in srgb, var(--accent-color) 12%, transparent)",
            border: "1px solid color-mix(in srgb, var(--accent-color) 20%, transparent)",
          }}
        >
          <span className="font-medium" style={{ color: "var(--accent-color)", fontSize: "0.6rem" }}>
            {owner?.[0]?.toUpperCase() || "U"}
          </span>
        </div>
        <span>{owner || "Anonymous"}</span>
      </div>
    </div>
  )
}

export function PopularSetsPreview() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  const { data: publicSets, isLoading } = usePublicSets("")

  // Show first 6 sets
  const previewSets = publicSets?.slice(0, 6) ?? []

  return (
    <motion.section
      ref={ref}
      id="explore"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-6xl mx-auto px-6 py-24"
    >
      <div className="text-center mb-12">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--accent-color)" }}>
          Explore
        </p>
        <h2 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight mb-4" style={{ color: "var(--foreground)" }}>
          Popular study sets
        </h2>
        <p className="text-base max-w-xl mx-auto" style={{ color: "var(--muted-foreground)" }}>
          Jump in and start studying. Browse community-created sets or create your own.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-2xl glass-shimmer" />
          ))}
        </div>
      ) : previewSets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {previewSets.map((set) => (
            <Link key={set.id} href={`/sets/${set.id}`}>
              <SetCard
                title={set.title}
                cardCount={set._count?.cards || 0}
                owner={set.owner?.name || "Anonymous"}
                description={set.description}
              />
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>No public sets yet. Be the first to create one!</p>
        </div>
      )}

      {previewSets.length > 0 && (
        <div className="text-center mt-10">
          <Link href="/discover">
            <Button variant="outline" className="rounded-full px-6 gap-2">
              Browse all sets
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </motion.section>
  )
}
