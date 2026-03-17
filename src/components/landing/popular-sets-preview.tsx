"use client"

import Link from "next/link"
import { usePublicSets } from "@/hooks/useStudy"

function SetCard({ title, cardCount, owner, description }: {
  title: string
  cardCount: number
  owner: string
  description?: string | null
}) {
  return (
    <div
      className="rounded-lg p-5 h-full flex flex-col transition-colors duration-200"
      style={{
        background: "#FFFFFF",
        border: "1px solid rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#F5F5F2" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF" }}
    >
      <h3 className="font-heading font-semibold text-base mb-1.5 line-clamp-1" style={{ color: "#1A1A1A", letterSpacing: "-0.01em" }}>
        {title}
      </h3>
      <p
        className="text-xs font-semibold uppercase mb-3"
        style={{ color: "#8A8A8A", letterSpacing: "0.08em" }}
      >
        {cardCount} cards
      </p>
      {description && (
        <p className="text-sm line-clamp-2 mb-4 flex-1 leading-relaxed" style={{ color: "#6B6B6B" }}>
          {description}
        </p>
      )}
      <div className="flex items-center gap-2 text-xs mt-auto" style={{ color: "#8A8A8A" }}>
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.05)" }}
        >
          <span className="font-medium text-[0.6rem]" style={{ color: "#6B6B6B" }}>
            {owner?.[0]?.toUpperCase() || "U"}
          </span>
        </div>
        <span>{owner || "Anonymous"}</span>
      </div>
    </div>
  )
}

export function PopularSetsPreview() {
  const { data: publicSets, isLoading } = usePublicSets("")
  const previewSets = publicSets?.slice(0, 6) ?? []

  return (
    <section id="explore" className="max-w-5xl mx-auto px-6" style={{ paddingTop: "5rem", paddingBottom: "5rem" }}>
      {/* Thin divider */}
      <hr className="landing-divider mb-16" />

      <div className="mb-12">
        <p
          className="text-xs font-semibold uppercase mb-4"
          style={{ color: "#8A8A8A", letterSpacing: "0.12em" }}
        >
          Explore
        </p>
        <h2
          className="font-heading font-bold leading-[1.1] max-w-sm"
          style={{
            color: "#1A1A1A",
            fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
            letterSpacing: "-0.03em",
          }}
        >
          Popular study sets
        </h2>
        <p className="text-[0.938rem] leading-relaxed mt-3 max-w-md" style={{ color: "#6B6B6B" }}>
          Browse community-created sets or create your own.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-36 rounded-lg animate-pulse" style={{ background: "rgba(0,0,0,0.03)" }} />
          ))}
        </div>
      ) : previewSets.length > 0 ? (
        <>
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
          <div className="mt-10">
            <Link
              href="/discover"
              className="text-sm font-medium transition-colors"
              style={{ color: "#6B6B6B" }}
            >
              Browse all sets &rarr;
            </Link>
          </div>
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm" style={{ color: "#8A8A8A" }}>No public sets yet. Be the first to create one.</p>
        </div>
      )}
    </section>
  )
}
