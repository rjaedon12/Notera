export interface StudySet {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  ownerId: string
  owner?: {
    id: string
    name: string | null
    email: string
  }
  cards?: Card[]
  _count?: {
    cards: number
  }
}

export interface Card {
  id: string
  term: string
  definition: string
  orderIndex: number
  setId: string
  createdAt: Date
  updatedAt: Date
  isStarred?: boolean
  progress?: Progress
}

export interface Progress {
  id: string
  masteryLevel: number
  streak: number
  correctCount: number
  incorrectCount: number
  lastReviewedAt: Date | null
  nextReviewAt?: Date | null
  easeFactor?: number
  interval?: number
}

export interface Folder {
  id: string
  name: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
  sets?: StudySet[]
  _count?: {
    sets: number
  }
}

export interface StudySession {
  id: string
  mode: string
  startedAt: Date
  endedAt: Date | null
  stats: SessionStats
  userId: string
  setId: string
}

export interface SessionStats {
  totalCards: number
  correctAnswers: number
  incorrectAnswers: number
  timeSpent: number
  accuracy?: number
  weakestCards?: string[]
}

export interface MatchScore {
  id: string
  time: number
  createdAt: Date
  setId: string
  userId: string
}

export interface TimedScore {
  id: string
  score: number
  mode: string
  createdAt: Date
  setId: string
  userId: string
}

export type StudyMode = 'flashcards' | 'learn' | 'test' | 'match' | 'timed'

export interface TestQuestion {
  id: string
  type: 'multiple_choice' | 'written'
  prompt: string
  promptType: 'term' | 'definition'
  correctAnswer: string
  options?: string[]
  cardId: string
}

export interface TestResult {
  questionId: string
  userAnswer: string
  isCorrect: boolean
  correctAnswer: string
}

// ============================================
// QUIZZES
// ============================================

export interface QuestionChoice {
  id: string
  text: string
  isCorrect: boolean
  orderIndex: number
  questionId: string
}

export interface Question {
  id: string
  prompt: string
  imageUrl: string | null
  passage: string | null
  explanation: string
  correctChoiceId: string
  orderIndex: number
  bankId: string
  createdAt: Date
  updatedAt: Date
  choices: QuestionChoice[]
}

export interface QuestionBank {
  id: string
  title: string
  subject: string
  description: string | null
  imageUrl: string | null
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
  ownerId: string
  owner?: { id: string; name: string | null }
  questions?: Question[]
  _count?: { questions: number; attempts: number }
}

export interface QuizAnswer {
  id: string
  isCorrect: boolean
  attemptId: string
  questionId: string
  choiceId: string
  question?: Question
  choice?: QuestionChoice
}

export interface QuizAttempt {
  id: string
  score: number | null
  totalQuestions: number
  completedAt: Date | null
  createdAt: Date
  userId: string
  bankId: string
  bank?: { id: string; title: string }
  answers?: QuizAnswer[]
  _count?: { answers: number }
}
