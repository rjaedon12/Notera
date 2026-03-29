import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/sets/public - Get public flashcard sets with sort, pagination, engagement
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const featured = searchParams.get("featured")
    const categoryId = searchParams.get("categoryId")
    const sort = searchParams.get("sort") || "recent"
    const cursor = searchParams.get("cursor")
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || searchParams.get("limit") || "12")))

    const where: Record<string, unknown> = { isPublic: true }

    if (featured === "true") {
      where.isFeatured = true
    }

    if (categoryId) {
      // Support comma-separated category IDs for multi-category filtering
      const ids = categoryId.split(",").filter(Boolean)
      if (ids.length === 1) {
        where.categoryId = ids[0]
      } else if (ids.length > 1) {
        where.categoryId = { in: ids }
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Determine sort order
    type OrderBy = Record<string, unknown>
    let orderBy: OrderBy | OrderBy[]
    switch (sort) {
      case "popular":
        orderBy = { starredBy: { _count: "desc" as const } }
        break
      case "rating":
        orderBy = { ratings: { _count: "desc" as const } }
        break
      case "cards":
        orderBy = { cards: { _count: "desc" as const } }
        break
      default: // "recent"
        orderBy = { createdAt: "desc" as const }
    }

    const sets = await prisma.flashcardSet.findMany({
      where,
      include: {
        _count: { select: { cards: true, starredBy: true, savedBy: true, ratings: true } },
        user: { select: { id: true, name: true } },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy,
      take: pageSize + 1, // fetch one extra to determine if there's a next page
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })

    // Determine next cursor
    let nextCursor: string | null = null
    if (sets.length > pageSize) {
      const nextItem = sets.pop()
      nextCursor = nextItem!.id
    }

    return NextResponse.json({
      sets,
      nextCursor,
    })
  } catch (error) {
    console.error("Get public sets error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

