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

    const now = new Date()
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - now.getDay())
    startOfThisWeek.setHours(0, 0, 0, 0)
    const startOfLastWeek = new Date(startOfThisWeek.getTime() - 7 * 24 * 60 * 60 * 1000)

    const [
      user,
      totalSets,
      totalCards,
      cardProgressCounts,
      studySessions,
      quizAttempts,
      achievements,
      sessionsByType,
      reviewForecastRaw,
      topSetsRaw,
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
      prisma.studySession.findMany({
        where: { userId },
        select: { createdAt: true, type: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.quizAttempt.findMany({
        where: { userId, completedAt: { not: null } },
        select: { score: true, completedAt: true, bank: { select: { title: true } } },
        orderBy: { completedAt: "desc" },
        take: 20,
      }),
      prisma.userAchievement.count({ where: { userId } }),
      prisma.studySession.groupBy({
        by: ["type"],
        where: { userId },
        _count: true,
      }),
      prisma.cardProgress.findMany({
        where: {
          userId,
          nextReviewAt: { gte: now, lte: sevenDaysFromNow },
        },
        select: { nextReviewAt: true },
      }),
      prisma.studyProgress.findMany({
        where: { userId, masteredCount: { gt: 0 } },
        select: {
          masteredCount: true,
          totalCards: true,
          set: { select: { id: true, title: true } },
        },
        orderBy: { masteredCount: "desc" },
        take: 5,
      }),
    ])

    const statusMap: Record<string, number> = {}
    for (const cp of cardProgressCounts) {
      statusMap[cp.status] = cp._count
    }

    // Validate streak
    let currentStreak = user?.streak ?? 0
    if (user?.lastStudied) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const lastDate = new Date(user.lastStudied)
      const lastDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate())
      const diffDays = Math.round((today.getTime() - lastDay.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays > 1) currentStreak = 0
    }

    // Build 90-day study activity from StudySession rows
    const studyActivity: { date: string; count: number; minutesPracticed: number }[] = []
    const activityMap: Record<string, number> = {}

    for (const ss of studySessions) {
      const date = ss.createdAt.toISOString().split("T")[0]
      activityMap[date] = (activityMap[date] || 0) + 1
    }

    for (let d = new Date(ninetyDaysAgo); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      const count = activityMap[dateStr] || 0
      studyActivity.push({ date: dateStr, count, minutesPracticed: count * 10 })
    }

    // Quiz scores + history
    const completedQuizScores = quizAttempts
      .filter((a) => a.score !== null)
      .map((a) => a.score as number)
    const avgQuizScore =
      completedQuizScores.length > 0
        ? completedQuizScores.reduce((s, v) => s + v, 0) / completedQuizScores.length
        : 0

    const quizScoreHistory = quizAttempts
      .filter((a) => a.score !== null && a.completedAt)
      .map((a) => ({
        date: a.completedAt!.toISOString().split("T")[0],
        score: Math.round((a.score as number) * 10) / 10,
        bankName: a.bank.title,
      }))

    // Study mode breakdown
    const studyModeBreakdown: Record<string, number> = {}
    for (const g of sessionsByType) {
      studyModeBreakdown[g.type] = g._count
    }

    // Review forecast — group by date for next 7 days
    const forecastMap: Record<string, number> = {}
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      forecastMap[d.toISOString().split("T")[0]] = 0
    }
    for (const cp of reviewForecastRaw) {
      if (cp.nextReviewAt) {
        const dateStr = cp.nextReviewAt.toISOString().split("T")[0]
        if (dateStr in forecastMap) forecastMap[dateStr]++
      }
    }
    const reviewForecast = Object.entries(forecastMap).map(([date, count]) => ({ date, count }))

    // Weekly comparison
    const thisWeekSessions = studySessions.filter(
      (s) => s.createdAt >= startOfThisWeek
    ).length
    const lastWeekSessions = studySessions.filter(
      (s) => s.createdAt >= startOfLastWeek && s.createdAt < startOfThisWeek
    ).length

    // Top sets by mastery
    const topSets = topSetsRaw.map((sp) => ({
      id: sp.set.id,
      title: sp.set.title,
      mastered: sp.masteredCount,
      total: sp.totalCards,
    }))

    // Retention rate
    const totalReviewed = (statusMap["MASTERED"] || 0) + (statusMap["LEARNING"] || 0)
    const retentionRate = totalReviewed > 0
      ? Math.round(((statusMap["MASTERED"] || 0) / totalReviewed) * 100)
      : 0

    return Response.json({
      totalSets,
      totalCards,
      cardsMastered: statusMap["MASTERED"] || 0,
      cardsLearning: statusMap["LEARNING"] || 0,
      cardsNew: statusMap["NEW"] || 0,
      currentStreak,
      longestStreak: user?.longestStreak ?? 0,
      totalStudySessions: studySessions.length,
      quizzesTaken: quizAttempts.length,
      averageQuizScore: Math.round(avgQuizScore * 10) / 10,
      studyActivity,
      achievementsUnlocked: achievements,
      quizScoreHistory,
      studyModeBreakdown,
      reviewForecast,
      weeklyComparison: { thisWeek: thisWeekSessions, lastWeek: lastWeekSessions },
      topSets,
      retentionRate,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
