import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { resolveSessionUserId } from "@/lib/session-user"

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

// GET /api/streak - Get user's current streak
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveSessionUserId(session.user)
    if (!userId) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        studiedToday: false,
        lastStudyDate: null,
      })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastStudyDate: true
      }
    })

    if (!user) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        studiedToday: false,
        lastStudyDate: null,
      })
    }

    // Check if streak is still valid
    const today = getTodayDate()
    const yesterday = getYesterdayDate()
    const lastStudy = user.lastStudyDate 
      ? user.lastStudyDate.toISOString().split('T')[0]
      : null

    let currentStreak = user.currentStreak
    let studiedToday = false

    if (lastStudy === today) {
      studiedToday = true
    } else if (lastStudy !== yesterday && lastStudy !== null) {
      // Streak broken - reset
      currentStreak = 0
    }

    return NextResponse.json({
      currentStreak,
      longestStreak: user.longestStreak,
      studiedToday,
      lastStudyDate: user.lastStudyDate
    })
  } catch (error) {
    console.error("Error fetching streak:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/streak - Record study activity
export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveSessionUserId(session.user)
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const today = getTodayDate()
    const yesterday = getYesterdayDate()

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        currentStreak: true,
        longestStreak: true,
        lastStudyDate: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const lastStudy = user.lastStudyDate 
      ? user.lastStudyDate.toISOString().split('T')[0]
      : null

    // Calculate new streak
    let newStreak = 1
    
    if (lastStudy === today) {
      // Already studied today, no change
      return NextResponse.json({
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        studiedToday: true,
        message: "Already recorded study for today"
      })
    } else if (lastStudy === yesterday) {
      // Studied yesterday, continue streak
      newStreak = user.currentStreak + 1
    } else {
      // Gap in studying, reset streak to 1
      newStreak = 1
    }

    const newLongestStreak = Math.max(newStreak, user.longestStreak)

    // Update user streak
    await prisma.user.update({
          where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastStudyDate: new Date()
      }
    })

    // Also record in StudyDay table for history
    await prisma.studyDay.upsert({
      where: {
        userId_date: {
              userId,
          date: today
        }
      },
      update: {},
      create: {
            userId,
        date: today
      }
    })

    return NextResponse.json({
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      studiedToday: true,
      message: "Study activity recorded"
    })
  } catch (error) {
    console.error("Error recording streak:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
