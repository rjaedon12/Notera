import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/sets/public - Get public study sets
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const tagSlug = searchParams.get("tag")

    const where: Record<string, unknown> = { isPublic: true }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ]
    }

    if (tagSlug) {
      where.tags = { some: { tag: { slug: tagSlug } } }
    }

    const sets = await prisma.studySet.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        _count: { select: { cards: true } },
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: [
        { isPremade: "desc" },
        { createdAt: "desc" }
      ],
      take: 50
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
