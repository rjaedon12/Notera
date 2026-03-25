// ============================================
// HOMEWORK PDF GENERATOR — Types
// ============================================

export interface HomeworkConfig {
  title: string
  teacherName: string
  className: string
  date: string
  instructions: string
  includeAnswerKey: boolean
  includeNameField: boolean
  includeWordBank: boolean
  questionTypes: QuestionType[]
  selectedSetIds: string[]
  questionsPerSet: number
  shuffleQuestions: boolean
}

export type QuestionType =
  | "definition-to-term"
  | "term-to-definition"
  | "multiple-choice"
  | "matching"
  | "fill-in-blank"

export interface GeneratedQuestion {
  id: string
  type: QuestionType
  prompt: string
  answer: string
  choices?: string[]
  matchPairs?: { term: string; definition: string }[]
}

export interface HomeworkDocument {
  config: HomeworkConfig
  questions: GeneratedQuestion[]
  generatedAt: string
}

export interface FlashcardForHomework {
  id: string
  term: string
  definition: string
}

export interface SetForHomework {
  id: string
  title: string
  cards: FlashcardForHomework[]
  _count?: { cards: number }
  user?: { name: string | null }
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, { label: string; description: string }> = {
  "definition-to-term": {
    label: "Write the Term",
    description: "Given a definition, the student writes the matching term",
  },
  "term-to-definition": {
    label: "Write the Definition",
    description: "Given a term, the student writes the definition",
  },
  "multiple-choice": {
    label: "Multiple Choice",
    description: "Four options generated from other cards in the set",
  },
  matching: {
    label: "Matching",
    description: "Match a column of terms to a column of definitions",
  },
  "fill-in-blank": {
    label: "Fill in the Blank",
    description: "A sentence with a key word blanked out",
  },
}
