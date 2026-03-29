import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getTagDef } from "@/data/tags"

// GET /api/tags/:slug — find all public sets with this tag
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const tagDef = getTagDef(slug)

    // Search for sets where the tags array contains the slug
    const sets = await prisma.flashcardSet.findMany({
      where: {
        isPublic: true,
        tags: { has: slug },
      },
      include: {
        user: { select: { id: true, name: true } },
        _count: { select: { cards: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tag: tagDef.label, slug, sets })
  } catch (error) {
    console.error("Failed to fetch tag:", error)
    return NextResponse.json({ tag: "", slug: "", sets: [] })
  }
}
