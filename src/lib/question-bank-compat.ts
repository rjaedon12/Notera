import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

type QuestionBankLike = Record<string, unknown> & {
  feedbackMode?: unknown
}

export type QuizFeedbackModeValue = "IMMEDIATE" | "REVEAL_AT_END"

const globalForQuestionBankCompat = globalThis as typeof globalThis & {
  questionBankFeedbackModePromise?: Promise<boolean>
  feedbackModeColumnEnsured?: boolean
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

type QuestionBankBaseSelect = typeof QUESTION_BANK_BASE_SELECT

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

export async function getQuestionBankSelect(): Promise<QuestionBankBaseSelect>
export async function getQuestionBankSelect<const T extends Prisma.QuestionBankSelect>(
  extra: T
): Promise<QuestionBankBaseSelect & T>
export async function getQuestionBankSelect(
  extra: Prisma.QuestionBankSelect = {}
) {
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

/**
 * Non-destructively ensures the feedbackMode column and its enum type exist.
 * Safe to call multiple times — uses IF NOT EXISTS.
 * Only runs once per process lifetime.
 */
export async function ensureFeedbackModeColumn(): Promise<void> {
  if (globalForQuestionBankCompat.feedbackModeColumnEnsured) return

  const hasColumn = await questionBankHasFeedbackModeColumn()
  if (hasColumn) {
    globalForQuestionBankCompat.feedbackModeColumnEnsured = true
    return
  }

  try {
    // Create the enum type if it doesn't exist
    await prisma.$executeRawUnsafe(
      `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'QuizFeedbackMode') THEN CREATE TYPE "QuizFeedbackMode" AS ENUM ('IMMEDIATE', 'REVEAL_AT_END'); END IF; END $$`
    )

    // Add the column if it doesn't exist
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "QuestionBank" ADD COLUMN IF NOT EXISTS "feedbackMode" "QuizFeedbackMode" DEFAULT 'IMMEDIATE'::"QuizFeedbackMode"`
    )

    // Clear the cached column check so subsequent calls detect the new column
    globalForQuestionBankCompat.questionBankFeedbackModePromise = undefined
    globalForQuestionBankCompat.feedbackModeColumnEnsured = true
  } catch (error) {
    console.warn("Could not auto-add feedbackMode column (DDL may be restricted):", error)
    // Non-fatal — the compat layer still excludes the column from queries
  }
}