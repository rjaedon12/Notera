import jsPDF from "jspdf"
import type {
  HomeworkDocument,
  HomeworkConfig,
  GeneratedQuestion,
  FlashcardForHomework,
} from "@/types/homework"
import {
  containsLatex,
  splitLatexSegments,
  preRenderAllLatex,
  equationCache,
  type ProgressCallback,
} from "@/lib/latex-to-image"

// Re-export for external callers
export { preRenderAllLatex, type ProgressCallback }

// ─── Unicode Font Support ────────────────────────────────

/**
 * Detect whether text contains CJK characters that need NotoSansSC.
 */
function needsCJKFont(text: string): boolean {
  return /[\u2E80-\u9FFF\uF900-\uFAFF\uFE30-\uFE4F\u3000-\u303F\uFF00-\uFFEF]/.test(
    text
  )
}

/** Module-level cache for font data (base64) */
let cjkFontCache: string | null = null
let latinFontCache: string | null = null

/** Convert an ArrayBuffer to a base64 string */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  const chunkSize = 8192
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }
  return btoa(binary)
}

/**
 * Fetch a font file and return as base64 string.
 */
async function fetchFontAsBase64(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to load font ${url}: ${response.status}`)
  }
  const buffer = await response.arrayBuffer()
  return arrayBufferToBase64(buffer)
}

/**
 * Load both NotoSans (Latin Extended — accented vowels like ā, ǎ, ī, ǒ, ǚ)
 * and NotoSansSC (CJK ideographs) fonts.
 *
 * Returns an object with both font base64 strings.
 * Cached at module level — persists across PDF generations within a session.
 */
export async function loadCJKFont(): Promise<string> {
  // Load both fonts in parallel
  const [, cjk] = await Promise.all([
    latinFontCache
      ? Promise.resolve(latinFontCache)
      : fetchFontAsBase64("/fonts/NotoSans-Regular.ttf").then((b64) => {
          latinFontCache = b64
          return b64
        }),
    cjkFontCache
      ? Promise.resolve(cjkFontCache)
      : fetchFontAsBase64("/fonts/NotoSansSC-Regular.ttf").then((b64) => {
          cjkFontCache = b64
          return b64
        }),
  ])

  // Return CJK font for backwards compat — the actual font selection
  // now happens inside generateHomeworkPDF via the registered fonts.
  return cjk
}

/**
 * Register both NotoSans and NotoSansSC fonts with a jsPDF instance.
 * NotoSans: covers Latin, Latin Extended-A/B (pinyin diacritics: ā, ǎ, ě, ǐ, ǒ, ǔ, ǚ, etc.)
 * NotoSansSC: covers CJK ideographs (Chinese characters)
 */
function registerFonts(doc: jsPDF, cjkBase64: string, latinBase64: string | null) {
  // Always register the CJK font
  doc.addFileToVFS("NotoSansSC-Regular.ttf", cjkBase64)
  doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "normal")
  doc.addFont("NotoSansSC-Regular.ttf", "NotoSansSC", "bold")

  // Register NotoSans for Latin Extended (accented vowels)
  if (latinBase64) {
    doc.addFileToVFS("NotoSans-Regular.ttf", latinBase64)
    doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal")
    doc.addFont("NotoSans-Regular.ttf", "NotoSans", "bold")
  }
}

/**
 * Set the font on the jsPDF doc.
 *
 * Strategy:
 *  1. Text with CJK characters → NotoSansSC (has CJK + basic Latin)
 *  2. Text with Latin Extended chars (ā, ǎ, ǐ, ǒ, ǚ, etc.) → NotoSans
 *     (full Latin Extended-A/B coverage for pinyin diacritics & macrons)
 *  3. Plain ASCII / WinAnsi text → NotoSans if available, else Helvetica
 *
 * This ensures pinyin diacritics (ā, ǎ, ě, ǐ, ǒ, ǔ, ǚ), Latin macrons
 * (ā, ē, ī, ō, ū), and CJK characters all render correctly.
 */
function setSmartFont(
  doc: jsPDF,
  style: "normal" | "bold" | "italic",
  text: string,
  hasUnicodeFont: boolean,
  hasLatinFont: boolean = false
) {
  const mappedStyle = style === "italic" ? "normal" : style

  if (hasUnicodeFont && needsCJKFont(text)) {
    // CJK text → must use NotoSansSC
    doc.setFont("NotoSansSC", mappedStyle)
  } else if (hasLatinFont) {
    // Latin Extended or plain text → NotoSans has full coverage
    doc.setFont("NotoSans", mappedStyle)
  } else if (hasUnicodeFont) {
    // Fallback to NotoSansSC if NotoSans didn't load
    doc.setFont("NotoSansSC", mappedStyle)
  } else {
    doc.setFont("helvetica", style)
  }
}

// ─── Utility ─────────────────────────────────────────────

/**
 * Sanitize text for PDF rendering.
 * Replace smart quotes, em-dashes, and other problematic Unicode chars
 * with safe equivalents. All other Unicode (CJK, pinyin, etc.) is preserved.
 */
function sanitizeText(text: string): string {
  return text
    // ── Normalize to NFC (precomposed) form ──
    // Pinyin tone marks (especially 3rd-tone caron: ǎ, ě, ǐ, ǒ, ǔ) can be
    // stored as decomposed Unicode (base letter + combining caron U+030C).
    // jsPDF cannot render combining diacritical marks — it needs the single
    // precomposed codepoint. macOS is especially prone to using NFD form.
    .normalize("NFC")
    // Smart quotes → straight quotes
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    // Dashes
    .replace(/[\u2013]/g, "-") // en-dash
    .replace(/[\u2014]/g, "--") // em-dash
    // Ellipsis
    .replace(/[\u2026]/g, "...")
    // Spaces
    .replace(/[\u00A0]/g, " ") // non-breaking space
    .replace(/[\u2002\u2003\u2009]/g, " ") // en/em/thin space
    // Bullets and symbols
    .replace(/[\u2022]/g, "*") // bullet
    .replace(/[\u2122]/g, "(TM)")
    .replace(/[\u00A9]/g, "(c)")
    .replace(/[\u00AE]/g, "(R)")
    // NOTE: CJK characters, pinyin diacritics, and other Unicode are preserved
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

// Layout constants — generous margins for a clean, editorial feel
const MARGIN = 63 // ~0.875 inch
const PAGE_WIDTH = 612 // US Letter
const PAGE_HEIGHT = 792
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2
const LINE_HEIGHT = 15
const SECTION_GAP = 18
const QUESTION_GAP = 22

// Type scale
const TITLE_SIZE = 20
const SECTION_TITLE_SIZE = 14
const META_SIZE = 9
const QUESTION_NUM_SIZE = 10
const BODY_SIZE = 9.5
const CHOICE_SIZE = 9
const FOOTER_SIZE = 7.5

// Colors (RGB tuples)
const COLOR_BLACK = 26 // #1a1a1a
const COLOR_DARK = 60 // #3c3c3c
const COLOR_MID = 120 // #787878
const COLOR_LIGHT = 170 // #aaaaaa
const COLOR_RULE = 210 // #d2d2d2

/** Bottom of the printable area (leaving room for page footer) */
const PAGE_BOTTOM = PAGE_HEIGHT - MARGIN - 28

function addPageFooter(
  doc: jsPDF,
  pageNum: number,
  totalPages: number,
  hasUnicode: boolean,
  hasLatin: boolean
) {
  doc.setFontSize(FOOTER_SIZE)
  doc.setTextColor(COLOR_LIGHT)
  setSmartFont(doc, "normal", `${pageNum}`, hasUnicode, hasLatin)
  doc.text(
    `${pageNum}  /  ${totalPages}`,
    PAGE_WIDTH - MARGIN,
    PAGE_HEIGHT - 32,
    { align: "right" }
  )
}

/**
 * Intelligent page-break helper.
 *
 * Instead of blindly slicing at equal intervals, `fitBlock` checks
 * whether the next content block (estimated at `neededPt` points tall)
 * fits on the current page.  If it doesn't, a new page is added
 * **before** any part of the block is rendered, so questions, matching
 * tables, and answer-key entries are never cut in half.
 *
 * A small `cushion` is subtracted from the usable area so that
 * content doesn't crowd the footer.
 */
function fitBlock(doc: jsPDF, y: number, neededPt: number, cushion = 12): number {
  if (y + neededPt + cushion > PAGE_BOTTOM) {
    doc.addPage()
    return MARGIN + 20 // restart near top of new page
  }
  return y
}

/**
 * Estimate the rendered height (in pt) of a question so `fitBlock`
 * can decide whether to break **before** it.  The estimates are
 * intentionally generous — it's better to leave a bit of extra
 * whitespace at the bottom of a page than to clip content.
 */
function estimateQuestionHeight(
  q: GeneratedQuestion,
  doc: jsPDF,
  contentWidth: number
): number {
  const BASE = 34 // prompt line + spacing

  if (q.type === "matching" && q.matchPairs) {
    return BASE + 20 + q.matchPairs.length * 22
  }

  if (q.type === "multiple-choice" && q.choices) {
    return BASE + q.choices.length * 18
  }

  // Short-answer / fill-in-blank — prompt text may wrap
  doc.setFontSize(QUESTION_NUM_SIZE)
  const lines = doc.splitTextToSize(sanitizeText(q.prompt), contentWidth - 20)
  return BASE + (Array.isArray(lines) ? lines.length : 1) * LINE_HEIGHT + 28
}

export async function generateHomeworkPDF(
  document: HomeworkDocument,
  cjkFontBase64?: string | null,
  onLatexProgress?: ProgressCallback
): Promise<jsPDF> {
  const { config, questions } = document
  const doc = new jsPDF({ unit: "pt", format: "letter" })

  // Register fonts — NotoSans for Latin Extended, NotoSansSC for CJK
  const hasUnicodeFontAvailable = !!cjkFontBase64
  const hasLatinFontAvailable = !!latinFontCache
  if (cjkFontBase64) {
    registerFonts(doc, cjkFontBase64, latinFontCache)
  } else if (latinFontCache) {
    // Even if CJK failed, register NotoSans for Latin Extended
    doc.addFileToVFS("NotoSans-Regular.ttf", latinFontCache)
    doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal")
    doc.addFont("NotoSans-Regular.ttf", "NotoSans", "bold")
  }

  // ── Pre-render all LaTeX equations found in questions ──
  const allTexts = questions.flatMap((q) => {
    const texts = [q.prompt, q.answer]
    if (q.choices) texts.push(...q.choices)
    if (q.matchPairs) {
      for (const p of q.matchPairs) {
        texts.push(p.term, p.definition)
      }
    }
    return texts
  })
  await preRenderAllLatex(allTexts, onLatexProgress)

  // Helper: sanitize text for safe PDF rendering
  const safeText = (text: string) => sanitizeText(text)

  // Helper: set font with automatic Unicode font preference
  const smartFont = (style: "normal" | "bold" | "italic", text: string) =>
    setSmartFont(doc, style, text, hasUnicodeFontAvailable, hasLatinFontAvailable)

  /**
   * Render a text string that may contain LaTeX math delimiters.
   * For segments with LaTeX, embeds pre-rendered equation images.
   * For plain text, uses normal doc.text().
   * Returns the new Y position after rendering.
   */
  const renderTextWithMath = (
    text: string,
    x: number,
    yPos: number,
    maxWidth: number,
    style: "normal" | "bold" | "italic" = "normal",
    fontSize: number = 10
  ): number => {
    const sanitized = sanitizeText(text)

    if (!containsLatex(text)) {
      // No LaTeX — render as plain text
      doc.setFontSize(fontSize)
      smartFont(style, sanitized)
      const lines = doc.splitTextToSize(sanitized, maxWidth)
      doc.text(lines, x, yPos)
      return yPos + lines.length * (fontSize * 1.3)
    }

    // Has LaTeX — split into segments and render inline
    const segments = splitLatexSegments(text)
    let curX = x
    let curY = yPos
    const lineHeight = fontSize * 1.3

    for (const seg of segments) {
      if (seg.type === "text") {
        const cleanText = sanitizeText(seg.content)
        if (!cleanText.trim()) continue

        doc.setFontSize(fontSize)
        smartFont(style, cleanText)

        // Check if text fits on current line
        const textWidth = doc.getTextWidth(cleanText)
        if (curX + textWidth > x + maxWidth && curX > x) {
          // Wrap to next line
          curX = x
          curY += lineHeight
        }

        // Split into lines if needed
        if (textWidth > maxWidth) {
          const lines = doc.splitTextToSize(cleanText, maxWidth)
          doc.text(lines, curX, curY)
          curY += lines.length * lineHeight
          curX = x
        } else {
          doc.text(cleanText, curX, curY)
          curX += textWidth
        }
      } else {
        // LaTeX segment — embed pre-rendered image
        const cacheKey = `${seg.displayMode ? "D" : "I"}:${seg.content}`
        const fbKey = `FB:${seg.displayMode ? "D" : "I"}:${seg.content}`
        const eq = equationCache.get(cacheKey) || equationCache.get(fbKey)

        if (eq) {
          // Scale equation to match current font size
          const scaleFactor = fontSize / 12
          const eqW = eq.width * scaleFactor
          const eqH = eq.height * scaleFactor

          if (seg.displayMode) {
            // Display math: center on its own line
            curX = x
            curY += 2
            const centerX = x + (maxWidth - eqW) / 2
            doc.addImage(eq.dataUrl, "PNG", centerX, curY - eqH * 0.7, eqW, eqH)
            curY += eqH + 4
            curX = x
          } else {
            // Inline math: place inline with text
            if (curX + eqW > x + maxWidth && curX > x) {
              curX = x
              curY += lineHeight
            }
            // Vertically center the equation with the text baseline
            const yOffset = eqH * 0.65
            doc.addImage(eq.dataUrl, "PNG", curX, curY - yOffset, eqW, eqH)
            curX += eqW + 2
          }
        } else {
          // Fallback: render LaTeX source as italic text
          const fallbackText = sanitizeText(seg.content)
          doc.setFontSize(fontSize - 1)
          smartFont("italic", fallbackText)
          const tw = doc.getTextWidth(fallbackText)
          if (curX + tw > x + maxWidth && curX > x) {
            curX = x
            curY += lineHeight
          }
          doc.text(fallbackText, curX, curY)
          curX += tw + 2
          doc.setFontSize(fontSize)
          smartFont(style, "")
        }
      }
    }

    // Ensure we advance Y past the last line
    if (curX > x) {
      curY += lineHeight
    }
    return curY
  }

  let y = MARGIN

  // ── Header ─────────────────────
  const titleText = safeText(config.title || "Homework Worksheet")
  doc.setFontSize(TITLE_SIZE)
  smartFont("bold", titleText)
  doc.setTextColor(COLOR_BLACK)
  doc.text(titleText, MARGIN, y)
  y += TITLE_SIZE + 14

  // Info boxes — three equal-width rounded rects with label + value
  const infoBoxes: { label: string; value: string }[] = []
  if (config.className) infoBoxes.push({ label: "CLASSROOM", value: safeText(config.className) })
  if (config.date) infoBoxes.push({ label: "DUE DATE", value: safeText(config.date) })
  if (config.teacherName) infoBoxes.push({ label: "TEACHER", value: safeText(config.teacherName) })

  if (infoBoxes.length > 0) {
    const boxGap = 8
    const totalGap = boxGap * (infoBoxes.length - 1)
    const boxW = (CONTENT_WIDTH - totalGap) / infoBoxes.length
    const boxH = 38
    const boxRadius = 4
    const boxFill = 243 // #f3f3f0 — warm light gray

    for (let i = 0; i < infoBoxes.length; i++) {
      const bx = MARGIN + i * (boxW + boxGap)
      const by = y

      // Rounded rectangle fill
      doc.setFillColor(boxFill, boxFill, boxFill - 3)
      doc.roundedRect(bx, by, boxW, boxH, boxRadius, boxRadius, "F")

      // Label — small uppercase muted
      doc.setFontSize(6.5)
      doc.setTextColor(COLOR_MID)
      smartFont("normal", infoBoxes[i].label)
      doc.text(infoBoxes[i].label, bx + 10, by + 13, { charSpace: 0.6 })

      // Value — black, normal weight
      doc.setFontSize(9.5)
      doc.setTextColor(COLOR_BLACK)
      smartFont("normal", infoBoxes[i].value)
      doc.text(infoBoxes[i].value, bx + 10, by + 27)
    }
    y += boxH + 14
  }

  // Divider — coral / terracotta accent line
  doc.setDrawColor(196, 103, 90) // #C4675A
  doc.setLineWidth(1.2)
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
  doc.setLineWidth(0.5)
  y += SECTION_GAP + 4

  // Instructions
  if (config.instructions) {
    // "INSTRUCTIONS" label — small uppercase muted
    doc.setFontSize(7)
    doc.setTextColor(COLOR_MID)
    smartFont("normal", "INSTRUCTIONS")
    doc.text("INSTRUCTIONS", MARGIN, y, { charSpace: 0.8 })
    y += 14

    doc.setFontSize(BODY_SIZE)
    const instrText = safeText(config.instructions)
    smartFont("normal", instrText)
    doc.setTextColor(COLOR_BLACK)
    const lines = doc.splitTextToSize(instrText, CONTENT_WIDTH)
    doc.text(lines, MARGIN, y)
    y += lines.length * 13 + SECTION_GAP
  }

  // Word bank — minimal rule-based design
  if (config.includeWordBank) {
    const terms = [...new Set(questions.map((q) => q.answer))].sort()
    if (terms.length > 0) {
      // Thin top rule
      doc.setDrawColor(COLOR_RULE)
      doc.setLineWidth(0.5)
      doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y)
      y += 12

      // "WORD BANK" label — small caps style
      doc.setFontSize(7.5)
      smartFont("bold", "WORD BANK")
      doc.setTextColor(COLOR_MID)
      doc.text("WORD BANK", MARGIN, y, { charSpace: 1.5 })
      y += 12

      // Terms listed cleanly
      doc.setFontSize(BODY_SIZE)
      doc.setTextColor(COLOR_BLACK)
      const bankText = terms.map(t => sanitizeText(t)).join("     \u00b7     ")
      smartFont("normal", bankText)
      const bankLines = doc.splitTextToSize(bankText, CONTENT_WIDTH)
      doc.text(bankLines, MARGIN, y)
      y += bankLines.length * 13 + 8

      // Thin bottom rule
      doc.setDrawColor(COLOR_RULE)
      doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y)
      doc.setLineWidth(0.5)
      y += SECTION_GAP
    }
  }

  // ── Questions ──────────────────
  doc.setTextColor(COLOR_BLACK)
  let qNum = 0

  for (const q of questions) {
    qNum++

    // Intelligent page-break: estimate entire question height first
    const estimatedH = estimateQuestionHeight(q, doc, CONTENT_WIDTH)
    y = fitBlock(doc, y, estimatedH)

    if (q.type === "matching" && q.matchPairs) {
      // Question number + label
      doc.setFontSize(QUESTION_NUM_SIZE)
      doc.setTextColor(COLOR_BLACK)
      smartFont("bold", `${qNum}.`)
      doc.text(`${qNum}.`, MARGIN, y)
      const numW = doc.getTextWidth(`${qNum}. `)
      smartFont("normal", "Matching")
      doc.text("Matching", MARGIN + numW, y)
      y += LINE_HEIGHT + 2

      // Instruction text
      doc.setFontSize(BODY_SIZE)
      doc.setTextColor(COLOR_MID)
      y = renderTextWithMath(q.prompt, MARGIN + 18, y, CONTENT_WIDTH - 18, "normal", BODY_SIZE)
      y += 6

      doc.setTextColor(COLOR_BLACK)
      const colA = MARGIN + 18
      const colB = MARGIN + CONTENT_WIDTH / 2 + 24

      // Column headers — subtle, uppercase, small
      doc.setFontSize(7.5)
      doc.setTextColor(COLOR_MID)
      smartFont("bold", "TERM")
      doc.text("TERM", colA, y, { charSpace: 0.8 })
      doc.text("DEFINITION", colB, y, { charSpace: 0.8 })
      y += LINE_HEIGHT

      // Thin rule under headers
      doc.setDrawColor(COLOR_RULE)
      doc.setLineWidth(0.3)
      doc.line(colA, y - 4, colA + CONTENT_WIDTH / 2 - 30, y - 4)
      doc.line(colB, y - 4, colB + CONTENT_WIDTH / 2 - 40, y - 4)
      y += 4 // spacing so rule doesn't overlap first pair text

      doc.setFontSize(BODY_SIZE)
      doc.setTextColor(COLOR_BLACK)
      let pairIdx = 0
      for (const pair of q.matchPairs) {
        y = fitBlock(doc, y, 20)
        // Numbered term (1., 2., 3...) instead of "___"
        const termNum = `${pairIdx + 1}.  `
        smartFont("normal", termNum)
        doc.text(termNum, colA, y)
        const termNumW = doc.getTextWidth(termNum)
        const termEndY = renderTextWithMath(pair.term, colA + termNumW, y, CONTENT_WIDTH / 2 - 32 - termNumW, "normal", BODY_SIZE)
        // Lettered definition (A., B., C...)
        const defPrefix = `${String.fromCharCode(65 + pairIdx)}.  `
        smartFont("normal", defPrefix)
        doc.text(defPrefix, colB, y)
        const defPrefixW = doc.getTextWidth(defPrefix)
        const defEndY = renderTextWithMath(pair.definition, colB + defPrefixW, y, CONTENT_WIDTH / 2 - 40 - defPrefixW, "normal", BODY_SIZE)
        y = Math.max(termEndY, defEndY) + 2
        pairIdx++
      }
      y += QUESTION_GAP

    } else if (q.type === "multiple-choice" && q.choices) {
      doc.setTextColor(COLOR_BLACK)
      // Prompt with question number
      y = renderTextWithMath(`${qNum}. ${q.prompt}`, MARGIN, y, CONTENT_WIDTH - 20, "bold", QUESTION_NUM_SIZE)
      y += 2

      const letters = ["a", "b", "c", "d"]
      for (let i = 0; i < q.choices.length; i++) {
        y = fitBlock(doc, y, 18)
        doc.setTextColor(COLOR_BLACK)
        y = renderTextWithMath(
          `${letters[i]}.  ${q.choices[i]}`,
          MARGIN + 24,
          y,
          CONTENT_WIDTH - 44,
          "normal",
          CHOICE_SIZE
        )
      }
      y += QUESTION_GAP

    } else {
      // Short answer / fill-in-blank
      doc.setTextColor(COLOR_BLACK)
      y = renderTextWithMath(`${qNum}. ${q.prompt}`, MARGIN, y, CONTENT_WIDTH - 20, "bold", QUESTION_NUM_SIZE)
      y += 6

      // Answer line — longer, lighter
      doc.setDrawColor(COLOR_RULE)
      doc.setLineWidth(0.4)
      doc.line(MARGIN + 24, y + 10, MARGIN + CONTENT_WIDTH, y + 10)
      doc.setLineWidth(0.5)
      y += 24 + QUESTION_GAP
    }
  }

  // ── Answer Key ─────────────────
  if (config.includeAnswerKey && questions.length > 0) {
    // Always start answer key on a fresh page
    doc.addPage()
    y = MARGIN

    // Thin top rule
    doc.setDrawColor(COLOR_RULE)
    doc.setLineWidth(0.5)
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y)
    y += 20

    // Title
    doc.setFontSize(SECTION_TITLE_SIZE)
    smartFont("bold", "Answer Key")
    doc.setTextColor(COLOR_BLACK)
    doc.text("Answer Key", MARGIN, y)
    y += SECTION_TITLE_SIZE + 14

    let akNum = 0
    for (const q of questions) {
      akNum++
      y = fitBlock(doc, y, 22)
      doc.setTextColor(COLOR_BLACK)
      y = renderTextWithMath(`${akNum}. ${q.answer}`, MARGIN, y, CONTENT_WIDTH - 20, "normal", BODY_SIZE)
      y += 2
    }
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addPageFooter(doc, i, totalPages, hasUnicodeFontAvailable, hasLatinFontAvailable)
  }

  return doc
}