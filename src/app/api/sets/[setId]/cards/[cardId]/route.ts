import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PUT /api/sets/[id]/cards/[cardId] — update card term/definition
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string; cardId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId, cardId } = await params

    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })
    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }
    if (set.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const card = await prisma.flashcard.findFirst({
      where: { id: cardId, setId },
    })
    if (!card) {
      return Response.json({ error: "Card not found" }, { status: 404 })
    }

    const { term, definition } = await request.json()

    const updated = await prisma.flashcard.update({
      where: { id: cardId },
      data: {
        ...(term !== undefined && { term }),
        ...(definition !== undefined && { definition }),
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Update card error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/sets/[id]/cards/[cardId] — delete card
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string; cardId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId, cardId } = await params

    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })
    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }
    if (set.userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const card = await prisma.flashcard.findFirst({
      where: { id: cardId, setId },
    })
    if (!card) {
      return Response.json({ error: "Card not found" }, { status: 404 })
    }

    await prisma.flashcard.delete({ where: { id: cardId } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete card error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
