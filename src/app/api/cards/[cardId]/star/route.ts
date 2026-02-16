import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/cards/[cardId]/star - Star a card
export async function POST(
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
      where: { id: cardId }
    })

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 })
    }

    // Check if already starred
    const existing = await prisma.starredCard.findUnique({
      where: {
        userId_cardId: {
          userId: session.user.id,
          cardId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ message: "Already starred" })
    }

    await prisma.starredCard.create({
      data: {
        userId: session.user.id,
        cardId
      }
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Star card error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/cards/[cardId]/star - Unstar a card
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

    await prisma.starredCard.deleteMany({
      where: {
        userId: session.user.id,
        cardId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unstar card error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
