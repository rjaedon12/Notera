import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/sets/[id]/cards — add card to set
export async function POST(
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

    const { term, definition } = await request.json()

    if (!term || !definition) {
      return Response.json(
        { error: "Term and definition are required" },
        { status: 400 }
      )
    }

    // Determine next order value
    const maxOrder = await prisma.flashcard.aggregate({
      where: { setId },
      _max: { order: true },
    })

    const card = await prisma.flashcard.create({
      data: {
        term,
        definition,
        order: (maxOrder._max.order ?? -1) + 1,
        setId,
      },
    })

    return Response.json(card, { status: 201 })
  } catch (error) {
    console.error("Add card error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
