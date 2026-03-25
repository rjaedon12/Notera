"use client"

import { useCallback, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import type { HomeworkConfig, GeneratedQuestion } from "@/types/homework"
import { HomeworkSheetContent } from "./HomeworkSheetContent"

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
      // Give KaTeX / browser one extra frame to finish painting
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
      setProgress("Preparing worksheet…")

      // ── 1. Mount the hidden sheet inside the real React tree ──
      const rendered = new Promise<void>((resolve) => {
        resolveRenderRef.current = resolve
        setShowHiddenSheet(true)
      })
      await rendered

      // Extra settle time for KaTeX fonts / images
      await new Promise((r) => setTimeout(r, 400))

      const sheetEl = sheetRef.current
      if (!sheetEl) throw new Error("Homework sheet element not found")

      setProgress("Rendering to image…")

      // ── 2. Capture with html2canvas ──
      const html2canvasModule = await import("html2canvas")
      // html2canvas v1.x exports CJS – handle both default and direct export
      const html2canvas =
        typeof html2canvasModule.default === "function"
          ? html2canvasModule.default
          : (html2canvasModule as unknown as { default: typeof import("html2canvas")["default"] }).default ?? (html2canvasModule as any)

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

      // ── 3. Slice the canvas into letter-sized pages & build the PDF ──
      const { default: jsPDF } = await import("jspdf")
      const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" })

      // Full image dimensions scaled to letter width
      const imgWidth = LETTER_WIDTH_PT
      const imgHeight = (canvas.height / canvas.width) * imgWidth

      const MARGIN_BOTTOM = 30 // room for page footer
      const usablePageH = LETTER_HEIGHT_PT - MARGIN_BOTTOM

      const totalPages = Math.max(1, Math.ceil(imgHeight / usablePageH))

      // Height of one page-slice in source-canvas pixels
      const sliceHPx = Math.round(canvas.height / totalPages)

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage()

        const srcY = page * sliceHPx
        const srcH = Math.min(sliceHPx, canvas.height - srcY)
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
          `Page ${page + 1} of ${totalPages}`,
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

      {/* Hidden off-screen sheet rendered inside the real React tree
          so it inherits all Tailwind styles, KaTeX fonts, etc. */}
      {showHiddenSheet &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            aria-hidden
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              width: `${LETTER_WIDTH_PT}px`,
              opacity: 0,
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
