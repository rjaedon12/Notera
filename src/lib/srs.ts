import { createEmptyCard, fsrs, generatorParameters, Rating, State } from "ts-fsrs"
import type { Card as FSRSCard, Grade } from "ts-fsrs"
import type { UserFlashcardProgress } from "@prisma/client"

const params = generatorParameters({ enable_fuzz: true })
const f = fsrs(params)

export { Rating, State }

/**
 * Given the current FSRS progress (or null for a new card) and a rating,
 * compute the next scheduling state to persist.
 */
export function getNextCard(
  progress: UserFlashcardProgress | null,
  rating: Rating
) {
  const card: FSRSCard = progress
    ? {
        due: progress.due,
        stability: progress.stability,
        difficulty: progress.difficulty,
        elapsed_days: progress.elapsedDays,
        scheduled_days: progress.scheduledDays,
        learning_steps: 0,
        reps: progress.reps,
        lapses: progress.lapses,
        state: progress.state as State,
        last_review: progress.lastReview ?? undefined,
      }
    : createEmptyCard()

  const now = new Date()
  // next() with a specific grade returns a single RecordLogItem
  const grade = rating as Grade
  const recordLog = f.next(card, now, grade)
  const scheduled = recordLog.card

  return {
    due: scheduled.due,
    stability: scheduled.stability,
    difficulty: scheduled.difficulty,
    elapsedDays: scheduled.elapsed_days,
    scheduledDays: scheduled.scheduled_days,
    reps: scheduled.reps,
    lapses: scheduled.lapses,
    state: scheduled.state as number,
    lastReview: now,
  }
}
