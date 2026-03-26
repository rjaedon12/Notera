"use client"

import { useCallback, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import type { HomeworkConfig, GeneratedQuestion } from "@/types/homework"
import { HomeworkSheetContent } from "./HomeworkSheetContent"
import { waitForKatexFonts } from "@/lib/latex-to-image"

interface PDFRendererProps {
  config: HomeworkConfig
  questions: GeneratedQuestion[]
  disabled?: boolean
}

/**
 * US-Letter dimensions.
 * html2canvas renders at native px × SCALE, then we map into jsPDF point units.
 */
const LETTER_WIDTH_PT = 612
const LETTER_HEIGHT_PT = 792
const SCALE = 2 // higher = sharper text in the PDF
const PAGE_MARGIN_BOTTOM = 30 // room for page number footer

/**
 * Scan a horizontal row of pixels in `canvas` and return true if the
 * entire row is white (rgb ≥ 250 each channel). We use this to find
 * natural gaps between questions so we can split pages cleanly.
 */
function isRowWhite(ctx: CanvasRenderingContext2D, y: number, width: number): boolean {
  const row = ctx.getImageData(0, y, width, 1).data
  for (let i = 0; i < row.length; i += 4) {
    // r, g, b — allow near-white (250+) to tolerate anti-aliasing
    if (row[i] < 250 || row[i + 1] < 250 || row[i + 2] < 250) return false
  }
  return true
}

/**
 * Find the best Y coordinate in the canvas (in pixels) to break a page.
 *
 * Starting from the ideal break point (one page-height down), scan
 * upward looking for a fully-white row. If we find a gap of ≥3
 * consecutive white rows we break there — this avoids cutting through
 * text, borders, or KaTeX glyphs.
 *
 * Falls back to the ideal point if no gap is found within a generous
 * search window (25% of page height).
 */
function findSmartBreak(
  ctx: CanvasRenderingContext2D,
  idealY: number,
  canvasWidth: number,
  canvasHeight: number,
  searchRange: number,
): number {
  const minY = Math.max(0, idealY - searchRange)
  const maxY = Math.min(canvasHeight - 1, idealY)

  // Scan upward from idealY looking for a run of white rows
  for (let y = maxY; y >= minY; y--) {
    if (
      isRowWhite(ctx, y, canvasWidth) &&
      (y - 1 < 0 || isRowWhite(ctx, y - 1, canvasWidth)) &&
      (y - 2 < 0 || isRowWhite(ctx, y - 2, canvasWidth))
    ) {
      return y
    }
  }

  // Nothing found — also try scanning a bit *below* idealY
  const maxBelow = Math.min(canvasHeight - 1, idealY + Math.round(searchRange * 0.3))
  for (let y = idealY + 1; y <= maxBelow; y++) {
    if (
      isRowWhite(ctx, y, canvasWidth) &&
      (y - 1 < 0 || isRowWhite(ctx, y - 1, canvasWidth)) &&
      (y - 2 < 0 || isRowWhite(ctx, y - 2, canvasWidth))
    ) {
      return y
    }
  }

  return idealY // last resort
}

export function PDFRenderer({ config, questions, disabled }: PDFRendererProps) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  /** When true we mount the hidden sheet so html2canvas can capture it */
  const [showHiddenSheet, setShowHiddenSheet] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const resolveRenderRef = useRef<(() => void) | null>(null)

  /** Called once the hidden HomeworkSheetContent has mounted & painted */
  const onSheetReady = useCallback((node: HTMLDivElement | null) => {
    sheetRef.current = node
    if (node && resolveRenderRef.current) {
      // Give the browser one extra frame to finish painting
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolveRenderRef.current?.()
          resolveRenderRef.current = null
        })
      })
    }
  }, [])

  const handleDownload = useCallback(async () => {
    if (disabled || generating) return

    try {
      setGenerating(true)
      setProgress("Loading fonts…")

      // ── 0. Wait for KaTeX fonts via Font Loading API ──
      await waitForKatexFonts()

      setProgress("Preparing worksheet…")

      // ── 1. Mount the hidden sheet inside the real React tree ──
      const rendered = new Promise<void>((resolve) => {
        resolveRenderRef.current = resolve
        setShowHiddenSheet(true)
      })
      await rendered

      // Extra settle for any remaining async images / fonts
      await new Promise((r) => setTimeout(r, 150))

      const sheetEl = sheetRef.current
      if (!sheetEl) throw new Error("Homework sheet element not found")

      setProgress("Rendering to image…")

      // ── 2. Capture with html2canvas ──
      const html2canvasModule = await import("html2canvas")
      const html2canvas =
        typeof html2canvasModule.default === "function"
          ? html2canvasModule.default
          : (html2canvasModule as unknown as { default: typeof import("html2canvas")["default"] }).default

      if (typeof html2canvas !== "function") {
        throw new Error("html2canvas failed to load — module export is not a function")
      }

      const canvas = await html2canvas(sheetEl, {
        scale: SCALE,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: LETTER_WIDTH_PT,
        height: sheetEl.scrollHeight,
        windowWidth: LETTER_WIDTH_PT,
        windowHeight: sheetEl.scrollHeight,
      })

      setProgress("Building PDF…")

      // ── 3. Smart-slice the canvas into pages ──
      const { default: jsPDF } = await import("jspdf")
      const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" })

      const imgWidth = LETTER_WIDTH_PT
      const imgHeight = (canvas.height / canvas.width) * imgWidth
      const usablePageH = LETTER_HEIGHT_PT - PAGE_MARGIN_BOTTOM

      // Pixels-per-point ratio so we can convert page-height to canvas pixels
      const pxPerPt = canvas.width / LETTER_WIDTH_PT
      const sliceTargetPx = Math.round(usablePageH * pxPerPt)
      const searchRange = Math.round(sliceTargetPx * 0.25) // scan ±25% of page height

      // Get a 2D context for pixel scanning (smart break detection)
      const scanCtx = canvas.getContext("2d")!

      let srcY = 0
      let page = 0

      while (srcY < canvas.height) {
        if (page > 0) doc.addPage()

        // Figure out where this page should end
        const idealEnd = srcY + sliceTargetPx
        let endY: number

        if (idealEnd >= canvas.height) {
          // Last page — take whatever is left
          endY = canvas.height
        } else {
          // Find a clean white-space break near the ideal point
          endY = findSmartBreak(scanCtx, idealEnd, canvas.width, canvas.height, searchRange)
        }

        const srcH = endY - srcY
        if (srcH <= 0) break

        // Create a canvas for this page slice
        const pageCanvas = document.createElement("canvas")
        pageCanvas.width = canvas.width
        pageCanvas.height = srcH
        const ctx = pageCanvas.getContext("2d")!
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

        const sliceDataUrl = pageCanvas.toDataURL("image/png")
        const sliceHeightPt = (srcH / canvas.width) * LETTER_WIDTH_PT

        doc.addImage(sliceDataUrl, "PNG", 0, 0, imgWidth, sliceHeightPt, undefined, "FAST")

        // Page footer
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Page ${page + 1}`,
          LETTER_WIDTH_PT / 2,
          LETTER_HEIGHT_PT - 14,
          { align: "center" }
        )

        srcY = endY
        page++
      }

      // Go back and update footers with total page count
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        // White-out the old footer text
        doc.setFillColor(255, 255, 255)
        doc.rect(LETTER_WIDTH_PT / 2 - 40, LETTER_HEIGHT_PT - 22, 80, 14, "F")
        doc.setFontSize(8)
        doc.setTextColor(150, 150, 150)
        doc.text(
          `Page ${i} of ${totalPages}`,
          LETTER_WIDTH_PT / 2,
          LETTER_HEIGHT_PT - 14,
          { align: "center" }
        )
      }

      // ── 4. Download ──
      const safeName = (config.title || "homework")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      const blob = doc.output("blob")
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${safeName}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("PDF downloaded!")
    } catch (err) {
      console.error("PDF generation failed:", err)
      toast.error("Failed to generate PDF. Please try again.")
    } finally {
      setShowHiddenSheet(false)
      sheetRef.current = null
      setGenerating(false)
      setProgress(null)
    }
  }, [config, questions, disabled, generating])

  return (
    <>
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
            {progress || "Generating…"}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download PDF
          </>
        )}
      </button>

      {/* Hidden OFF-SCREEN sheet (not opacity:0!) rendered in the real
          React tree so it inherits all Tailwind styles, KaTeX fonts, etc.
          Using left:-9999px keeps content visible to html2canvas while
          being invisible to the user. */}
      {showHiddenSheet &&
        typeof window !== "undefined" &&
        createPortal(
          <div
            aria-hidden
            style={{
              position: "fixed",
              left: "-9999px",
              top: 0,
              width: `${LETTER_WIDTH_PT}px`,
              pointerEvents: "none",
              zIndex: -9999,
              overflow: "visible",
            }}
          >
            <div ref={onSheetReady}>
              <HomeworkSheetContent config={config} questions={questions} />
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
