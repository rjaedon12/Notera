import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/progress/card — update CardProgress (correct/incorrect answer)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { flashcardId, correct } = await request.json()

    if (!flashcardId || typeof correct !== "boolean") {
      return Response.json(
        { error: "flashcardId and correct (boolean) are required" },
        { status: 400 }
      )
    }

    // Verify flashcard exists
    const flashcard = await prisma.flashcard.findUnique({
      where: { id: flashcardId },
    })
    if (!flashcard) {
      return Response.json({ error: "Flashcard not found" }, { status: 404 })
    }

    const existing = await prisma.cardProgress.findUnique({
      where: {
        userId_flashcardId: {
          userId: session.user.id,
          flashcardId,
        },
      },
    })

    const newCorrect = (existing?.correctCount ?? 0) + (correct ? 1 : 0)
    const newIncorrect = (existing?.incorrectCount ?? 0) + (correct ? 0 : 1)

    // Determine status based on performance
    let status: "NEW" | "LEARNING" | "MASTERED" = "NEW"
    if (newCorrect >= 3) {
      status = "MASTERED"
    } else if (newCorrect >= 1 || newIncorrect >= 1) {
      status = "LEARNING"
    }

    const cardProgress = await prisma.cardProgress.upsert({
      where: {
        userId_flashcardId: {
          userId: session.user.id,
          flashcardId,
        },
      },
      update: {
        correctCount: newCorrect,
        incorrectCount: newIncorrect,
        status,
        lastSeen: new Date(),
      },
      create: {
        userId: session.user.id,
        flashcardId,
        correctCount: correct ? 1 : 0,
        incorrectCount: correct ? 0 : 1,
        status,
      },
    })

    return Response.json(cardProgress)
  } catch (error) {
    console.error("Card progress error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
