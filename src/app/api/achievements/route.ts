import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Achievement definitions
export const ACHIEVEMENTS = [
  { key: "first_set", title: "Creator", description: "Created your first study set", icon: "📝" },
  { key: "ten_sets", title: "Prolific", description: "Created 10 study sets", icon: "📚" },
  { key: "first_quiz", title: "Quiz Taker", description: "Completed your first quiz", icon: "🎯" },
  { key: "perfect_quiz", title: "Perfect Score", description: "Scored 100% on a quiz", icon: "💯" },
  { key: "streak_3", title: "On a Roll", description: "Maintained a 3-day study streak", icon: "🔥" },
  { key: "streak_7", title: "Week Warrior", description: "Maintained a 7-day study streak", icon: "⚡" },
  { key: "streak_30", title: "Monthly Master", description: "Maintained a 30-day study streak", icon: "🏆" },
  { key: "cards_50", title: "Card Collector", description: "Mastered 50 cards", icon: "🃏" },
  { key: "cards_100", title: "Card Master", description: "Mastered 100 cards", icon: "👑" },
  { key: "first_group", title: "Team Player", description: "Joined or created a space", icon: "👥" },
  { key: "first_comment", title: "Contributor", description: "Left your first comment on a set", icon: "💬" },
  { key: "first_rating", title: "Critic", description: "Rated your first study set", icon: "⭐" },
]

// GET /api/achievements — get user's achievements
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const unlocked = await prisma.userAchievement.findMany({
      where: { userId: session.user.id },
      orderBy: { unlockedAt: "desc" },
    })
    const unlockedKeys = new Set(unlocked.map((a) => a.achieveKey))
    
    return Response.json({
      achievements: ACHIEVEMENTS.map((a) => ({
        ...a,
        unlocked: unlockedKeys.has(a.key),
        unlockedAt: unlocked.find((u) => u.achieveKey === a.key)?.unlockedAt ?? null,
      })),
      total: ACHIEVEMENTS.length,
      unlocked: unlocked.length,
    })
  } catch (error) {
    console.error("Get achievements error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/achievements — check and award achievements
export async function POST() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id
    const newlyUnlocked: string[] = []

    const [
      user,
      setCount,
      masteredCount,
      quizAttempts,
      groupCount,
      commentCount,
      ratingCount,
      existing,
    ] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { streak: true } }),
      prisma.flashcardSet.count({ where: { userId } }),
      prisma.cardProgress.count({ where: { userId, status: "MASTERED" } }),
      prisma.quizAttempt.findMany({ where: { userId, completedAt: { not: null } }, select: { score: true } }),
      prisma.spaceMember.count({ where: { userId } }),
      prisma.comment.count({ where: { userId } }),
      prisma.rating.count({ where: { userId } }),
      prisma.userAchievement.findMany({ where: { userId }, select: { achieveKey: true } }),
    ])

    const unlocked = new Set(existing.map((e) => e.achieveKey))
    const streak = user?.streak || 0

    const checks: [string, boolean][] = [
      ["first_set", setCount >= 1],
      ["ten_sets", setCount >= 10],
      ["first_quiz", quizAttempts.length >= 1],
      ["perfect_quiz", quizAttempts.some((a) => a.score !== null && a.score >= 100)],
      ["streak_3", streak >= 3],
      ["streak_7", streak >= 7],
      ["streak_30", streak >= 30],
      ["cards_50", masteredCount >= 50],
      ["cards_100", masteredCount >= 100],
      ["first_group", groupCount >= 1],
      ["first_comment", commentCount >= 1],
      ["first_rating", ratingCount >= 1],
    ]

    for (const [key, condition] of checks) {
      if (condition && !unlocked.has(key)) {
        await prisma.userAchievement.create({
          data: { userId, achieveKey: key },
        })
        newlyUnlocked.push(key)

        // Create notification for newly unlocked achievements
        const achievement = ACHIEVEMENTS.find((a) => a.key === key)
        if (achievement) {
          await prisma.notification.create({
            data: {
              userId,
              type: "ACHIEVEMENT",
              title: "Achievement Unlocked!",
              message: `${achievement.icon} ${achievement.title}: ${achievement.description}`,
              link: "/achievements",
            },
          })
        }
      }
    }

    return Response.json({
      newlyUnlocked,
      achievements: newlyUnlocked.map((key) => ACHIEVEMENTS.find((a) => a.key === key)),
    })
  } catch (error) {
    console.error("Check achievements error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
