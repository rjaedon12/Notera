"use client"

import { useCallback, useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import type { HomeworkConfig, GeneratedQuestion, HomeworkDocument } from "@/types/homework"

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

      // Lazy-load PDF generator and CJK font in parallel
      const [{ generateHomeworkPDF, loadCJKFont }] = await Promise.all([
        import("@/lib/pdf-generator"),
      ])

      // Load CJK font (cached after first call)
      let fontBase64: string | null = null
      try {
        fontBase64 = await loadCJKFont()
      } catch (e) {
        console.warn("CJK font failed to load, falling back to helvetica:", e)
      }

      const document: HomeworkDocument = {
        config,
        questions,
        generatedAt: new Date().toISOString(),
      }

      setProgress("Generating worksheet…")

      // generateHomeworkPDF is now async (renders LaTeX equations)
      const pdf = await generateHomeworkPDF(document, fontBase64, (rendered, total) => {
        setProgress(`Rendering equations… ${rendered}/${total}`)
      })

      // Generate filename from title
      const safeName = (config.title || "homework")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")

      // Use manual blob download for reliable PDF output
      const blob = pdf.output("blob")
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
