import { z } from "zod"

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const studySetSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false),
})

export const cardSchema = z.object({
  term: z.string().min(1, "Term is required"),
  definition: z.string().min(1, "Definition is required"),
  orderIndex: z.number().int().min(0),
})

export const folderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(100),
})

export const testConfigSchema = z.object({
  questionCount: z.number().int().min(1).max(100),
  questionTypes: z.array(z.enum(["multiple_choice", "written"])),
  includeTermToDefinition: z.boolean(),
  includeDefinitionToTerm: z.boolean(),
})

// ============================================
// QUIZ SCHEMAS
// ============================================

export const questionChoiceSchema = z.object({
  text: z.string().min(1, "Choice text is required"),
  isCorrect: z.boolean().default(false),
  orderIndex: z.number().int().min(0),
})

export const questionSchema = z.object({
  prompt: z.string().min(1, "Question prompt is required"),
  imageUrl: z.string().url().optional().or(z.literal("")),
  passage: z.string().max(5000).optional(),
  explanation: z.string().min(1, "Explanation is required"),
  correctChoiceIndex: z.number().int().min(0, "Valid choice index required"),
  orderIndex: z.number().int().min(0),
  choices: z.array(questionChoiceSchema).min(2, "At least 2 choices required").max(6),
})

export const questionBankSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subject: z.string().min(1, "Subject is required").max(200),
  description: z.string().max(1000).optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isPublic: z.boolean().default(false),
})

export const submitAnswerSchema = z.object({
  questionId: z.string().min(1),
  choiceId: z.string().min(1),
})

// ============================================
// DBQ SCHEMAS
// ============================================

export const dbqHighlightSchema = z.object({
  docId: z.string().min(1),
  text: z.string().min(1),
  color: z.string().min(1),
  startOffset: z.number().int().min(0),
  endOffset: z.number().int().min(0),
})

export const dbqEssaySubmitSchema = z.object({
  promptId: z.string().min(1, "Prompt is required"),
  content: z.string().min(1, "Essay content is required"),
  highlights: z.array(dbqHighlightSchema).optional(),
})

export type SignupInput = z.infer<typeof signupSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type StudySetInput = z.infer<typeof studySetSchema>
export type CardInput = z.infer<typeof cardSchema>
export type FolderInput = z.infer<typeof folderSchema>
export type TestConfig = z.infer<typeof testConfigSchema>
export type QuestionChoiceInput = z.infer<typeof questionChoiceSchema>
export type QuestionInput = z.infer<typeof questionSchema>
export type QuestionBankInput = z.infer<typeof questionBankSchema>
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>
export type DBQHighlightInput = z.infer<typeof dbqHighlightSchema>
export type DBQEssaySubmitInput = z.infer<typeof dbqEssaySubmitSchema>
