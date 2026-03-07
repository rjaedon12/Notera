import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/cards/[cardId]/star — star a card
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { cardId } = await params
    await prisma.starredCard.upsert({
      where: { userId_flashcardId: { userId: session.user.id, flashcardId: cardId } },
      create: { userId: session.user.id, flashcardId: cardId },
      update: {},
    })
    return Response.json({ starred: true })
  } catch (error) {
    console.error("Star card error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/cards/[cardId]/star — unstar a card
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { cardId } = await params
    await prisma.starredCard.deleteMany({
      where: { userId: session.user.id, flashcardId: cardId },
    })
    return Response.json({ starred: false })
  } catch (error) {
    console.error("Unstar card error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
