import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { updateStreak } from "@/lib/update-streak"

// Maps frontend mode strings to Prisma StudyMode enum values
const MODE_MAP: Record<string, string> = {
  learn: "LEARN",
  test: "TEST",
  flashcard: "FLASHCARD",
  flashcards: "FLASHCARD",
  match: "MATCH",
  timed: "TIMED",
  blast: "TIMED",
}

// POST /api/sessions — record a completed study session
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId, mode, stats } = await request.json()

    if (!setId || !mode) {
      return Response.json({ error: "setId and mode are required" }, { status: 400 })
    }

    const studyMode = MODE_MAP[mode.toLowerCase()]
    if (!studyMode) {
      return Response.json({ error: `Invalid mode: ${mode}` }, { status: 400 })
    }

    // Verify set exists
    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })
    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }

    const totalCards: number = (stats?.totalCards as number) ?? 0
    const correctAnswers: number = (stats?.correctAnswers as number) ?? 0
    const accuracy: number =
      (stats?.accuracy as number) ??
      (totalCards > 0 ? Math.round((correctAnswers / totalCards) * 100) : 0)

    // Upsert StudyProgress for this user+set+mode
    const progress = await prisma.studyProgress.upsert({
      where: {
        userId_setId_mode: {
          userId: session.user.id,
          setId,
          mode: studyMode as "LEARN" | "TEST" | "FLASHCARD" | "MATCH" | "TIMED",
        },
      },
      update: {
        lastStudied: new Date(),
        totalCards,
        masteredCount: correctAnswers,
        score: accuracy,
      },
      create: {
        userId: session.user.id,
        setId,
        mode: studyMode as "LEARN" | "TEST" | "FLASHCARD" | "MATCH" | "TIMED",
        totalCards,
        masteredCount: correctAnswers,
        score: accuracy,
      },
    })

    const streakResult = await updateStreak(session.user.id, studyMode)

    return Response.json({ ...progress, streak: streakResult.streak })
  } catch (error) {
    console.error("Save session error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/sessions — return user's session history
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessions = await prisma.studyProgress.findMany({
      where: { userId: session.user.id },
      include: {
        set: { select: { id: true, title: true } },
      },
      orderBy: { lastStudied: "desc" },
    })

    return Response.json(sessions)
  } catch (error) {
    console.error("Get sessions error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
