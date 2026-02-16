import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { calculateMastery } from "@/lib/utils"

// POST /api/progress - Update progress for a card
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { cardId, correct } = body

    if (!cardId || typeof correct !== "boolean") {
      return NextResponse.json(
        { error: "cardId and correct are required" },
        { status: 400 }
      )
    }

    // Get or create progress record
    let progress = await prisma.progress.findUnique({
      where: {
        userId_cardId: {
          userId: session.user.id,
          cardId
        }
      }
    })

    if (progress) {
      // Update existing progress
      const newCorrect = correct ? progress.correctCount + 1 : progress.correctCount
      const newIncorrect = correct ? progress.incorrectCount : progress.incorrectCount + 1
      const newStreak = correct ? progress.streak + 1 : 0
      const newMastery = calculateMastery(newCorrect, newIncorrect)

      progress = await prisma.progress.update({
        where: { id: progress.id },
        data: {
          correctCount: newCorrect,
          incorrectCount: newIncorrect,
          streak: newStreak,
          masteryLevel: newMastery,
          lastReviewedAt: new Date()
        }
      })
    } else {
      // Create new progress record
      progress = await prisma.progress.create({
        data: {
          userId: session.user.id,
          cardId,
          correctCount: correct ? 1 : 0,
          incorrectCount: correct ? 0 : 1,
          streak: correct ? 1 : 0,
          masteryLevel: correct ? 1 : 0,
          lastReviewedAt: new Date()
        }
      })
    }

    return NextResponse.json(progress)
  } catch (error) {
    console.error("Update progress error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
