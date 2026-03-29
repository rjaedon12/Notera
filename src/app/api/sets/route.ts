import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

// GET /api/sets — get user's own sets, optionally with search and cards
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const includeCards = searchParams.get("includeCards") === "true"
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100)
    const scope = searchParams.get("scope") || "library"

    // scope=library (default): user's own sets + sets they have studied
    // scope=browse: user's own sets + all public sets (for homework builder, search, etc.)
    const where = scope === "browse"
      ? {
          OR: [
            { userId: session.user.id },
            { isPublic: true },
          ],
          ...(search
            ? { title: { contains: search, mode: "insensitive" as const } }
            : {}),
        }
      : {
          OR: [
            { userId: session.user.id },
            { progress: { some: { userId: session.user.id } } },
          ],
          ...(search
            ? { title: { contains: search, mode: "insensitive" as const } }
            : {}),
        }

    const sets = await prisma.flashcardSet.findMany({
      where,
      include: {
        _count: { select: { cards: true } },
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
        ...(includeCards
          ? { cards: { orderBy: { order: "asc" as const }, select: { id: true, term: true, definition: true } } }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
      take: limit,
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

    const { title, description, isPublic, categoryId, cards } = await request.json()

    if (!title) {
      return Response.json({ error: "Title is required" }, { status: 400 })
    }

    const set = await prisma.flashcardSet.create({
      data: {
        title,
        description: description || null,
        isPublic: isPublic ?? false,
        categoryId: categoryId || null,
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
