import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

async function applyStreak(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, lastStudied: true },
  })
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let newStreak = 1
  if (user?.lastStudied) {
    const lastDate = new Date(user.lastStudied)
    const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())
    const diffDays = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) newStreak = user.streak
    else if (diffDays === 1) newStreak = user.streak + 1
  }
  await prisma.user.update({
    where: { id: userId },
    data: { streak: newStreak, lastStudied: now },
  })
  return newStreak
}

// POST /api/sets/[setId]/match-scores — save a match game completion
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId } = await params
    const { time } = await request.json()

    if (typeof time !== "number") {
      return Response.json({ error: "time (number) is required" }, { status: 400 })
    }

    const set = await prisma.flashcardSet.findUnique({
      where: { id: setId },
      include: { _count: { select: { cards: true } } },
    })
    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }

    // Check if user already has a match score for this set (keep the best/lowest time)
    const existing = await prisma.studyProgress.findUnique({
      where: {
        userId_setId_mode: {
          userId: session.user.id,
          setId,
          mode: "MATCH",
        },
      },
    })

    const isBetter = !existing || existing.score === null || time < existing.score

    const progress = await prisma.studyProgress.upsert({
      where: {
        userId_setId_mode: {
          userId: session.user.id,
          setId,
          mode: "MATCH",
        },
      },
      update: {
        lastStudied: new Date(),
        totalCards: set._count.cards,
        // Only update score (best time) if this run was faster
        ...(isBetter && { score: time }),
      },
      create: {
        userId: session.user.id,
        setId,
        mode: "MATCH",
        score: time,
        totalCards: set._count.cards,
        masteredCount: set._count.cards, // matched all pairs = mastered
      },
    })

    const streak = await applyStreak(session.user.id)

    return Response.json({
      ...progress,
      streak,
      bestTime: isBetter ? time : existing?.score,
      isPersonalBest: isBetter,
    })
  } catch (error) {
    console.error("Save match score error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/sets/[setId]/match-scores — return top scores for this set
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId } = await params

    const scores = await prisma.studyProgress.findMany({
      where: { setId, mode: "MATCH", score: { not: null } },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { score: "asc" }, // lower time = better
      take: 10,
    })

    return Response.json(
      scores.map((s) => ({
        userId: s.userId,
        userName: s.user.name,
        userImage: s.user.image,
        time: s.score,
        date: s.lastStudied,
      }))
    )
  } catch (error) {
    console.error("Get match scores error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
