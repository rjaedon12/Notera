export interface StudySet {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  isFeatured?: boolean
  categoryId?: string | null
  category?: {
    id: string
    name: string
    slug: string
    icon?: string | null
  } | null
  createdAt: string
  updatedAt: string
  userId: string
  user?: {
    id: string
    name: string | null
    email?: string
  }
  // Aliases for backward compatibility
  owner?: {
    id: string
    name: string | null
    email?: string
  }
  cards?: Card[]
  _count?: {
    cards: number
    starredBy?: number
    savedBy?: number
    ratings?: number
  }
  averageRating?: number
  ratingsCount?: number
}

export interface DiscoverResponse {
  featured: StudySet[]
  trending: StudySet[]
  forYou: StudySet[]
  recent: StudySet[]
}

export interface PaginatedSets {
  sets: StudySet[]
  nextCursor: string | null
}

export interface Card {
  id: string
  term: string
  definition: string
  order: number
  setId: string
  isStarred?: boolean
  progress?: Progress
}

export interface Progress {
  id: string
  status: string
  correctCount: number
  incorrectCount: number
  lastSeen: string
  masteryLevel?: number
  easeFactor?: number
  interval?: number
  nextReviewAt?: string | null
}

export interface Folder {
  id: string
  name: string
  userId: string
  createdAt: string
  updatedAt: string
  sets?: FolderSetEntry[]
  _count?: {
    sets: number
  }
}

export interface FolderSetEntry {
  folderId: string
  setId: string
  set: StudySet
}

export interface StudySession {
  id: string
  mode: string
  startedAt: string
  endedAt: string | null
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
  createdAt: string
  setId: string
  userId: string
}

export interface TimedScore {
  id: string
  score: number
  mode: string
  createdAt: string
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
// QUIZZES / PRACTICE TESTS
// ============================================

export type QuestionType = "MULTIPLE_CHOICE" | "OPEN_RESPONSE"
export type QuizFeedbackMode = "IMMEDIATE" | "REVEAL_AT_END"

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
  type: QuestionType
  pointValue: number
  exampleAnswer: string | null
  orderIndex: number
  bankId: string
  createdAt: string
  updatedAt: string
  choices: QuestionChoice[]
}

export interface QuestionBank {
  id: string
  title: string
  subject: string
  description: string | null
  imageUrl: string | null
  isPublic: boolean
  timerMinutes: number | null
  desmosEnabled: boolean
  feedbackMode: QuizFeedbackMode
  createdAt: string
  updatedAt: string
  userId: string
  user?: { id: string; name: string | null }
  questions?: Question[]
  _count?: { questions: number; attempts: number }
}

export interface QuizAnswer {
  id: string
  isCorrect: boolean
  attemptId: string
  questionId: string
  choiceId: string | null
  openResponseText: string | null
  pointsEarned: number | null
  question?: Question
  choice?: QuestionChoice | null
}

export interface QuizAttempt {
  id: string
  score: number | null
  totalQuestions: number
  completedAt: string | null
  createdAt: string
  userId: string
  bankId: string
  bank?: {
    id: string
    title: string
    timerMinutes?: number | null
    desmosEnabled?: boolean
    feedbackMode?: QuizFeedbackMode
  }
  answers?: QuizAnswer[]
  _count?: { answers: number }
}

// ============================================
// COMMENTS & RATINGS
// ============================================

export interface SetComment {
  id: string
  text: string
  createdAt: string
  userId: string
  setId: string
  user?: { id: string; name: string | null }
}

export interface Rating {
  id: string
  score: number
  createdAt: string
  userId: string
  setId: string
}

// ============================================
// ACHIEVEMENTS
// ============================================

export interface Achievement {
  key: string
  title: string
  description: string
  icon: string
}

export interface UserAchievement {
  id: string
  achieveKey: string
  unlockedAt: string
  userId: string
}

// ============================================
// NOTIFICATIONS
// ============================================

export interface AppNotification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  link: string | null
  createdAt: string
  userId: string
}

// ============================================
// ANALYTICS
// ============================================

export interface UserAnalytics {
  totalSets: number
  totalCards: number
  cardsMastered: number
  cardsLearning: number
  cardsNew: number
  currentStreak: number
  totalStudySessions: number
  quizzesTaken: number
  averageQuizScore: number
  studyActivity: { date: string; count: number }[]
  achievementsUnlocked: number
}
