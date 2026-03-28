"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Blocks, Play } from "lucide-react"
import { motion } from "framer-motion"
import type { AnswerMode, PromptSide } from "@/lib/blast"

interface BlastConfigProps {
  setTitle: string
  cardCount: number
  onStart: (answerMode: AnswerMode, promptSide: PromptSide) => void
}

export function BlastConfig({ setTitle, cardCount, onStart }: BlastConfigProps) {
  const [isMC, setIsMC] = useState(true)
  const [promptSide, setPromptSide] = useState<PromptSide>("mixed")

  const answerMode: AnswerMode = isMC ? "mc" : "typed"

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-[var(--accent)] dark:bg-[var(--accent)]"
        >
          <Blocks className="h-8 w-8 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl font-bold text-center text-foreground mb-1 tracking-tight">
            Blocks
          </h1>
          <p className="text-muted-foreground text-center text-sm mb-6">{setTitle}</p>

          {/* Settings card */}
          <div
            className="rounded-2xl border border-[var(--glass-border)] p-5 mb-5 space-y-5"
            style={{ background: "var(--glass-fill)" }}
          >
            {/* Answer mode */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 block">
                Answer mode
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: true, label: "Multiple Choice" },
                  { val: false, label: "Typed" },
                ].map(({ val, label }) => (
                  <button
                    key={label}
                    onClick={() => setIsMC(val)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isMC === val
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--muted)] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt direction */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3 block">
                Prompt direction
              </Label>
              <div className="flex gap-2">
                {([
                  { key: "term" as const, label: "Term → Def" },
                  { key: "definition" as const, label: "Def → Term" },
                  { key: "mixed" as const, label: "Mixed" },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPromptSide(key)}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      promptSide === key
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--muted)] text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* How to play */}
            <div className="rounded-xl p-4 space-y-2 text-sm bg-[var(--muted)]">
              <p className="text-muted-foreground">Answer questions to earn block pieces</p>
              <p className="text-muted-foreground">Place pieces on the 8×8 board to clear lines</p>
              <p className="text-muted-foreground">Chain clears for combo multipliers</p>
            </div>
          </div>

          {/* Start button */}
          <Button
            onClick={() => onStart(answerMode, promptSide)}
            size="lg"
            className="w-full h-12 text-base font-semibold gap-2 rounded-xl"
          >
            <Play className="h-5 w-5" />
            Start Game
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
