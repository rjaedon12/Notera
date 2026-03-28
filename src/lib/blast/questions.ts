/**
 * Question pool builder for Blast mode.
 *
 * Builds shuffled questions from a flashcard set, supports MC and typed
 * modes, and recycles when the pool runs out.
 */

import type { Card } from "@/types"
import { shuffleArray } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────

export type AnswerMode = "mc" | "typed"
export type PromptSide = "term" | "definition" | "mixed"

export interface BlastQuestion {
  /** The flashcard sourcing this question. */
  card: Card
  /** Which side of the card is the prompt. */
  promptType: "term" | "definition"
  /** The prompt text shown to the user. */
  prompt: string
  /** The correct answer text. */
  correctAnswer: string
  /** MC options (only present when answerMode === "mc"). */
  options?: string[]
}

// ── Pool builder ───────────────────────────────────────────────

/**
 * Generate the full question pool from the card set.
 */
export function buildQuestionPool(
  cards: Card[],
  answerMode: AnswerMode,
  promptSide: PromptSide
): BlastQuestion[] {
  if (cards.length === 0) return []

  const promptTypes: ("term" | "definition")[] =
    promptSide === "mixed"
      ? ["term", "definition"]
      : [promptSide]

  // Cycle through cards 3× to build a large pool
  const pool: BlastQuestion[] = []
  for (let i = 0; i < 3; i++) {
    for (const card of cards) {
      const pt = promptTypes[Math.floor(Math.random() * promptTypes.length)]
      const prompt = pt === "term" ? card.term : card.definition
      const correctAnswer = pt === "term" ? card.definition : card.term

      const q: BlastQuestion = {
        card,
        promptType: pt,
        prompt,
        correctAnswer,
      }

      if (answerMode === "mc") {
        q.options = generateOptions(card, cards, pt)
      }

      pool.push(q)
    }
  }

  return shuffleArray(pool)
}

/**
 * Generate 4 MC options (1 correct + 3 distractors), shuffled.
 */
function generateOptions(
  card: Card,
  allCards: Card[],
  promptType: "term" | "definition"
): string[] {
  const correctAnswer =
    promptType === "term" ? card.definition : card.term

  const distractors = shuffleArray(
    allCards
      .filter((c) => c.id !== card.id)
      .map((c) => (promptType === "term" ? c.definition : c.term))
  ).slice(0, 3)

  return shuffleArray([correctAnswer, ...distractors])
}

/**
 * Stateful question pool that auto-recycles when exhausted.
 */
export class QuestionPool {
  private pool: BlastQuestion[]
  private index = 0
  private cards: Card[]
  private answerMode: AnswerMode
  private promptSide: PromptSide

  constructor(cards: Card[], answerMode: AnswerMode, promptSide: PromptSide) {
    this.cards = cards
    this.answerMode = answerMode
    this.promptSide = promptSide
    this.pool = buildQuestionPool(cards, answerMode, promptSide)
  }

  /** Get the next question, reshuffling if the pool is exhausted. */
  next(): BlastQuestion {
    if (this.index >= this.pool.length) {
      this.pool = buildQuestionPool(
        this.cards,
        this.answerMode,
        this.promptSide
      )
      this.index = 0
    }
    return this.pool[this.index++]
  }
}
