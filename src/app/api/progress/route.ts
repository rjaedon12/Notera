import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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

    // ─── Streak logic ────────────────────────────────────────
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { streak: true, lastStudied: true },
    })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let newStreak = 1

    if (user?.lastStudied) {
      const lastDate = new Date(user.lastStudied)
      const lastDay = new Date(
        lastDate.getFullYear(),
        lastDate.getMonth(),
        lastDate.getDate()
      )

      const diffMs = today.getTime() - lastDay.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        // Studied today already — keep streak
        newStreak = user.streak
      } else if (diffDays === 1) {
        // Last studied yesterday — increment streak
        newStreak = user.streak + 1
      } else {
        // 2+ days gap — reset streak to 1
        newStreak = 1
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        streak: newStreak,
        lastStudied: now,
      },
    })

    return Response.json({ ...progress, streak: newStreak })
  } catch (error) {
    console.error("Update progress error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
