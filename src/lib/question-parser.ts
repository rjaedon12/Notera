/**
 * Parse bulk-pasted text into multiple-choice question objects.
 *
 * Expected format (questions separated by blank lines):
 *
 *   What is the capital of France?
 *   A) London
 *   B) Paris*
 *   C) Berlin
 *   D) Madrid
 *
 * A trailing `*` on a choice marks it as the correct answer.
 * If no `*` is present, the first choice is treated as correct.
 */

export interface ParsedChoice {
  text: string
  isCorrect: boolean
}

export interface ParsedQuestion {
  prompt: string
  choices: ParsedChoice[]
  correctChoiceIndex: number
}

const CHOICE_PATTERN = /^([A-Za-z])[).]\s*(.+)$/

export function parseQuestionsFromText(raw: string): ParsedQuestion[] {
  // Split into blocks by blank lines
  const blocks = raw
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean)

  const questions: ParsedQuestion[] = []

  for (const block of blocks) {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean)
    if (lines.length < 3) continue // need at least a prompt + 2 choices

    // Find where choices start (first line matching the choice pattern)
    let choiceStartIdx = -1
    for (let i = 1; i < lines.length; i++) {
      if (CHOICE_PATTERN.test(lines[i].replace(/\*$/, ""))) {
        choiceStartIdx = i
        break
      }
    }

    if (choiceStartIdx === -1) continue

    const prompt = lines.slice(0, choiceStartIdx).join(" ")
    const choices: ParsedChoice[] = []
    let correctIndex = -1

    for (let i = choiceStartIdx; i < lines.length; i++) {
      const line = lines[i]
      const isCorrect = line.endsWith("*")
      const cleanLine = isCorrect ? line.slice(0, -1).trim() : line
      const match = CHOICE_PATTERN.exec(cleanLine)
      if (!match) continue

      if (isCorrect && correctIndex === -1) {
        correctIndex = choices.length
      }
      choices.push({ text: match[2].trim(), isCorrect: false })
    }

    if (choices.length < 2) continue
    if (correctIndex === -1) correctIndex = 0

    choices[correctIndex].isCorrect = true

    questions.push({
      prompt,
      choices,
      correctChoiceIndex: correctIndex,
    })
  }

  return questions
}
