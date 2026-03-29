import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { PREDEFINED_TAGS } from "@/data/tags"

// GET /api/tags — return predefined tags enriched with set counts
export async function GET() {
  try {
    const sets = await prisma.flashcardSet.findMany({
      where: { isPublic: true },
      select: { tags: true },
    })

    // Count occurrences of each tag
    const tagCounts = new Map<string, number>()
    for (const set of sets) {
      for (const tag of set.tags) {
        const normalized = tag.trim().toLowerCase()
        if (normalized) {
          tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1)
        }
      }
    }

    // Build response from predefined tags with counts
    const tags = PREDEFINED_TAGS.map((t) => ({
      name: t.label,
      slug: t.slug,
      count: tagCounts.get(t.slug) || 0,
      color: t.color,
      description: t.description,
    })).sort((a, b) => b.count - a.count)

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Failed to fetch tags:", error)
    return NextResponse.json([], { status: 200 })
  }
}
