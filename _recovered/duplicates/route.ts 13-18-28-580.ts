import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PATCH /api/cards/[cardId] - Update a card
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { studySet: true }
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    if (card.studySet.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { term, definition, orderIndex } = body

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        ...(term !== undefined && { term }),
        ...(definition !== undefined && { definition }),
        ...(orderIndex !== undefined && { orderIndex })
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update card error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/cards/[cardId] - Delete a card
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: { studySet: true }
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    if (card.studySet.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.card.delete({
      where: { id: cardId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete card error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
