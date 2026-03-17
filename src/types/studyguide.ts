// ============================================
// INTERACTIVE STUDY GUIDES
// ============================================

export type SectionType =
  | "theorem"
  | "definition"
  | "example"
  | "note"
  | "practice"
  | "diagram"
  | "corollary"
  | "postulate";

export interface StudyGuide {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  description: string;
  coverColor: string; // accent gradient for guide card
  icon: string; // lucide icon name
  lessons: GuideLesson[];
}

export interface GuideLesson {
  id: string;
  title: string;
  subtitle: string;
  order: number;
  sections: GuideSection[];
}

export interface GuideSection {
  id: string;
  type: SectionType;
  title?: string;
  content: string; // supports LaTeX via $...$ delimiters
  imageComponent?: string; // name of SVG diagram component
  order: number;
  problem?: GuideProblem;
  steps?: string[]; // for worked examples — step-by-step
  keyTakeaway?: string;
}

export interface GuideProblem {
  id: string;
  question: string;
  choices: ProblemChoice[];
  correctAnswerId: string;
  solution: string; // full worked solution with LaTeX
  hint?: string;
  difficulty: "easy" | "medium" | "hard";
}

export interface ProblemChoice {
  id: string;
  text: string;
}

// ---- localStorage-persisted state ----

export interface GuideProblemProgress {
  problemId: string;
  isCorrect: boolean;
  attempts: number;
  lastAttemptAt: string;
  selectedChoiceId: string;
}

export interface GuideHighlight {
  id: string;
  sectionId: string;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
}

export type HighlightColor = "yellow" | "green" | "blue" | "pink" | "purple";

export interface GuideProgress {
  guideId: string;
  lessonProgress: Record<string, LessonProgress>;
  problems: Record<string, GuideProblemProgress>;
  highlights: GuideHighlight[];
  lastAccessedLessonId: string | null;
  lastAccessedAt: string;
}

export interface LessonProgress {
  lessonId: string;
  sectionsViewed: string[];
  isComplete: boolean;
}

export interface GuideNote {
  id: string;
  sectionId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}
