import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/sets/public - Get public flashcard sets
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const featured = searchParams.get("featured")
    const categoryId = searchParams.get("categoryId")
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "50")))

    const where: Record<string, unknown> = { isPublic: true }

    if (featured === "true") {
      where.isFeatured = true
    }

    if (categoryId) {
      where.categoryId = categoryId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    const sets = await prisma.flashcardSet.findMany({
      where,
      include: {
        _count: { select: { cards: true } },
        user: { select: { id: true, name: true } },
        category: {
          include: {
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json(sets)
  } catch (error) {
    console.error("Get public sets error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

