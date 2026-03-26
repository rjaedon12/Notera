"use client"

import { useCallback, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import type { HomeworkConfig, GeneratedQuestion } from "@/types/homework"
import { generateHomeworkPDF, loadCJKFont } from "@/lib/pdf-generator"

// ─── React Component ─────────────────────────────────────

interface PDFRendererProps {
  config: HomeworkConfig
  questions: GeneratedQuestion[]
  disabled?: boolean
}

export function PDFRenderer({ config, questions, disabled }: PDFRendererProps) {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState("")

  const handleDownload = useCallback(async () => {
    if (disabled || generating) return

    try {
      setGenerating(true)
      setProgress("Loading fonts…")

      // Load CJK font for Chinese/Unicode character support
      let cjkFont: string | null = null
      try {
        cjkFont = await loadCJKFont()
      } catch (err) {
        console.warn("CJK font not available, falling back to Helvetica:", err)
      }

      setProgress("Rendering PDF…")

      const doc = await generateHomeworkPDF(
        {
          config,
          questions,
          generatedAt: new Date().toISOString(),
        },
        cjkFont,
        (rendered, total) => {
          setProgress(`Rendering equations… ${rendered}/${total}`)
        }
      )

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
      setProgress("")
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
