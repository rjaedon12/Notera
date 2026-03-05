import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/sets/public - Get public flashcard sets
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")

    const where: Record<string, unknown> = { isPublic: true }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const sets = await prisma.flashcardSet.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { cards: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
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

