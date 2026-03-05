import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/sets/[id] — get set with cards (check public or owner)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params

    const set = await prisma.flashcardSet.findUnique({
      where: { id: setId },
      include: {
        cards: { orderBy: { order: "asc" } },
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { cards: true } },
      },
    })

    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }

    const session = await auth()
    if (!set.isPublic && set.userId !== session?.user?.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    return Response.json(set)
  } catch (error) {
    console.error("Get set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/sets/[id] — update set title/description/tags/isPublic (owner only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId } = await params
    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })

    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }
    if (set.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const { title, description, tags, isPublic } = await request.json()

    const updated = await prisma.flashcardSet.update({
      where: { id: setId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tags !== undefined && { tags }),
        ...(isPublic !== undefined && { isPublic }),
      },
      include: {
        cards: { orderBy: { order: "asc" } },
        _count: { select: { cards: true } },
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Update set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/sets/[id] — delete set (owner only)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId } = await params
    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })

    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }
    if (set.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.flashcardSet.delete({ where: { id: setId } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
