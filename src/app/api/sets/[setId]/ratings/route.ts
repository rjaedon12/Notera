import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/sets/[setId]/ratings — get ratings for a set
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const ratings = await prisma.rating.findMany({ where: { setId } })
    const avg = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
      : 0
    
    // Check if current user has rated
    const session = await auth()
    let userRating = null
    if (session?.user?.id) {
      userRating = await prisma.rating.findUnique({
        where: { userId_setId: { userId: session.user.id, setId } },
      })
    }

    return Response.json({
      average: Math.round(avg * 10) / 10,
      count: ratings.length,
      userRating: userRating?.score ?? null,
    })
  } catch (error) {
    console.error("Get ratings error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/sets/[setId]/ratings — rate a set (1-5)
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
    if (!score || score < 1 || score > 5) {
      return Response.json({ error: "Score must be 1-5" }, { status: 400 })
    }
    const rating = await prisma.rating.upsert({
      where: { userId_setId: { userId: session.user.id, setId } },
      create: { score, userId: session.user.id, setId },
      update: { score },
    })
    return Response.json(rating)
  } catch (error) {
    console.error("Rate set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
