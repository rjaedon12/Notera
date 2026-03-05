import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/sets/[setId]/reorder - Reorder cards
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const set = await prisma.flashcardSet.findUnique({
      where: { id: setId },
    })

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    if (set.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { cardIds } = body

    if (!Array.isArray(cardIds)) {
      return NextResponse.json(
        { error: "cardIds must be an array" },
        { status: 400 }
      )
    }

    // Update each card's order
    await Promise.all(
      cardIds.map((cardId: string, index: number) =>
        prisma.flashcard.update({
          where: { id: cardId },
          data: { order: index },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder cards error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
