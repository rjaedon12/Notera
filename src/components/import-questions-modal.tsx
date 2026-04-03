"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { parseQuestionsFromText, type ParsedQuestion } from "@/lib/question-parser"
import { FileUp, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type ImportMode = "MULTIPLE_CHOICE" | "OPEN_RESPONSE"

interface ImportQuestionsModalProps {
  open: boolean
  onClose: () => void
  onImport: (questions: ParsedQuestion[], mode: ImportMode) => void
}

export function ImportQuestionsModal({ open, onClose, onImport }: ImportQuestionsModalProps) {
  const [text, setText] = useState("")
  const [preview, setPreview] = useState<ParsedQuestion[]>([])
  const [mode, setMode] = useState<ImportMode>("MULTIPLE_CHOICE")

  const handlePreview = () => {
    if (mode === "MULTIPLE_CHOICE") {
      const parsed = parseQuestionsFromText(text)
      setPreview(parsed)
    } else {
      // For open response, each paragraph (separated by blank lines) is a question
      const questions = text
        .split(/\n\s*\n/)
        .map((b) => b.trim())
        .filter(Boolean)
        .map((prompt) => ({
          prompt,
          choices: [],
          correctChoiceIndex: -1,
        }))
      setPreview(questions)
    }
  }

  const handleImport = () => {
    if (preview.length === 0) {
      if (mode === "MULTIPLE_CHOICE") {
        const parsed = parseQuestionsFromText(text)
        if (parsed.length > 0) {
          onImport(parsed, mode)
        }
      } else {
        const questions = text
          .split(/\n\s*\n/)
          .map((b) => b.trim())
          .filter(Boolean)
          .map((prompt) => ({
            prompt,
            choices: [],
            correctChoiceIndex: -1,
          }))
        if (questions.length > 0) {
          onImport(questions, mode)
        }
      }
    } else {
      onImport(preview, mode)
    }
    setText("")
    setPreview([])
    onClose()
  }

  const handleClose = () => {
    setText("")
    setPreview([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Import Questions from Text
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Question Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => { setMode("MULTIPLE_CHOICE"); setPreview([]) }}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors border",
                mode === "MULTIPLE_CHOICE"
                  ? "bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "bg-transparent border-border text-muted-foreground hover:bg-muted"
              )}
            >
              Multiple Choice
            </button>
            <button
              onClick={() => { setMode("OPEN_RESPONSE"); setPreview([]) }}
              className={cn(
                "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors border",
                mode === "OPEN_RESPONSE"
                  ? "bg-purple-50 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300"
                  : "bg-transparent border-border text-muted-foreground hover:bg-muted"
              )}
            >
              Open Response
            </button>
          </div>

          {/* Format help */}
          <div className="p-3 rounded-lg text-sm space-y-1" style={{ background: "var(--glass-fill)", borderColor: "var(--glass-border)", border: "1px solid" }}>
            <div className="flex items-center gap-1 font-medium">
              <HelpCircle className="h-3.5 w-3.5" />
              Format
            </div>
            {mode === "MULTIPLE_CHOICE" ? (
              <>
                <p className="text-muted-foreground">
                  Separate questions with blank lines. Use <code className="px-1 py-0.5 rounded bg-muted">A)</code> / <code className="px-1 py-0.5 rounded bg-muted">B)</code> for choices.
                  Add <code className="px-1 py-0.5 rounded bg-muted">*</code> after the correct answer.
                </p>
                <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{`What is the capital of France?
A) London
B) Paris*
C) Berlin
D) Madrid

What year did WW2 end?
A) 1945*
B) 1944
C) 1946`}</pre>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">
                  Separate questions with blank lines. Each paragraph becomes an open response question.
                </p>
                <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap">{`Explain the causes of World War I.

Describe the significance of the Renaissance in European history.

What were the main consequences of the Industrial Revolution?`}</pre>
              </>
            )}
          </div>

          <div>
            <Label>Paste your questions</Label>
            <Textarea
              value={text}
              onChange={(e) => { setText(e.target.value); setPreview([]) }}
              placeholder="Paste questions here..."
              className="mt-1 font-mono text-sm"
              rows={12}
            />
          </div>

          {preview.length > 0 && (
            <div className="space-y-2">
              <div className={cn(
                "text-sm font-medium",
                mode === "MULTIPLE_CHOICE" ? "text-green-600 dark:text-green-400" : "text-purple-600 dark:text-purple-400"
              )}>
                {preview.length} {mode === "OPEN_RESPONSE" ? "open response" : ""} question{preview.length !== 1 ? "s" : ""} detected
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
                {preview.map((q, i) => (
                  <div key={i} className="p-2 rounded bg-muted/50">
                    <span className="font-medium">{i + 1}.</span>{" "}
                    {q.prompt.slice(0, 80)}{q.prompt.length > 80 ? "..." : ""}{" "}
                    {mode === "MULTIPLE_CHOICE" && (
                      <span className="text-muted-foreground">
                        ({q.choices.length} choices)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          {preview.length === 0 ? (
            <Button onClick={handlePreview} disabled={!text.trim()}>
              Preview
            </Button>
          ) : (
            <Button onClick={handleImport}>
              Import {preview.length} Question{preview.length !== 1 ? "s" : ""}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
