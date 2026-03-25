"use client"

import { useCallback, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
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
 * US-Letter dimensions at 2× device-pixel-ratio.
 * html2canvas renders at native px, then we scale into jsPDF point units.
 */
const LETTER_WIDTH_PT = 612
const LETTER_HEIGHT_PT = 792
const SCALE = 2 // higher = sharper text in the PDF

export function PDFRenderer({ config, questions, disabled }: PDFRendererProps) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const handleDownload = useCallback(async () => {
    if (disabled || generating) return

    try {
      setGenerating(true)
      setProgress("Preparing worksheet…")

      // ── 1. Render HomeworkSheetContent into a hidden off-screen container ──
      const wrapper = document.createElement("div")
      wrapper.style.position = "fixed"
      wrapper.style.left = "-9999px"
      wrapper.style.top = "0"
      wrapper.style.width = `${LETTER_WIDTH_PT}px`
      wrapper.style.background = "white"
      wrapper.style.zIndex = "-1"
      document.body.appendChild(wrapper)
      containerRef.current = wrapper

      // Use React 18 createRoot to render the shared component
      const root = createRoot(wrapper)
      await new Promise<void>((resolve) => {
        root.render(
          <HomeworkSheetContent config={config} questions={questions} />
        )
        // Give React + KaTeX a tick to paint
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve())
        })
      })

      // Wait a bit more for KaTeX fonts / images to settle
      await new Promise((r) => setTimeout(r, 300))

      setProgress("Rendering to image…")

      // ── 2. Capture with html2canvas ──
      const html2canvas = (await import("html2canvas")).default
      const sheetEl = wrapper.querySelector("#homework-sheet-content") as HTMLElement
      if (!sheetEl) throw new Error("Homework sheet element not found")

      const canvas = await html2canvas(sheetEl, {
        scale: SCALE,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        // Ensure the full scrollable height is captured
        windowWidth: LETTER_WIDTH_PT,
        windowHeight: sheetEl.scrollHeight,
      })

      setProgress("Building PDF…")

      // ── 3. Slice the canvas into letter-sized pages & build the PDF ──
      const { default: jsPDF } = await import("jspdf")
      const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" })

      const imgWidth = LETTER_WIDTH_PT
      const imgHeight = (canvas.height / canvas.width) * imgWidth

      // How much content height fits on one page (with margins)
      const MARGIN_TOP = 0
      const MARGIN_BOTTOM = 30 // room for page footer
      const pageContentHeight = LETTER_HEIGHT_PT - MARGIN_TOP - MARGIN_BOTTOM

      const totalPages = Math.ceil(imgHeight / pageContentHeight)

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage()

        // Slice a horizontal strip from the full canvas for this page
        const sourceY = page * pageContentHeight * SCALE * (canvas.width / LETTER_WIDTH_PT) / SCALE
        const sourceYPx = Math.round(page * (pageContentHeight / imgHeight) * canvas.height)
        const sourceHPx = Math.min(
          Math.round((pageContentHeight / imgHeight) * canvas.height),
          canvas.height - sourceYPx
        )

        if (sourceHPx <= 0) break

        // Create a per-page canvas slice
        const pageCanvas = document.createElement("canvas")
        pageCanvas.width = canvas.width
        pageCanvas.height = sourceHPx
        const ctx = pageCanvas.getContext("2d")!
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
        ctx.drawImage(
          canvas,
          0, sourceYPx, canvas.width, sourceHPx,
          0, 0, canvas.width, sourceHPx
        )

        const sliceDataUrl = pageCanvas.toDataURL("image/png")
        const sliceHeight = (sourceHPx / canvas.width) * LETTER_WIDTH_PT

        doc.addImage(
          sliceDataUrl,
          "PNG",
          0,
          MARGIN_TOP,
          LETTER_WIDTH_PT,
          sliceHeight,
          undefined,
          "FAST"
        )

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

      // Cleanup
      root.unmount()
      document.body.removeChild(wrapper)
      containerRef.current = null
    } catch (err) {
      console.error("PDF generation failed:", err)
      toast.error("Failed to generate PDF. Please try again.")
      // Cleanup on error
      if (containerRef.current) {
        try { document.body.removeChild(containerRef.current) } catch { /* already removed */ }
        containerRef.current = null
      }
    } finally {
      setGenerating(false)
      setProgress(null)
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
          {progress || "Generating…"}
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
