import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

// GET /api/sets — get all public sets + user's own sets (with card count)
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sets = await prisma.flashcardSet.findMany({
      where: {
        OR: [
          { isPublic: true },
          { userId: session.user.id },
        ],
      },
      include: {
        _count: { select: { cards: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return Response.json(sets)
  } catch (error) {
    console.error("Get sets error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/sets — create new set with cards array [{term, definition}]
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, description, isPublic, tags, cards } = await request.json()

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 })
    }

    const set = await prisma.flashcardSet.create({
      data: {
        title,
        description: description || null,
        isPublic: isPublic ?? false,
        tags: tags || [],
        userId: session.user.id,
        cards: {
          create: (cards || []).map(
            (card: { term: string; definition: string }, index: number) => ({
              term: card.term,
              definition: card.definition,
              order: index,
            })
          ),
        },
      },
      include: {
        cards: { orderBy: { order: "asc" } },
        _count: { select: { cards: true } },
      },
    })

    return Response.json(set, { status: 201 })
  } catch (error) {
    console.error("Create set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
