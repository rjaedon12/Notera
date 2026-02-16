import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { calculateMastery } from "@/lib/utils"

/**
 * SM-2 Lite algorithm for spaced repetition
 * Based on SuperMemo 2 algorithm
 * 
 * @param easeFactor - Current ease factor (default 2.5)
 * @param interval - Current interval in days (0 for new)
 * @param quality - Quality of response (0-5)
 *   0 - Complete blackout
 *   1 - Incorrect, but upon seeing correct answer, remembered
 *   2 - Incorrect, but correct answer seemed easy to recall
 *   3 - Correct with serious difficulty
 *   4 - Correct with hesitation
 *   5 - Perfect response
 * 
 * @returns { newInterval, newEaseFactor, nextReviewAt }
 */
function sm2(
  easeFactor: number,
  interval: number,
  quality: number
): { newInterval: number; newEaseFactor: number; nextReviewAt: Date } {
  // Clamp quality to 0-5
  quality = Math.max(0, Math.min(5, quality))
  
  let newInterval: number
  let newEaseFactor: number

  // If quality < 3, restart the learning process
  if (quality < 3) {
    newInterval = 1 // Review again tomorrow
    newEaseFactor = Math.max(1.3, easeFactor - 0.2) // Decrease ease factor (min 1.3)
  } else {
    // Calculate new interval
    if (interval === 0) {
      newInterval = 1 // First review: 1 day
    } else if (interval === 1) {
      newInterval = 6 // Second review: 6 days
    } else {
      newInterval = Math.round(interval * easeFactor)
    }
    
    // Update ease factor: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    const easeDelta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)
    newEaseFactor = Math.max(1.3, easeFactor + easeDelta)
  }

  // Calculate next review date
  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)

  return { newInterval, newEaseFactor, nextReviewAt }
}

// Convert boolean correct to SM-2 quality (simple version)
function correctToQuality(correct: boolean, streak: number): number {
  if (!correct) {
    return 1 // Incorrect but recognized
  }
  // Correct responses get quality 3-5 based on streak
  if (streak >= 3) return 5 // Perfect (mastered)
  if (streak >= 1) return 4 // Good
  return 3 // Correct with difficulty
}

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

      // Calculate SM-2 values
      const quality = correctToQuality(correct, newStreak)
      const { newInterval, newEaseFactor, nextReviewAt } = sm2(
        progress.easeFactor ?? 2.5,
        progress.interval ?? 0,
        quality
      )

      progress = await prisma.progress.update({
        where: { id: progress.id },
        data: {
          correctCount: newCorrect,
          incorrectCount: newIncorrect,
          streak: newStreak,
          masteryLevel: newMastery,
          lastReviewedAt: new Date(),
          easeFactor: newEaseFactor,
          interval: newInterval,
          nextReviewAt
        }
      })
    } else {
      // Create new progress record
      const quality = correctToQuality(correct, correct ? 1 : 0)
      const { newInterval, newEaseFactor, nextReviewAt } = sm2(2.5, 0, quality)

      progress = await prisma.progress.create({
        data: {
          userId: session.user.id,
          cardId,
          correctCount: correct ? 1 : 0,
          incorrectCount: correct ? 0 : 1,
          streak: correct ? 1 : 0,
          masteryLevel: correct ? 1 : 0,
          lastReviewedAt: new Date(),
          easeFactor: newEaseFactor,
          interval: newInterval,
          nextReviewAt
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
