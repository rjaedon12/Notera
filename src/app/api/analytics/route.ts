import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/analytics — get user's study analytics
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const [
      user,
      totalSets,
      totalCards,
      cardProgressCounts,
      studySessions,
      quizAttempts,
      achievements,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { streak: true, longestStreak: true, lastStudied: true },
      }),
      prisma.flashcardSet.count({ where: { userId } }),
      prisma.flashcard.count({ where: { set: { userId } } }),
      prisma.cardProgress.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),
      // Real session count from StudySession table
      prisma.studySession.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.quizAttempt.findMany({
        where: { userId, completedAt: { not: null } },
        select: { score: true },
      }),
      prisma.userAchievement.count({ where: { userId } }),
    ])

    const statusMap: Record<string, number> = {}
    for (const cp of cardProgressCounts) {
      statusMap[cp.status] = cp._count
    }

    // Validate streak (check if it's still valid)
    let currentStreak = user?.streak ?? 0
    if (user?.lastStudied) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const lastDate = new Date(user.lastStudied)
      const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())
      const diffDays = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays > 1) currentStreak = 0
    }

    // Build 30-day study activity from real StudySession rows
    // Include estimated minutes practiced per day (each session ≈ 10min average)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const studyActivity: { date: string; count: number; minutesPracticed: number }[] = []
    const activityMap: Record<string, number> = {}

    for (const ss of studySessions) {
      const date = ss.createdAt.toISOString().split("T")[0]
      activityMap[date] = (activityMap[date] || 0) + 1
    }

    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      const count = activityMap[dateStr] || 0
      studyActivity.push({
        date: dateStr,
        count,
        minutesPracticed: count * 10, // ~10min per session estimate
      })
    }

    // Quiz scores are now stored as percentages (0–100)
    const completedQuizScores = quizAttempts
      .filter((a) => a.score !== null)
      .map((a) => a.score as number)
    const avgQuizScore =
      completedQuizScores.length > 0
        ? completedQuizScores.reduce((s, v) => s + v, 0) / completedQuizScores.length
        : 0

    return Response.json({
      totalSets,
      totalCards,
      cardsMastered: statusMap["MASTERED"] || 0,
      cardsLearning: statusMap["LEARNING"] || 0,
      cardsNew: statusMap["NEW"] || 0,
      currentStreak,
      totalStudySessions: studySessions.length,
      quizzesTaken: quizAttempts.length,
      averageQuizScore: Math.round(avgQuizScore * 10) / 10,
      studyActivity,
      achievementsUnlocked: achievements,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
