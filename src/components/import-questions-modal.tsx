"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { parseQuestionsFromText, type ParsedQuestion } from "@/lib/question-parser"
import { FileUp, HelpCircle } from "lucide-react"

interface ImportQuestionsModalProps {
  open: boolean
  onClose: () => void
  onImport: (questions: ParsedQuestion[]) => void
}

export function ImportQuestionsModal({ open, onClose, onImport }: ImportQuestionsModalProps) {
  const [text, setText] = useState("")
  const [preview, setPreview] = useState<ParsedQuestion[]>([])

  const handlePreview = () => {
    const parsed = parseQuestionsFromText(text)
    setPreview(parsed)
  }

  const handleImport = () => {
    if (preview.length === 0) {
      const parsed = parseQuestionsFromText(text)
      if (parsed.length > 0) {
        onImport(parsed)
      }
    } else {
      onImport(preview)
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
          {/* Format help */}
          <div className="p-3 rounded-lg text-sm space-y-1" style={{ background: "var(--glass-fill)", borderColor: "var(--glass-border)", border: "1px solid" }}>
            <div className="flex items-center gap-1 font-medium">
              <HelpCircle className="h-3.5 w-3.5" />
              Format
            </div>
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
              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                {preview.length} question{preview.length !== 1 ? "s" : ""} detected
              </div>
              <div className="max-h-40 overflow-y-auto space-y-2 text-sm">
                {preview.map((q, i) => (
                  <div key={i} className="p-2 rounded bg-muted/50">
                    <span className="font-medium">{i + 1}.</span>{" "}
                    {q.prompt.slice(0, 80)}{q.prompt.length > 80 ? "..." : ""}{" "}
                    <span className="text-muted-foreground">
                      ({q.choices.length} choices)
                    </span>
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
