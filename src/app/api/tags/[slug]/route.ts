import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/tags/:slug — find all public sets with this tag
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const tagName = slug.replace(/-/g, " ")

    // Search for sets where the tags array contains the tag (case-insensitive match)
    const sets = await prisma.flashcardSet.findMany({
      where: {
        isPublic: true,
        tags: { has: tagName },
      },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { cards: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tag: tagName, slug, sets })
  } catch (error) {
    console.error("Failed to fetch tag:", error)
    return NextResponse.json({ tag: "", slug: "", sets: [] })
  }
}
