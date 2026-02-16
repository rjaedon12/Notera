"use client"

import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tag as TagIcon, BookOpen, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface Tag {
  id: string
  name: string
  slug: string
  category: string | null
  _count: {
    sets: number
    resources: number
  }
}

export default function TagsPage() {
  const { data: tags, isLoading } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags")
      if (!res.ok) throw new Error("Failed to fetch tags")
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Browse Tags</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  const categories = [...new Set(tags?.map((t) => t.category).filter(Boolean))]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <TagIcon className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Browse Tags</h1>
      </div>

      {categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Categories</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category}
                className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-sm"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tags?.map((tag) => (
          <Link key={tag.id} href={`/tags/${tag.slug}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TagIcon className="h-4 w-4 text-primary" />
                  {tag.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {tag._count.sets} sets
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    {tag._count.resources} resources
                  </span>
                </div>
                {tag.category && (
                  <span className="mt-2 inline-block px-2 py-0.5 rounded bg-muted text-xs text-muted-foreground">
                    {tag.category}
                  </span>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {(!tags || tags.length === 0) && (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No tags found yet.</p>
        </Card>
      )}
    </div>
  )
}
