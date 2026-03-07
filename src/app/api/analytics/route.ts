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
      studyProgress,
      quizAttempts,
      achievements,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { streak: true, lastStudied: true } }),
      prisma.flashcardSet.count({ where: { userId } }),
      prisma.flashcard.count({ where: { set: { userId } } }),
      prisma.cardProgress.groupBy({
        by: ["status"],
        where: { userId },
        _count: true,
      }),
      prisma.studyProgress.findMany({
        where: { userId },
        select: { lastStudied: true },
        orderBy: { lastStudied: "desc" },
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

    // Build 30-day study activity
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const studyActivity: { date: string; count: number }[] = []
    const activityMap: Record<string, number> = {}
    
    for (const sp of studyProgress) {
      const date = sp.lastStudied.toISOString().split("T")[0]
      activityMap[date] = (activityMap[date] || 0) + 1
    }
    
    for (let d = new Date(thirtyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      studyActivity.push({ date: dateStr, count: activityMap[dateStr] || 0 })
    }

    const completedQuizScores = quizAttempts.filter((a) => a.score !== null).map((a) => a.score as number)
    const avgQuizScore = completedQuizScores.length > 0
      ? completedQuizScores.reduce((s, v) => s + v, 0) / completedQuizScores.length
      : 0

    return Response.json({
      totalSets,
      totalCards,
      cardsMastered: statusMap["MASTERED"] || 0,
      cardsLearning: statusMap["LEARNING"] || 0,
      cardsNew: statusMap["NEW"] || 0,
      currentStreak: user?.streak || 0,
      totalStudySessions: studyProgress.length,
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
