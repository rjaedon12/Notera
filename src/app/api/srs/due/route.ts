import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

interface DueCardResponse {
  flashcard: { id: string; front: string; back: string }
  progress: {
    id: string
    userId: string
    flashcardId: string
    due: Date
    stability: number
    difficulty: number
    elapsedDays: number
    scheduledDays: number
    reps: number
    lapses: number
    state: number
    lastReview: Date | null
  } | null
}

/**
 * GET /api/srs/due?setId=<id>
 *
 * Returns up to 20 cards due for review for the authenticated user
 * within a given flashcard set. Includes cards where due <= now (review)
 * plus cards with no progress row yet (new), ordered by due ascending.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const setId = request.nextUrl.searchParams.get("setId")
    if (!setId) {
      return Response.json(
        { error: "setId query parameter is required" },
        { status: 400 }
      )
    }

    const userId = session.user.id
    const now = new Date()
    const forceAll = request.nextUrl.searchParams.get("forceAll") === "true"

    // If forceAll, return ALL cards in the set (for restart after mastery)
    if (forceAll) {
      const allFlashcards = await prisma.flashcard.findMany({
        where: { setId },
        select: { id: true, term: true, definition: true },
        orderBy: { order: "asc" },
      })

      const progressRows = await prisma.userFlashcardProgress.findMany({
        where: { userId, flashcard: { setId } },
      })
      const progressMap = new Map(progressRows.map((p) => [p.flashcardId, p]))

      const cards: DueCardResponse[] = allFlashcards.map((card) => {
        const p = progressMap.get(card.id)
        return {
          flashcard: { id: card.id, front: card.term, back: card.definition },
          progress: p
            ? {
                id: p.id,
                userId: p.userId,
                flashcardId: p.flashcardId,
                due: p.due,
                stability: p.stability,
                difficulty: p.difficulty,
                elapsedDays: p.elapsedDays,
                scheduledDays: p.scheduledDays,
                reps: p.reps,
                lapses: p.lapses,
                state: p.state,
                lastReview: p.lastReview,
              }
            : null,
        }
      })

      return Response.json({ cards })
    }

    // 1. Cards that have progress and are due for review (due <= now)
    const dueProgress = await prisma.userFlashcardProgress.findMany({
      where: {
        userId,
        due: { lte: now },
        flashcard: { setId },
      },
      include: {
        flashcard: {
          select: { id: true, term: true, definition: true },
        },
      },
      orderBy: { due: "asc" },
      take: 20,
    })

    const dueCards: DueCardResponse[] = dueProgress.map((p) => ({
      flashcard: {
        id: p.flashcard.id,
        front: p.flashcard.term,
        back: p.flashcard.definition,
      },
      progress: {
        id: p.id,
        userId: p.userId,
        flashcardId: p.flashcardId,
        due: p.due,
        stability: p.stability,
        difficulty: p.difficulty,
        elapsedDays: p.elapsedDays,
        scheduledDays: p.scheduledDays,
        reps: p.reps,
        lapses: p.lapses,
        state: p.state,
        lastReview: p.lastReview,
      },
    }))

    // 2. Fill remaining slots with new cards (no progress row yet)
    const remaining = 20 - dueCards.length
    if (remaining > 0) {
      const existingFlashcardIds = dueProgress.map((p) => p.flashcardId)

      const newFlashcards = await prisma.flashcard.findMany({
        where: {
          setId,
          id: { notIn: existingFlashcardIds },
          fsrsProgress: {
            none: { userId },
          },
        },
        select: { id: true, term: true, definition: true },
        orderBy: { order: "asc" },
        take: remaining,
      })

      for (const card of newFlashcards) {
        dueCards.push({
          flashcard: {
            id: card.id,
            front: card.term,
            back: card.definition,
          },
          progress: null,
        })
      }
    }

    return Response.json({ cards: dueCards })
  } catch (error) {
    console.error("SRS due error:", error)
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
