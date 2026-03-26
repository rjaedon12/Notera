"use client"

import { useCallback, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import type { HomeworkConfig, GeneratedQuestion, HomeworkDocument } from "@/types/homework"
import { generateHomeworkPDF, loadCJKFont } from "@/lib/pdf-generator"
import { waitForKatexFonts } from "@/lib/latex-to-image"

interface PDFRendererProps {
  config: HomeworkConfig
  questions: GeneratedQuestion[]
  disabled?: boolean
}

export function PDFRenderer({ config, questions, disabled }: PDFRendererProps) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)

  const handleDownload = useCallback(async () => {
    if (disabled || generating) return

    try {
      setGenerating(true)
      setProgress("Loading fonts…")

      // ── 1. Wait for KaTeX fonts to be ready ──
      await waitForKatexFonts()

      // ── 2. Load CJK font for Unicode/pinyin support ──
      let cjkFont: string | null = null
      try {
        cjkFont = await loadCJKFont()
      } catch (err) {
        // Non-fatal — Helvetica will be used as fallback
        console.warn("CJK font not available, using Helvetica fallback:", err)
      }

      setProgress("Pre-rendering equations…")

      // ── 3. Build the document object ──
      const document: HomeworkDocument = {
        config,
        questions,
        generatedAt: new Date().toISOString(),
      }

      // ── 4. Generate the text-based PDF with intelligent page breaks ──
      setProgress("Building PDF…")
      const doc = await generateHomeworkPDF(document, cjkFont, (rendered, total) => {
        setProgress(`Rendering equations… ${rendered}/${total}`)
      })

      // ── 5. Download ──
      const safeName = (config.title || "homework")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      const blob = doc.output("blob")
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement("a")
      link.href = url
      link.download = `${safeName}.pdf`
      window.document.body.appendChild(link)
      link.click()
      window.document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast.success("PDF downloaded!")
    } catch (err) {
      console.error("PDF generation failed:", err)
      toast.error("Failed to generate PDF. Please try again.")
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
