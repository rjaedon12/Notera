import jsPDF from "jspdf"
import type {
  HomeworkDocument,
  HomeworkConfig,
  GeneratedQuestion,
  QuestionType,
  FlashcardForHomework,
} from "@/types/homework"

// ─── Utility ─────────────────────────────────────────────

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = shuffleArray(arr)
  return shuffled.slice(0, Math.min(count, shuffled.length))
}

let questionCounter = 0
function nextId(): string {
  return `q-${++questionCounter}`
}

// ─── Question Generators ────────────────────────────────

function generateDefinitionToTerm(card: FlashcardForHomework): GeneratedQuestion {
  return {
    id: nextId(),
    type: "definition-to-term",
    prompt: card.definition,
    answer: card.term,
  }
}

function generateTermToDefinition(card: FlashcardForHomework): GeneratedQuestion {
  return {
    id: nextId(),
    type: "term-to-definition",
    prompt: card.term,
    answer: card.definition,
  }
}

function generateMultipleChoice(
  card: FlashcardForHomework,
  allCards: FlashcardForHomework[]
): GeneratedQuestion {
  const distractors = allCards
    .filter((c) => c.id !== card.id)
    .map((c) => c.definition)
  const wrongChoices = pickRandom(distractors, 3)

  // If we don't have enough distractors, pad with placeholders
  while (wrongChoices.length < 3) {
    wrongChoices.push("(no other option)")
  }

  const allChoices = shuffleArray([card.definition, ...wrongChoices])

  return {
    id: nextId(),
    type: "multiple-choice",
    prompt: card.term,
    answer: card.definition,
    choices: allChoices,
  }
}

function generateMatching(cards: FlashcardForHomework[]): GeneratedQuestion {
  const selected = pickRandom(cards, Math.min(5, cards.length))
  const shuffledDefs = shuffleArray(selected)
  return {
    id: nextId(),
    type: "matching",
    prompt: "Match each term with its correct definition.",
    answer: selected.map((c) => `${c.term} → ${c.definition}`).join("; "),
    matchPairs: selected.map((c, i) => ({
      term: c.term,
      definition: shuffledDefs[i].definition,
    })),
  }
}

function generateFillInBlank(card: FlashcardForHomework): GeneratedQuestion {
  const words = card.definition.split(" ")
  if (words.length < 3) {
    // Too short for fill-in-blank, fall back to definition-to-term
    return generateDefinitionToTerm(card)
  }
  // Blank out a meaningful word (not the first word, prefer longer words)
  const candidates = words
    .map((w, i) => ({ word: w, index: i }))
    .filter((w) => w.index > 0 && w.word.length > 3)

  const target =
    candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : { word: words[1], index: 1 }

  const blanked = [...words]
  blanked[target.index] = "_________"

  return {
    id: nextId(),
    type: "fill-in-blank",
    prompt: blanked.join(" "),
    answer: target.word,
  }
}

// ─── Main Generation ─────────────────────────────────────

export function generateQuestions(
  allCards: FlashcardForHomework[],
  config: HomeworkConfig
): GeneratedQuestion[] {
  questionCounter = 0
  const questions: GeneratedQuestion[] = []
  const cardPool = config.shuffleQuestions ? shuffleArray(allCards) : allCards
  const limit = config.questionsPerSet > 0 ? config.questionsPerSet : cardPool.length

  for (const type of config.questionTypes) {
    if (type === "matching") {
      // Matching uses groups of 5 cards
      const matchCards = pickRandom(cardPool, limit)
      for (let i = 0; i < matchCards.length; i += 5) {
        const group = matchCards.slice(i, i + 5)
        if (group.length >= 2) {
          questions.push(generateMatching(group))
        }
      }
    } else {
      const selected = pickRandom(cardPool, limit)
      for (const card of selected) {
        switch (type) {
          case "definition-to-term":
            questions.push(generateDefinitionToTerm(card))
            break
          case "term-to-definition":
            questions.push(generateTermToDefinition(card))
            break
          case "multiple-choice":
            questions.push(generateMultipleChoice(card, cardPool))
            break
          case "fill-in-blank":
            questions.push(generateFillInBlank(card))
            break
        }
      }
    }
  }

  return config.shuffleQuestions ? shuffleArray(questions) : questions
}

// ─── PDF Generation ──────────────────────────────────────

const MARGIN = 54 // ~0.75 inch
const PAGE_WIDTH = 612 // Letter
const PAGE_HEIGHT = 792
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const LINE_HEIGHT = 14
const SECTION_GAP = 8

function addPageFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text(
    `Page ${pageNum} of ${totalPages}`,
    PAGE_WIDTH / 2,
    PAGE_HEIGHT - 30,
    { align: "center" }
  )
}

function checkPageBreak(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_HEIGHT - MARGIN - 20) {
    doc.addPage()
    return MARGIN + 20
  }
  return y
}

export function generateHomeworkPDF(document: HomeworkDocument): jsPDF {
  const { config, questions } = document
  const doc = new jsPDF({ unit: "pt", format: "letter" })

  let y = MARGIN

  // ── Header ─────────────────────
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(30)
  doc.text(config.title || "Homework Worksheet", MARGIN, y)
  y += 24

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80)

  if (config.teacherName) {
    doc.text(`Teacher: ${config.teacherName}`, MARGIN, y)
    y += LINE_HEIGHT
  }
  if (config.className) {
    doc.text(`Class: ${config.className}`, MARGIN, y)
    y += LINE_HEIGHT
  }
  if (config.date) {
    doc.text(`Date: ${config.date}`, MARGIN, y)
    y += LINE_HEIGHT
  }

  // Student name field
  if (config.includeNameField) {
    y += 6
    doc.setDrawColor(180)
    doc.text("Name: ", MARGIN, y)
    const nameX = MARGIN + doc.getTextWidth("Name: ")
    doc.line(nameX, y + 1, nameX + 200, y + 1)
    y += LINE_HEIGHT + 4
  }

  // Divider
  y += 4
  doc.setDrawColor(200)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  y += 12

  // Instructions
  if (config.instructions) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(100)
    const lines = doc.splitTextToSize(config.instructions, CONTENT_WIDTH)
    doc.text(lines, MARGIN, y)
    y += lines.length * 12 + SECTION_GAP
  }

  // Word bank
  if (config.includeWordBank) {
    const terms = [...new Set(questions.map((q) => q.answer))].sort()
    if (terms.length > 0) {
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(30)
      doc.text("Word Bank", MARGIN, y)
      y += LINE_HEIGHT

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(60)

      // Draw word bank in a box
      const bankText = terms.join("    •    ")
      const bankLines = doc.splitTextToSize(bankText, CONTENT_WIDTH - 16)
      const bankH = bankLines.length * 12 + 16

      doc.setDrawColor(180)
      doc.setFillColor(248, 248, 248)
      doc.roundedRect(MARGIN, y - 4, CONTENT_WIDTH, bankH, 4, 4, "FD")
      doc.text(bankLines, MARGIN + 8, y + 8)
      y += bankH + SECTION_GAP
    }
  }

  // ── Questions ──────────────────
  doc.setTextColor(30)
  let qNum = 0

  for (const q of questions) {
    qNum++

    if (q.type === "matching" && q.matchPairs) {
      // Matching section needs more space
      y = checkPageBreak(doc, y, 40 + q.matchPairs.length * 18)

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(`${qNum}. Matching`, MARGIN, y)
      y += LINE_HEIGHT

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(60)
      doc.text(q.prompt, MARGIN + 16, y)
      y += LINE_HEIGHT + 2

      doc.setTextColor(30)
      const colA = MARGIN + 16
      const colB = MARGIN + CONTENT_WIDTH / 2 + 20

      // Column headers
      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.text("Term", colA, y)
      doc.text("Definition", colB, y)
      y += LINE_HEIGHT

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      for (const pair of q.matchPairs) {
        y = checkPageBreak(doc, y, 16)
        doc.text(`___  ${pair.term}`, colA, y)
        const defLines = doc.splitTextToSize(pair.definition, CONTENT_WIDTH / 2 - 30)
        doc.text(defLines, colB, y)
        y += Math.max(defLines.length * 12, 14)
      }
      y += SECTION_GAP

    } else if (q.type === "multiple-choice" && q.choices) {
      y = checkPageBreak(doc, y, 70)

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(30)
      const promptLines = doc.splitTextToSize(`${qNum}. ${q.prompt}`, CONTENT_WIDTH - 16)
      doc.text(promptLines, MARGIN, y)
      y += promptLines.length * 13

      doc.setFontSize(9)
      doc.setFont("helvetica", "normal")
      const letters = ["a", "b", "c", "d"]
      for (let i = 0; i < q.choices.length; i++) {
        y = checkPageBreak(doc, y, 14)
        const choiceLines = doc.splitTextToSize(
          `${letters[i]})  ${q.choices[i]}`,
          CONTENT_WIDTH - 40
        )
        doc.text(choiceLines, MARGIN + 20, y)
        y += choiceLines.length * 12
      }
      y += SECTION_GAP

    } else {
      // Short answer / fill-in-blank
      y = checkPageBreak(doc, y, 36)

      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(30)
      const promptLines = doc.splitTextToSize(`${qNum}. ${q.prompt}`, CONTENT_WIDTH - 16)
      doc.text(promptLines, MARGIN, y)
      y += promptLines.length * 13 + 2

      // Answer line
      doc.setDrawColor(200)
      doc.line(MARGIN + 20, y + 10, MARGIN + CONTENT_WIDTH - 20, y + 10)
      y += 22 + SECTION_GAP
    }
  }

  // ── Answer Key ─────────────────
  if (config.includeAnswerKey) {
    doc.addPage()
    y = MARGIN

    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(30)
    doc.text("Answer Key", MARGIN, y)
    y += 24

    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")

    let akNum = 0
    for (const q of questions) {
      akNum++
      y = checkPageBreak(doc, y, 20)
      doc.setTextColor(80)
      const answerLines = doc.splitTextToSize(`${akNum}. ${q.answer}`, CONTENT_WIDTH - 16)
      doc.text(answerLines, MARGIN, y)
      y += answerLines.length * 13
    }
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addPageFooter(doc, i, totalPages)
  }

  return doc
}
