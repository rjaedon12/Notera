import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type QuestionBankLike = {
  feedbackMode?: unknown
}

export type QuizFeedbackModeValue = "IMMEDIATE" | "REVEAL_AT_END"

const globalForQuestionBankCompat = globalThis as typeof globalThis & {
  questionBankFeedbackModePromise?: Promise<boolean>
}

const QUESTION_BANK_BASE_SELECT = {
  id: true,
  title: true,
  subject: true,
  description: true,
  imageUrl: true,
  isPublic: true,
  isPremade: true,
  timerMinutes: true,
  desmosEnabled: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  categoryId: true,
} satisfies Prisma.QuestionBankSelect

export const QUESTION_BANK_OWNER_SELECT = {
  id: true,
  userId: true,
  isPublic: true,
  isPremade: true,
} satisfies Prisma.QuestionBankSelect

const QUESTION_CHOICE_SELECT = {
  id: true,
  text: true,
  isCorrect: true,
  orderIndex: true,
  questionId: true,
} satisfies Prisma.ChoiceSelect

export const QUESTION_WITH_CHOICES_SELECT = {
  id: true,
  prompt: true,
  imageUrl: true,
  passage: true,
  explanation: true,
  orderIndex: true,
  type: true,
  pointValue: true,
  exampleAnswer: true,
  bankId: true,
  choices: {
    select: QUESTION_CHOICE_SELECT,
    orderBy: { orderIndex: "asc" },
  },
} satisfies Prisma.QuestionSelect

function normalizeFeedbackMode(feedbackMode: unknown): QuizFeedbackModeValue {
  return feedbackMode === "REVEAL_AT_END" ? "REVEAL_AT_END" : "IMMEDIATE"
}

export async function questionBankHasFeedbackModeColumn(): Promise<boolean> {
  if (!globalForQuestionBankCompat.questionBankFeedbackModePromise) {
    globalForQuestionBankCompat.questionBankFeedbackModePromise = prisma
      .$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'QuestionBank'
            AND column_name = 'feedbackMode'
        ) AS "exists"
      `
      .then((rows) => rows[0]?.exists ?? false)
      .catch((error) => {
        globalForQuestionBankCompat.questionBankFeedbackModePromise = undefined
        throw error
      })
  }

  return globalForQuestionBankCompat.questionBankFeedbackModePromise
}

export async function getQuestionBankSelect(
  extra: Prisma.QuestionBankSelect = {}
): Promise<Prisma.QuestionBankSelect> {
  const hasFeedbackMode = await questionBankHasFeedbackModeColumn()

  return {
    ...QUESTION_BANK_BASE_SELECT,
    ...extra,
    ...(hasFeedbackMode ? { feedbackMode: true } : {}),
  }
}

export async function getQuestionBankFeedbackModeData(feedbackMode: unknown) {
  if (feedbackMode === undefined) {
    return {}
  }

  if (!(await questionBankHasFeedbackModeColumn())) {
    return {}
  }

  return { feedbackMode: normalizeFeedbackMode(feedbackMode) } as const
}

export function withQuestionBankDefaults<T extends QuestionBankLike>(bank: T) {
  return {
    ...bank,
    feedbackMode: normalizeFeedbackMode(bank.feedbackMode),
  }
}

export function withQuestionBankDefaultsArray<T extends QuestionBankLike>(banks: T[]) {
  return banks.map((bank) => withQuestionBankDefaults(bank))
}