"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { parseImportText } from "@/lib/csv-parser"

interface ImportTextModalProps {
  open: boolean
  onClose: () => void
  onImport: (cards: { term: string; definition: string }[]) => void
}

type TermSepOption = "tab" | "comma" | "custom"
type CardSepOption = "newline" | "semicolon" | "custom"

const TERM_SEP_VALUES: Record<Exclude<TermSepOption, "custom">, string> = {
  tab: "\t",
  comma: ",",
}

const CARD_SEP_VALUES: Record<Exclude<CardSepOption, "custom">, string> = {
  newline: "\n",
  semicolon: ";",
}

export function ImportTextModal({ open, onClose, onImport }: ImportTextModalProps) {
  const [text, setText] = useState("")
  const [termSepOption, setTermSepOption] = useState<TermSepOption>("comma")
  const [cardSepOption, setCardSepOption] = useState<CardSepOption>("newline")
  const [customTermSep, setCustomTermSep] = useState("")
  const [customCardSep, setCustomCardSep] = useState("")

  const termDelimiter =
    termSepOption === "custom" ? customTermSep : TERM_SEP_VALUES[termSepOption]
  const cardDelimiter =
    cardSepOption === "custom" ? customCardSep : CARD_SEP_VALUES[cardSepOption]

  const preview = useMemo(() => {
    if (!text.trim() || !termDelimiter) return []
    return parseImportText(text, termDelimiter, cardDelimiter || "\n")
  }, [text, termDelimiter, cardDelimiter])

  const handleImport = () => {
    if (preview.length === 0) return
    onImport(preview)
    // Reset state
    setText("")
    setTermSepOption("comma")
    setCardSepOption("newline")
    setCustomTermSep("")
    setCustomCardSep("")
    onClose()
  }

  const handleCancel = () => {
    setText("")
    setTermSepOption("comma")
    setCardSepOption("newline")
    setCustomTermSep("")
    setCustomCardSep("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-2xl">
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-[var(--glass-fill)] transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        <DialogHeader>
          <DialogTitle className="text-xl">Import your data</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Copy and Paste your data here (from Word, Excel, Google Docs, etc.)
          </p>
        </DialogHeader>

        {/* Text area */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"term1,definition1\nterm2,definition2\nterm3,definition3"}
          rows={8}
          className="w-full rounded-xl border p-3 text-sm resize-y font-mono
            focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-0"
          style={{
            background: "var(--glass-fill)",
            borderColor: "var(--glass-border)",
            color: "var(--foreground)",
          }}
        />

        {/* Delimiter options */}
        <div className="grid grid-cols-2 gap-8 mt-4">
          {/* Term/definition separator */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Between term and definition</Label>
            <div className="space-y-2">
              <RadioOption
                name="term-sep"
                value="tab"
                checked={termSepOption === "tab"}
                onChange={() => setTermSepOption("tab")}
                label="Tab"
              />
              <RadioOption
                name="term-sep"
                value="comma"
                checked={termSepOption === "comma"}
                onChange={() => setTermSepOption("comma")}
                label="Comma"
              />
              <div className="flex items-center gap-2">
                <RadioOption
                  name="term-sep"
                  value="custom"
                  checked={termSepOption === "custom"}
                  onChange={() => setTermSepOption("custom")}
                  label=""
                />
                <Input
                  placeholder="Custom"
                  value={customTermSep}
                  onChange={(e) => {
                    setCustomTermSep(e.target.value)
                    setTermSepOption("custom")
                  }}
                  className="h-8 text-sm flex-1"
                />
              </div>
            </div>
          </div>

          {/* Card separator */}
          <div>
            <Label className="text-sm font-semibold mb-3 block">Between cards</Label>
            <div className="space-y-2">
              <RadioOption
                name="card-sep"
                value="newline"
                checked={cardSepOption === "newline"}
                onChange={() => setCardSepOption("newline")}
                label="New line"
              />
              <RadioOption
                name="card-sep"
                value="semicolon"
                checked={cardSepOption === "semicolon"}
                onChange={() => setCardSepOption("semicolon")}
                label="Semicolon"
              />
              <div className="flex items-center gap-2">
                <RadioOption
                  name="card-sep"
                  value="custom"
                  checked={cardSepOption === "custom"}
                  onChange={() => setCardSepOption("custom")}
                  label=""
                />
                <Input
                  placeholder="Custom"
                  value={customCardSep}
                  onChange={(e) => {
                    setCustomCardSep(e.target.value)
                    setCardSepOption("custom")
                  }}
                  className="h-8 text-sm flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {preview.length > 0 && (
          <div className="mt-6">
            <h3 className="text-base font-semibold mb-3">
              Preview{" "}
              <span className="text-sm font-normal text-muted-foreground">
                {preview.length} card{preview.length !== 1 ? "s" : ""}
              </span>
            </h3>
            <div
              className="max-h-52 overflow-y-auto rounded-xl border"
              style={{ borderColor: "var(--glass-border)" }}
            >
              {preview.slice(0, 20).map((card, i) => (
                <div
                  key={i}
                  className="flex items-stretch border-b last:border-b-0"
                  style={{ borderColor: "var(--glass-border)" }}
                >
                  <div
                    className="w-10 flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground font-medium border-r"
                    style={{
                      background: "color-mix(in srgb, var(--accent-color) 8%, transparent)",
                      borderColor: "var(--glass-border)",
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 grid grid-cols-2 divide-x" style={{ borderColor: "var(--glass-border)" }}>
                    <div className="px-3 py-2">
                      <p className="text-sm">{card.term}</p>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Term</span>
                    </div>
                    <div className="px-3 py-2" style={{ borderColor: "var(--glass-border)" }}>
                      <p className="text-sm">{card.definition}</p>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Definition</span>
                    </div>
                  </div>
                </div>
              ))}
              {preview.length > 20 && (
                <div className="px-4 py-2 text-xs text-muted-foreground text-center">
                  … and {preview.length - 20} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={handleCancel}>
            Cancel Import
          </Button>
          <Button onClick={handleImport} disabled={preview.length === 0}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── tiny radio helper ── */
function RadioOption({
  name,
  value,
  checked,
  onChange,
  label,
}: {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 accent-[var(--accent-color)]"
      />
      {label && <span className="text-sm">{label}</span>}
    </label>
  )
}
