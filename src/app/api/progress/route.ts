import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { updateStreak } from "@/lib/update-streak"

// GET /api/progress — get user's progress across all sets
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const progress = await prisma.studyProgress.findMany({
      where: { userId: session.user.id },
      include: {
        set: {
          select: {
            id: true,
            title: true,
            _count: { select: { cards: true } },
          },
        },
      },
      orderBy: { lastStudied: "desc" },
    })

    return Response.json(progress)
  } catch (error) {
    console.error("Get progress error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/progress — upsert StudyProgress for a set+mode, update streak
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId, mode, masteredCount, totalCards, score } =
      await request.json()

    if (!setId || !mode) {
      return Response.json(
        { error: "setId and mode are required" },
        { status: 400 }
      )
    }

    // Verify set exists
    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })
    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }

    // Upsert study progress
    const progress = await prisma.studyProgress.upsert({
      where: {
        userId_setId_mode: {
          userId: session.user.id,
          setId,
          mode,
        },
      },
      update: {
        lastStudied: new Date(),
        ...(masteredCount !== undefined && { masteredCount }),
        ...(totalCards !== undefined && { totalCards }),
        ...(score !== undefined && { score }),
      },
      create: {
        userId: session.user.id,
        setId,
        mode,
        masteredCount: masteredCount ?? 0,
        totalCards: totalCards ?? 0,
        score: score ?? null,
      },
    })

    // ─── Streak + session tracking via shared utility ────────
    const streakResult = await updateStreak(session.user.id, "FLASHCARD")

    return Response.json({ ...progress, streak: streakResult.streak })
  } catch (error) {
    console.error("Update progress error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
