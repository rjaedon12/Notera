import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/sets/[setId]/progress - Get card-level progress for a set
export async function GET(
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
      include: { cards: true },
    })

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    const cardIds = set.cards.map((c: { id: string }) => c.id)

    const progressRecords = await prisma.cardProgress.findMany({
      where: {
        userId: session.user.id,
        flashcardId: { in: cardIds },
      },
    })

    // Return as a map of flashcardId -> progress
    const progressMap: Record<string, typeof progressRecords[0]> = {}
    progressRecords.forEach((p) => {
      progressMap[p.flashcardId] = p
    })

    return NextResponse.json(progressMap)
  } catch (error) {
    console.error("Get progress error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

