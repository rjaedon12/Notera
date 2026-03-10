import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/streak — get user's current streak, longest streak, and studiedToday
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        streak: true,
        longestStreak: true,
        lastStudied: true,
      },
    })

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Check if the streak is still valid (hasn't expired)
    let currentStreak = user.streak
    let studiedToday = false

    if (user.lastStudied) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const lastDate = new Date(user.lastStudied)
      const lastDay = new Date(
        lastDate.getFullYear(),
        lastDate.getMonth(),
        lastDate.getDate()
      )

      const diffMs = today.getTime() - lastDay.getTime()
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

      if (diffDays === 0) {
        studiedToday = true
      } else if (diffDays > 1) {
        // Streak is broken — reset
        currentStreak = 0
        await prisma.user.update({
          where: { id: session.user.id },
          data: { streak: 0 },
        })
      }
    }

    return Response.json({
      currentStreak,
      longestStreak: user.longestStreak ?? 0,
      studiedToday,
    })
  } catch (error) {
    console.error("Get streak error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
