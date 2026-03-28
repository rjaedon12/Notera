"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Blocks, Sparkles, RotateCcw, Play } from "lucide-react"
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
        {/* Hero */}
        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="w-20 h-20 rounded-2xl mx-auto mb-5 flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
            boxShadow: "0 8px 32px rgba(139,92,246,0.3)",
          }}
        >
          <Blocks className="h-10 w-10 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-2xl font-extrabold text-center text-white mb-1 tracking-tight">
            Blocks
          </h1>
          <p className="text-zinc-400 text-center text-sm mb-6 font-medium">{setTitle}</p>

          {/* Settings card */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 mb-5 space-y-5">
            {/* Answer mode */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-3 block">
                Answer mode
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsMC(true)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isMC
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-300"
                  }`}
                >
                  Multiple Choice
                </button>
                <button
                  onClick={() => setIsMC(false)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    !isMC
                      ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                      : "bg-zinc-800 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-300"
                  }`}
                >
                  Typed
                </button>
              </div>
            </div>

            {/* Prompt direction */}
            <div>
              <Label className="text-xs uppercase tracking-widest text-zinc-400 font-semibold mb-3 block">
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
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      promptSide === key
                        ? "bg-violet-600 text-white shadow-md shadow-violet-500/20"
                        : "bg-zinc-800 text-zinc-400 hover:bg-zinc-750 hover:text-zinc-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* How to play */}
            <div className="bg-zinc-800/60 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
                <span>Answer questions to earn block pieces</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <RotateCcw className="h-4 w-4 text-cyan-400 flex-shrink-0" />
                <span>Place pieces on the 8×8 board to clear lines</span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Blocks className="h-4 w-4 text-violet-400 flex-shrink-0" />
                <span>Chain clears for combo multipliers!</span>
              </div>
            </div>
          </div>

          {/* Start button */}
          <Button
            onClick={() => onStart(answerMode, promptSide)}
            size="lg"
            className="w-full h-12 text-base font-bold gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
          >
            <Play className="h-5 w-5" />
            Start Game
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
