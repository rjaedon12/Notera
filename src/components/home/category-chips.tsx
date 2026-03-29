"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

export function CategoryChips() {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories")
      if (!res.ok) return []
      return res.json()
    },
    staleTime: 300_000, // 5 minutes
  })

  // Only show top-level categories (the API returns them top-level by default)
  const topLevel = categories.slice(0, 6)

  if (topLevel.length === 0) return null

  return (
    <section className="pb-4 animate-fade-in">
      <h3
        className="text-sm font-medium mb-3"
        style={{ color: "var(--muted-foreground)" }}
      >
        Browse by Subject
      </h3>
      <div className="flex flex-wrap gap-2">
        {topLevel.map((cat) => (
          <Link
            key={cat.id}
            href={`/discover?category=${cat.slug}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all
              hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground)",
            }}
          >
            {cat.icon && <span>{cat.icon}</span>}
            {cat.name}
          </Link>
        ))}
      </div>
    </section>
  )
}
