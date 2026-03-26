"use client"

import { useCallback, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import jsPDF from "jspdf"
import type { HomeworkConfig, GeneratedQuestion } from "@/types/homework"

// ─── PDF Layout Constants (US Letter, points) ───────────

const PW = 612 // page width
const PH = 792 // page height
const M = 54 // margin
const CW = PW - M * 2 // content width
const FOOTER_Y = PH - 28
const PAGE_BOTTOM = PH - M - 16 // lowest Y before we force a new page

// ─── Helpers ─────────────────────────────────────────────

/** Strip LaTeX $ delimiters so raw math is still readable in the PDF. */
function stripLatex(text: string): string {
  return text
    .replace(/\$\$([\s\S]*?)\$\$/g, "$1")
    .replace(/\$([^$\n]+?)\$/g, "$1")
}

/** Sanitize smart-quotes / special unicode → safe PDF chars. */
function clean(text: string): string {
  return stripLatex(text)
    .replace(/[\u2018\u2019\u201A]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013]/g, "\u2013")
    .replace(/[\u2014]/g, "\u2014")
    .replace(/[\u2026]/g, "...")
    .replace(/[\u00A0\u2002\u2003\u2009]/g, " ")
}

/**
 * Word-wrap `text` to `maxW` points, render at (x, y), return new Y.
 * Uses jsPDF's built-in splitTextToSize for accurate measurement.
 */
function drawWrapped(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): number {
  const lines: string[] = doc.splitTextToSize(clean(text), maxW)
  for (const line of lines) {
    doc.text(line, x, y)
    y += lineH
  }
  return y
}

/** Ensure enough room for `needed` pt; if not, add a page & return new Y. */
function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage()
    return M + 12
  }
  return y
}

// ─── PDF Builder ─────────────────────────────────────────

function buildPDF(config: HomeworkConfig, questions: GeneratedQuestion[]): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "letter" })
  let y = M

  // ── Title ──
  doc.setFont("helvetica", "bold")
  doc.setFontSize(20)
  doc.setTextColor(20, 20, 20)
  const title = clean(config.title || "Homework Worksheet")
  doc.text(title, M, y)
  y += 26

  // Accent line under title
  doc.setDrawColor(55, 65, 220)
  doc.setLineWidth(2.5)
  doc.line(M, y, M + Math.min(doc.getTextWidth(title) + 8, CW), y)
  doc.setLineWidth(0.5)
  y += 14

  // ── Meta info ──
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  const metaParts: string[] = []
  if (config.teacherName) metaParts.push(`Teacher: ${config.teacherName}`)
  if (config.className) metaParts.push(`Class: ${config.className}`)
  if (config.date) metaParts.push(`Date: ${config.date}`)
  if (metaParts.length) {
    doc.text(metaParts.join("    |    "), M, y)
    y += 14
  }

  // ── Name field ──
  if (config.includeNameField) {
    y += 4
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(50, 50, 50)
    doc.text("Name:", M, y)
    const nameX = M + doc.getTextWidth("Name:  ")
    doc.setDrawColor(180, 180, 180)
    doc.line(nameX, y + 1, M + CW * 0.55, y + 1)

    doc.text("Date:", M + CW * 0.6, y)
    const dateX = M + CW * 0.6 + doc.getTextWidth("Date:  ")
    doc.line(dateX, y + 1, M + CW, y + 1)
    y += 18
  }

  // ── Divider ──
  y += 2
  doc.setDrawColor(210, 210, 210)
  doc.line(M, y, PW - M, y)
  y += 10

  // ── Instructions ──
  if (config.instructions) {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8.5)
    doc.setTextColor(120, 120, 120)
    y = drawWrapped(doc, config.instructions, M, y, CW, 11)
    y += 6
  }

  // ── Word Bank ──
  if (config.includeWordBank && questions.length > 0) {
    const terms = [...new Set(questions.map((q) => clean(q.answer)))].sort()
    if (terms.length > 0) {
      y = ensureSpace(doc, y, 50)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(9)
      doc.setTextColor(60, 60, 60)
      doc.text("WORD BANK", M + 8, y + 12)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(8.5)
      doc.setTextColor(80, 80, 80)
      const bankText = terms.join("   \u2022   ")
      const bankLines: string[] = doc.splitTextToSize(bankText, CW - 20)
      const boxH = 20 + bankLines.length * 11 + 8

      // Draw box
      doc.setDrawColor(200, 200, 200)
      doc.setFillColor(249, 249, 249)
      doc.roundedRect(M, y, CW, boxH, 4, 4, "FD")

      let bankY = y + 24
      for (const line of bankLines) {
        doc.text(line, M + 10, bankY)
        bankY += 11
      }
      y += boxH + 10
    }
  }

  // ── Questions ──
  doc.setTextColor(30, 30, 30)

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const num = `${i + 1}.  `

    if (q.type === "matching" && q.matchPairs) {
      // ── MATCHING ──
      const neededH = 30 + q.matchPairs.length * 18
      y = ensureSpace(doc, y, neededH)

      // Section label
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)
      doc.text(`${num}Matching`, M, y)
      y += 13

      doc.setFont("helvetica", "italic")
      doc.setFontSize(8.5)
      doc.setTextColor(100, 100, 100)
      y = drawWrapped(doc, q.prompt, M + 16, y, CW - 16, 11)
      y += 4

      // Column headers
      const colA = M + 16
      const colB = M + CW / 2 + 16
      doc.setFont("helvetica", "bold")
      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text("TERM", colA, y)
      doc.text("DEFINITION", colB, y)
      y += 12

      // Rows
      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(40, 40, 40)
      for (let pi = 0; pi < q.matchPairs.length; pi++) {
        y = ensureSpace(doc, y, 16)
        const pair = q.matchPairs[pi]
        const termText = clean(pair.term)
        const defText = `${String.fromCharCode(65 + pi)}.  ${clean(pair.definition)}`

        doc.text(`___   ${termText}`, colA, y)

        // Wrap definition if long
        const defLines: string[] = doc.splitTextToSize(defText, CW / 2 - 24)
        for (const dl of defLines) {
          doc.text(dl, colB, y)
          y += 13
        }
        if (defLines.length <= 1) y += 13
      }
      y += 8

    } else if (q.type === "multiple-choice" && q.choices) {
      // ── MULTIPLE CHOICE ──
      const neededH = 24 + q.choices.length * 15
      y = ensureSpace(doc, y, neededH)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)
      y = drawWrapped(doc, `${num}${q.prompt}`, M, y, CW, 13)
      y += 3

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(50, 50, 50)
      const letters = ["a", "b", "c", "d"]
      for (let ci = 0; ci < q.choices.length; ci++) {
        y = ensureSpace(doc, y, 14)
        const choiceText = `${letters[ci]})   ${clean(q.choices[ci])}`
        const choiceLines: string[] = doc.splitTextToSize(choiceText, CW - 32)
        for (const cl of choiceLines) {
          doc.text(cl, M + 20, y)
          y += 12
        }
      }
      y += 8

    } else if (q.type === "fill-in-blank") {
      // ── FILL IN THE BLANK ──
      y = ensureSpace(doc, y, 40)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)
      y = drawWrapped(doc, `${num}${q.prompt}`, M, y, CW, 13)
      y += 14

    } else {
      // ── SHORT ANSWER (term-to-def / def-to-term) ──
      y = ensureSpace(doc, y, 44)

      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.setTextColor(30, 30, 30)
      y = drawWrapped(doc, `${num}${q.prompt}`, M, y, CW, 13)
      y += 4

      // Answer line
      doc.setDrawColor(200, 200, 200)
      doc.line(M + 16, y + 4, M + CW - 16, y + 4)
      y += 18
    }
  }

  // ── Answer Key ──
  if (config.includeAnswerKey && questions.length > 0) {
    y += 12
    y = ensureSpace(doc, y, 60)

    // Thick divider
    doc.setDrawColor(55, 65, 220)
    doc.setLineWidth(2)
    doc.line(M, y, PW - M, y)
    doc.setLineWidth(0.5)
    y += 18

    doc.setFont("helvetica", "bold")
    doc.setFontSize(14)
    doc.setTextColor(30, 30, 30)
    doc.text("Answer Key", M, y)
    y += 20

    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(80, 80, 80)

    // Two-column answer key for compactness
    const colW = CW / 2 - 8
    const col1X = M
    const col2X = M + CW / 2 + 8
    const half = Math.ceil(questions.length / 2)

    for (let i = 0; i < half; i++) {
      y = ensureSpace(doc, y, 14)

      // Left column
      const q1 = questions[i]
      const a1 = `${i + 1}.  ${clean(q1.answer)}`
      const a1Lines: string[] = doc.splitTextToSize(a1, colW)
      let maxH = a1Lines.length * 12

      // Right column
      const i2 = i + half
      let a2Lines: string[] = []
      if (i2 < questions.length) {
        const q2 = questions[i2]
        const a2 = `${i2 + 1}.  ${clean(q2.answer)}`
        a2Lines = doc.splitTextToSize(a2, colW)
        maxH = Math.max(maxH, a2Lines.length * 12)
      }

      for (const line of a1Lines) {
        doc.text(line, col1X, y)
        y += 12
      }
      // Reset Y for right column
      y -= a1Lines.length * 12
      for (const line of a2Lines) {
        doc.text(line, col2X, y)
        y += 12
      }
      y -= Math.min(a1Lines.length, a2Lines.length) * 12
      y += maxH + 2
    }
  }

  // ── Page numbers ──
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(160, 160, 160)
    doc.text(`Page ${p} of ${totalPages}`, PW / 2, FOOTER_Y, { align: "center" })
  }

  return doc
}

// ─── React Component ─────────────────────────────────────

interface PDFRendererProps {
  config: HomeworkConfig
  questions: GeneratedQuestion[]
  disabled?: boolean
}

export function PDFRenderer({ config, questions, disabled }: PDFRendererProps) {
  const [generating, setGenerating] = useState(false)

  const handleDownload = useCallback(async () => {
    if (disabled || generating) return

    try {
      setGenerating(true)

      // Small delay to let button state update
      await new Promise((r) => setTimeout(r, 50))

      const doc = buildPDF(config, questions)

      const safeName = (config.title || "homework")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      doc.save(`${safeName}.pdf`)
      toast.success("PDF downloaded!")
    } catch (err) {
      console.error("PDF generation failed:", err)
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setGenerating(false)
    }
  }, [config, questions, disabled, generating])

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || generating}
      className={cn(
        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all",
        disabled || generating
          ? "opacity-40 cursor-not-allowed"
          : "hover:opacity-90 hover:shadow-lg"
      )}
      style={{
        background: "linear-gradient(135deg, #3B4FE8, #5B8FFF)",
        boxShadow: disabled ? "none" : "0 4px 14px rgba(59, 79, 232, 0.35)",
      }}
    >
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating…
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download PDF
        </>
      )}
    </button>
  )
}
