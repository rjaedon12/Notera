import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

/**
 * SM-2 Spaced Repetition Algorithm
 * quality: 0-5 (0-2 = incorrect/hard, 3 = correct/hard, 4 = correct, 5 = perfect)
 */
function sm2(easeFactor: number, interval: number, quality: number) {
  let newEF = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (newEF < 1.3) newEF = 1.3

  let newInterval: number
  if (quality < 3) {
    // Failed — reset
    newInterval = 1
  } else if (interval === 0) {
    newInterval = 1
  } else if (interval === 1) {
    newInterval = 6
  } else {
    newInterval = Math.round(interval * newEF)
  }

  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)

  return { easeFactor: newEF, interval: newInterval, nextReviewAt }
}

// POST /api/review — submit a card review with SM-2
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { cardId, quality } = await request.json()
    if (!cardId || quality === undefined || quality < 0 || quality > 5) {
      return Response.json({ error: "cardId and quality (0-5) are required" }, { status: 400 })
    }

    const userId = session.user.id

    // Get or create card progress
    let progress = await prisma.cardProgress.findUnique({
      where: { userId_flashcardId: { userId, flashcardId: cardId } },
    })

    const correct = quality >= 3
    const currentEF = progress?.easeFactor ?? 2.5
    const currentInterval = progress?.interval ?? 0
    const { easeFactor, interval, nextReviewAt } = sm2(currentEF, currentInterval, quality)

    let newStatus: "NEW" | "LEARNING" | "MASTERED" = "LEARNING"
    const correctCount = (progress?.correctCount ?? 0) + (correct ? 1 : 0)
    const incorrectCount = (progress?.incorrectCount ?? 0) + (correct ? 0 : 1)
    
    if (interval >= 21 && correctCount >= 5) {
      newStatus = "MASTERED"
    } else if (correctCount === 0 && incorrectCount === 0) {
      newStatus = "NEW"
    }

    progress = await prisma.cardProgress.upsert({
      where: { userId_flashcardId: { userId, flashcardId: cardId } },
      create: {
        userId,
        flashcardId: cardId,
        status: newStatus,
        correctCount: correct ? 1 : 0,
        incorrectCount: correct ? 0 : 1,
        easeFactor,
        interval,
        nextReviewAt,
        lastSeen: new Date(),
      },
      update: {
        status: newStatus,
        correctCount,
        incorrectCount,
        easeFactor,
        interval,
        nextReviewAt,
        lastSeen: new Date(),
      },
    })

    return Response.json(progress)
  } catch (error) {
    console.error("Review error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
