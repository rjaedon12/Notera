import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/streak — get user's current streak and lastStudied date
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
        lastStudied: true,
      },
    })

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 })
    }

    // Check if the streak is still valid (hasn't expired)
    let currentStreak = user.streak

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

      // If more than 1 day has passed since last study, streak is broken
      if (diffDays > 1) {
        currentStreak = 0
        await prisma.user.update({
          where: { id: session.user.id },
          data: { streak: 0 },
        })
      }
    }

    return Response.json({
      streak: currentStreak,
      lastStudied: user.lastStudied,
    })
  } catch (error) {
    console.error("Get streak error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
