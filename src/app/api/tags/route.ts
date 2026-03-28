import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/tags — aggregate unique tags from all public sets
export async function GET() {
  try {
    const sets = await prisma.flashcardSet.findMany({
      where: { isPublic: true },
      select: { tags: true },
    })

    // Aggregate all tags and count occurrences
    const tagCounts = new Map<string, number>()
    for (const set of sets) {
      for (const tag of set.tags) {
        const normalized = tag.trim().toLowerCase()
        if (normalized) {
          tagCounts.set(normalized, (tagCounts.get(normalized) || 0) + 1)
        }
      }
    }

    // Convert to array sorted by frequency
    const tags = Array.from(tagCounts.entries())
      .map(([name, count]) => ({
        name,
        slug: name.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        count,
      }))
      .sort((a, b) => b.count - a.count)

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Failed to fetch tags:", error)
    return NextResponse.json([], { status: 200 })
  }
}
