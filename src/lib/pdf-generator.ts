import jsPDF from "jspdf"
import type {
  HomeworkDocument,
  HomeworkConfig,
  GeneratedQuestion,
  QuestionType,
  FlashcardForHomework,
} from "@/types/homework"

// ─── CJK Font Support ───────────────────────────────────

/** Detect whether a string contains CJK characters */
function hasCJK(text: string): boolean {
  return /[\u2E80-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\u3000-\u303F\uFF00-\uFFEF]/.test(text)
}

/** Module-level cache for the CJK font data (base64) */
let cjkFontCache: string | null = null

/**
 * Fetch the CJK font from /fonts/ and return as base64 string.
 * Cached in memory after the first call.
 */
export async function loadCJKFont(): Promise<string> {
  if (cjkFontCache) return cjkFontCache

  const response = await fetch("/fonts/NotoSansSC-Regular.ttf")
  if (!response.ok) {
    throw new Error(`Failed to load CJK font: ${response.status}`)
  }

  const buffer = await response.arrayBuffer()
  // Convert ArrayBuffer to base64
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  cjkFontCache = btoa(binary)
  return cjkFontCache
}

/**
 * Register the CJK font with a jsPDF instance.
 * Must be called after loadCJKFont().
 */
function registerCJKFont(doc: jsPDF, fontBase64: string) {
  doc.addFileToVFS("NotoSansSC-Regular.ttf", fontBase64)
  doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal")
  doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "bold")
}

/**
 * Set the font on the jsPDF doc, auto-selecting CJK font when needed.
 */
function setSmartFont(
  doc: jsPDF,
  style: "normal" | "bold" | "italic",
  text: string,
  hasCJKFont: boolean
) {
  if (hasCJKFont && hasCJK(text)) {
    // NotoSansSC doesn't have a true italic; use normal for italic requests
    doc.setFont("NotoSansSC", style === "italic" ? "normal" : style)
  } else {
    doc.setFont("helvetica", style)
  }
}

// ─── Utility ─────────────────────────────────────────────

/**
 * Sanitize text for PDF rendering.
 * Replace smart quotes, em-dashes, and other problematic Unicode chars
 * with safe equivalents. CJK characters are preserved.
 */
function sanitizeText(text: string): string {
  return text
    // Smart quotes → straight quotes
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    // Dashes
    .replace(/[\u2013]/g, "-")   // en-dash
    .replace(/[\u2014]/g, "--")  // em-dash
    // Ellipsis
    .replace(/[\u2026]/g, "...")
    // Spaces
    .replace(/[\u00A0]/g, " ")   // non-breaking space
    .replace(/[\u2002\u2003\u2009]/g, " ") // en/em/thin space
    // Bullets and symbols
    .replace(/[\u2022]/g, "*")   // bullet
    .replace(/[\u2122]/g, "(TM)")
    .replace(/[\u00A9]/g, "(c)")
    .replace(/[\u00AE]/g, "(R)")
    // NOTE: CJK characters (U+2E80+) are intentionally preserved
}

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

export function generateHomeworkPDF(
  document: HomeworkDocument,
  cjkFontBase64?: string | null
): jsPDF {
  const { config, questions } = document
  const doc = new jsPDF({ unit: "pt", format: "letter" })

  // Register CJK font if available
  const hasCJKFontAvailable = !!cjkFontBase64
  if (cjkFontBase64) {
    registerCJKFont(doc, cjkFontBase64)
  }

  // Helper: sanitize + split text for safe PDF rendering
  const safeText = (text: string) => sanitizeText(text)
  const safeSplit = (text: string, maxWidth: number) =>
    doc.splitTextToSize(sanitizeText(text), maxWidth)

  // Helper: set font with automatic CJK detection
  const smartFont = (style: "normal" | "bold" | "italic", text: string) =>
    setSmartFont(doc, style, text, hasCJKFontAvailable)

  let y = MARGIN

  // ── Header ─────────────────────
  const titleText = safeText(config.title || "Homework Worksheet")
  doc.setFontSize(18)
  smartFont("bold", titleText)
  doc.setTextColor(30)
  doc.text(titleText, MARGIN, y)
  y += 24

  doc.setFontSize(10)
  doc.setTextColor(80)

  if (config.teacherName) {
    const t = safeText(`Teacher: ${config.teacherName}`)
    smartFont("normal", t)
    doc.text(t, MARGIN, y)
    y += LINE_HEIGHT
  }
  if (config.className) {
    const t = safeText(`Class: ${config.className}`)
    smartFont("normal", t)
    doc.text(t, MARGIN, y)
    y += LINE_HEIGHT
  }
  if (config.date) {
    const t = safeText(`Date: ${config.date}`)
    smartFont("normal", t)
    doc.text(t, MARGIN, y)
    y += LINE_HEIGHT
  }

  // Student name field
  if (config.includeNameField) {
    y += 6
    doc.setDrawColor(180)
    doc.setFont("helvetica", "normal")
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
    const instrText = safeText(config.instructions)
    smartFont("italic", instrText)
    doc.setTextColor(100)
    const lines = doc.splitTextToSize(instrText, CONTENT_WIDTH)
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
      doc.setTextColor(60)

      // Draw word bank in a box
      const bankText = terms.map(t => sanitizeText(t)).join("    *    ")
      smartFont("normal", bankText)
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
      doc.setTextColor(60)
      const matchPrompt = safeText(q.prompt)
      smartFont("normal", matchPrompt)
      doc.text(matchPrompt, MARGIN + 16, y)
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

      doc.setFontSize(9)
      for (const pair of q.matchPairs) {
        y = checkPageBreak(doc, y, 16)
        const termText = safeText(`___  ${pair.term}`)
        smartFont("normal", termText)
        doc.text(termText, colA, y)
        const defText = safeText(pair.definition)
        smartFont("normal", defText)
        const defLines = doc.splitTextToSize(defText, CONTENT_WIDTH / 2 - 30)
        doc.text(defLines, colB, y)
        y += Math.max(defLines.length * 12, 14)
      }
      y += SECTION_GAP

    } else if (q.type === "multiple-choice" && q.choices) {
      y = checkPageBreak(doc, y, 70)

      doc.setFontSize(10)
      doc.setTextColor(30)
      const mcPrompt = safeText(`${qNum}. ${q.prompt}`)
      smartFont("bold", mcPrompt)
      const promptLines = doc.splitTextToSize(mcPrompt, CONTENT_WIDTH - 16)
      doc.text(promptLines, MARGIN, y)
      y += promptLines.length * 13

      doc.setFontSize(9)
      const letters = ["a", "b", "c", "d"]
      for (let i = 0; i < q.choices.length; i++) {
        y = checkPageBreak(doc, y, 14)
        const choiceText = safeText(`${letters[i]})  ${q.choices[i]}`)
        smartFont("normal", choiceText)
        const choiceLines = doc.splitTextToSize(choiceText, CONTENT_WIDTH - 40)
        doc.text(choiceLines, MARGIN + 20, y)
        y += choiceLines.length * 12
      }
      y += SECTION_GAP

    } else {
      // Short answer / fill-in-blank
      y = checkPageBreak(doc, y, 36)

      doc.setFontSize(10)
      doc.setTextColor(30)
      const saPrompt = safeText(`${qNum}. ${q.prompt}`)
      smartFont("bold", saPrompt)
      const promptLines = doc.splitTextToSize(saPrompt, CONTENT_WIDTH - 16)
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

    let akNum = 0
    for (const q of questions) {
      akNum++
      y = checkPageBreak(doc, y, 20)
      doc.setTextColor(80)
      const akText = safeText(`${akNum}. ${q.answer}`)
      smartFont("normal", akText)
      const answerLines = doc.splitTextToSize(akText, CONTENT_WIDTH - 16)
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
