import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { getNextCard, Rating } from "@/lib/srs"

/**
 * POST /api/srs/review
 *
 * Accept { flashcardId: string, rating: 1 | 2 | 3 | 4 }
 * where 1=Again, 2=Hard, 3=Good, 4=Easy.
 *
 * Fetches the existing UserFlashcardProgress (may be null for new cards),
 * computes the next FSRS state, and upserts the result.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { flashcardId, rating } = body as {
      flashcardId: string
      rating: number
    }

    if (
      !flashcardId ||
      typeof rating !== "number" ||
      ![1, 2, 3, 4].includes(rating)
    ) {
      return Response.json(
        { error: "flashcardId and rating (1-4) are required" },
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

    const userId = session.user.id

    // Fetch existing progress (may be null)
    const existing = await prisma.userFlashcardProgress.findUnique({
      where: {
        userId_flashcardId: { userId, flashcardId },
      },
    })

    // Compute next FSRS state
    const next = getNextCard(existing, rating as Rating)

    // Upsert the progress record
    const updated = await prisma.userFlashcardProgress.upsert({
      where: {
        userId_flashcardId: { userId, flashcardId },
      },
      create: {
        userId,
        flashcardId,
        due: next.due,
        stability: next.stability,
        difficulty: next.difficulty,
        elapsedDays: next.elapsedDays,
        scheduledDays: next.scheduledDays,
        reps: next.reps,
        lapses: next.lapses,
        state: next.state,
        lastReview: next.lastReview,
      },
      update: {
        due: next.due,
        stability: next.stability,
        difficulty: next.difficulty,
        elapsedDays: next.elapsedDays,
        scheduledDays: next.scheduledDays,
        reps: next.reps,
        lapses: next.lapses,
        state: next.state,
        lastReview: next.lastReview,
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("SRS review error:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
