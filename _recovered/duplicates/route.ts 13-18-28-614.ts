import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/sets/[setId]/timed-scores - Get timed scores for a set
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    // Get top scores
    const topScores = await prisma.timedScore.findMany({
      where: { setId },
      orderBy: { score: "desc" },
      take: 10
    })

    // Get user's best score if authenticated
    let userBest = null
    if (session?.user?.id) {
      userBest = await prisma.timedScore.findFirst({
        where: {
          setId,
          userId: session.user.id
        },
        orderBy: { score: "desc" }
      })
    }

    return NextResponse.json({ topScores, userBest })
  } catch (error) {
    console.error("Get timed scores error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/sets/[setId]/timed-scores - Save a timed score
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { score, mode } = body

    if (typeof score !== "number" || score < 0) {
      return NextResponse.json(
        { error: "Invalid score value" },
        { status: 400 }
      )
    }

    const timedScore = await prisma.timedScore.create({
      data: {
        score,
        mode: mode || "blast",
        setId,
        userId: session.user.id
      }
    })

    return NextResponse.json(timedScore, { status: 201 })
  } catch (error) {
    console.error("Save timed score error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
