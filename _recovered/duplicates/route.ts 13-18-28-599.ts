import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/sessions - Get study sessions for the user
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sessions = await prisma.studySession.findMany({
      where: { userId: session.user.id },
      include: {
        studySet: {
          select: { id: true, title: true }
        }
      },
      orderBy: { startedAt: "desc" },
      take: 50
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Get sessions error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// Helper function to get yesterday's date in YYYY-MM-DD format
function getYesterdayDate(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

// POST /api/sessions - Create a study session
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { setId, mode, stats } = body

    if (!setId || !mode) {
      return NextResponse.json(
        { error: "setId and mode are required" },
        { status: 400 }
      )
    }

    const studySession = await prisma.studySession.create({
      data: {
        userId: session.user.id,
        setId,
        mode,
        stats: JSON.stringify(stats || {}),
        endedAt: new Date()
      }
    })

    // Update streak
    const today = getTodayDate()
    const yesterday = getYesterdayDate()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastStudyDate: true
      }
    })

    if (user) {
      const lastStudy = user.lastStudyDate 
        ? user.lastStudyDate.toISOString().split('T')[0]
        : null

      // Only update if not already studied today
      if (lastStudy !== today) {
        let newStreak = 1
        
        if (lastStudy === yesterday) {
          newStreak = user.currentStreak + 1
        }

        const newLongestStreak = Math.max(newStreak, user.longestStreak)

        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
            lastStudyDate: new Date()
          }
        })

        // Record in StudyDay table
        await prisma.studyDay.upsert({
          where: {
            userId_date: {
              userId: session.user.id,
              date: today
            }
          },
          update: {},
          create: {
            userId: session.user.id,
            date: today
          }
        })
      }
    }

    return NextResponse.json(studySession, { status: 201 })
  } catch (error) {
    console.error("Create session error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
