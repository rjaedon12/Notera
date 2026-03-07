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

// POST /api/sets/[setId]/timed-scores — save a timed (blast) game completion
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
    const { score } = await request.json()

    if (typeof score !== "number") {
      return Response.json({ error: "score (number) is required" }, { status: 400 })
    }

    const set = await prisma.flashcardSet.findUnique({
      where: { id: setId },
      include: { _count: { select: { cards: true } } },
    })
    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }

    // Keep the highest score (higher = better for timed mode)
    const existing = await prisma.studyProgress.findUnique({
      where: {
        userId_setId_mode: {
          userId: session.user.id,
          setId,
          mode: "TIMED",
        },
      },
    })

    const isBetter = !existing || existing.score === null || score > existing.score

    const progress = await prisma.studyProgress.upsert({
      where: {
        userId_setId_mode: {
          userId: session.user.id,
          setId,
          mode: "TIMED",
        },
      },
      update: {
        lastStudied: new Date(),
        totalCards: set._count.cards,
        ...(isBetter && { score }),
      },
      create: {
        userId: session.user.id,
        setId,
        mode: "TIMED",
        score,
        totalCards: set._count.cards,
        masteredCount: 0,
      },
    })

    const streak = await applyStreak(session.user.id)

    return Response.json({
      ...progress,
      streak,
      highScore: isBetter ? score : existing?.score,
      isPersonalBest: isBetter,
    })
  } catch (error) {
    console.error("Save timed score error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/sets/[setId]/timed-scores — return top scores for this set
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
      where: { setId, mode: "TIMED", score: { not: null } },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
      orderBy: { score: "desc" }, // higher score = better
      take: 10,
    })

    return Response.json(
      scores.map((s) => ({
        userId: s.userId,
        userName: s.user.name,
        userImage: s.user.image,
        score: s.score,
        date: s.lastStudied,
      }))
    )
  } catch (error) {
    console.error("Get timed scores error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
