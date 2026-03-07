import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/daily-review — get cards due for spaced-repetition review
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const now = new Date()

    // Cards due for review (nextReviewAt <= now, or new cards that haven't been reviewed)
    const dueCards = await prisma.cardProgress.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { nextReviewAt: { lte: now } },
          { nextReviewAt: null, status: { not: "MASTERED" } },
        ],
      },
      include: {
        flashcard: {
          include: { set: { select: { id: true, title: true } } },
        },
      },
      orderBy: { nextReviewAt: "asc" },
      take: 30,
    })

    // Also include cards with no progress at all (truly new)
    const existingCardIds = dueCards.map((c) => c.flashcardId)
    const newCards = await prisma.flashcard.findMany({
      where: {
        set: { userId: session.user.id },
        id: { notIn: existingCardIds },
        cardProgress: { none: { userId: session.user.id } },
      },
      include: { set: { select: { id: true, title: true } } },
      take: Math.max(0, 30 - dueCards.length),
    })

    return Response.json({
      dueCards: dueCards.map((cp) => ({
        ...cp.flashcard,
        progress: {
          id: cp.id,
          status: cp.status,
          correctCount: cp.correctCount,
          incorrectCount: cp.incorrectCount,
          easeFactor: cp.easeFactor,
          interval: cp.interval,
          nextReviewAt: cp.nextReviewAt,
        },
      })),
      newCards: newCards.map((c) => ({
        ...c,
        progress: null,
      })),
      totalDue: dueCards.length + newCards.length,
    })
  } catch (error) {
    console.error("Daily review error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
