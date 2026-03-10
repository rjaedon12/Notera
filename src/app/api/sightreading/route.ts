import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { updateStreak } from "@/lib/update-streak"

// POST /api/sightreading — save a sightreading round result
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { clef, level, correct, total } = await request.json()

    if (!clef || !level || typeof correct !== "number" || typeof total !== "number") {
      return NextResponse.json(
        { error: "clef, level, correct, and total are required" },
        { status: 400 }
      )
    }

    // Save the attempt
    const attempt = await prisma.sightreadingAttempt.create({
      data: {
        userId: session.user.id,
        clef,
        level,
        correct,
        total,
      },
    })

    // Update streak + create study session
    const streakResult = await updateStreak(session.user.id, "SIGHTREADING")

    return NextResponse.json({
      ...attempt,
      streak: streakResult.streak,
    })
  } catch (error) {
    console.error("Save sightreading error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/sightreading — get user's sightreading history
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const attempts = await prisma.sightreadingAttempt.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error("Get sightreading error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
