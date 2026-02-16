import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/sets/[setId]/match-scores - Get match scores for a set
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    // Get top scores (global leaderboard for public sets)
    const topScores = await prisma.matchScore.findMany({
      where: { setId },
      orderBy: { time: "asc" },
      take: 10
    })

    // Get user's best score if authenticated
    let userBest = null
    if (session?.user?.id) {
      userBest = await prisma.matchScore.findFirst({
        where: {
          setId,
          userId: session.user.id
        },
        orderBy: { time: "asc" }
      })
    }

    return NextResponse.json({ topScores, userBest })
  } catch (error) {
    console.error("Get match scores error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/sets/[setId]/match-scores - Save a match score
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
    const { time } = body

    if (typeof time !== "number" || time < 0) {
      return NextResponse.json(
        { error: "Invalid time value" },
        { status: 400 }
      )
    }

    const score = await prisma.matchScore.create({
      data: {
        time,
        setId,
        userId: session.user.id
      }
    })

    return NextResponse.json(score, { status: 201 })
  } catch (error) {
    console.error("Save match score error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
