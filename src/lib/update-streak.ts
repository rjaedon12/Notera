import { prisma } from "@/lib/prisma"

/**
 * Shared streak utility — updates the user's streak, longestStreak, and lastStudied.
 * Also creates a StudySession row for real session tracking.
 *
 * Returns { streak, longestStreak, studiedToday }.
 */
export async function updateStreak(
  userId: string,
  sessionType: string = "FLASHCARD"
): Promise<{ streak: number; longestStreak: number; studiedToday: boolean }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { streak: true, longestStreak: true, lastStudied: true },
  })

  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  let newStreak = 1
  let studiedToday = true

  if (user?.lastStudied) {
    const lastDate = new Date(user.lastStudied)
    const lastDay = new Date(
      lastDate.getFullYear(),
      lastDate.getMonth(),
      lastDate.getDate()
    )

    const diffMs = today.getTime() - lastDay.getTime()
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      // Already studied today — keep streak as-is
      newStreak = user.streak
    } else if (diffDays === 1) {
      // Last studied yesterday — increment
      newStreak = user.streak + 1
    } else {
      // 2+ day gap — reset to 1
      newStreak = 1
    }
  }

  const prevLongest = user?.longestStreak ?? 0
  const newLongest = Math.max(prevLongest, newStreak)

  await prisma.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      longestStreak: newLongest,
      lastStudied: now,
    },
  })

  // Record a real study session
  await prisma.studySession.create({
    data: { userId, type: sessionType },
  })

  return { streak: newStreak, longestStreak: newLongest, studiedToday }
}
