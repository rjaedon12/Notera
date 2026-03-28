"use client"

import { useQuery } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tag as TagIcon, BookOpen, ArrowLeft, Users } from "lucide-react"

interface TagSet {
  id: string
  title: string
  description: string | null
  user: { id: string; name: string | null } | null
  _count: { cards: number }
}

interface TagResponse {
  tag: string
  slug: string
  sets: TagSet[]
}

export default function TagPage() {
  const params = useParams()
  const slug = params.slug as string

  const { data, isLoading } = useQuery<TagResponse>({
    queryKey: ["tag", slug],
    queryFn: async () => {
      const res = await fetch(`/api/tags/${slug}`)
      if (!res.ok) throw new Error("Failed to fetch tag")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-6 w-24 mb-6" />
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back link */}
      <Link
        href="/tags"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All tags
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="p-2 rounded-xl"
            style={{ background: "var(--primary)", opacity: 0.9 }}
          >
            <TagIcon className="h-5 w-5" style={{ color: "var(--primary-foreground)" }} />
          </div>
          <h1 className="text-3xl font-bold font-heading capitalize">{data?.tag || slug.replace(/-/g, " ")}</h1>
        </div>
        <p className="text-muted-foreground">
          {data?.sets.length || 0} study {data?.sets.length === 1 ? "set" : "sets"} tagged with &ldquo;{data?.tag || slug.replace(/-/g, " ")}&rdquo;
        </p>
      </div>

      {/* Sets grid */}
      {data?.sets && data.sets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.sets.map((set) => (
            <Link key={set.id} href={`/sets/${set.id}`}>
              <Card className="h-full cursor-pointer hover:shadow-md transition-all hover:scale-[1.01]">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-lg mb-1 line-clamp-1 font-heading">{set.title}</h3>
                  {set.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{set.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {set._count.cards} cards
                    </span>
                    {set.user?.name && (
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {set.user.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
          <h3 className="font-semibold text-lg mb-2 font-heading">No sets found</h3>
          <p className="text-muted-foreground text-sm">
            No public study sets have this tag yet.
          </p>
        </div>
      )}
    </div>
  )
}
