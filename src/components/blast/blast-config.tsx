"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Blocks, Sparkles, RotateCcw } from "lucide-react"
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
    <div className="container mx-auto px-4 py-8 max-w-md text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-6"
      >
        <Blocks className="h-10 w-10 text-purple-400" />
      </motion.div>

      <h1 className="text-2xl font-bold mb-1">Blocks</h1>
      <p className="text-muted-foreground mb-6 text-sm">{setTitle}</p>

      <Card className="mb-6 bg-zinc-900 border-zinc-700">
        <CardContent className="p-6 space-y-5 text-left">
          {/* Answer mode toggle */}
          <div className="space-y-3">
            <Label className="text-zinc-300">Answer mode</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Multiple choice</span>
              <Switch checked={isMC} onCheckedChange={setIsMC} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">Typed answer</span>
              <Switch checked={!isMC} onCheckedChange={(v) => setIsMC(!v)} />
            </div>
          </div>

          {/* Prompt side */}
          <div className="space-y-3">
            <Label className="text-zinc-300">Prompt direction</Label>
            {(["term", "definition", "mixed"] as const).map((side) => (
              <div key={side} className="flex items-center justify-between">
                <span className="text-sm text-zinc-400 capitalize">
                  {side === "term"
                    ? "Term → Definition"
                    : side === "definition"
                      ? "Definition → Term"
                      : "Mixed"}
                </span>
                <Switch
                  checked={promptSide === side}
                  onCheckedChange={() => setPromptSide(side)}
                />
              </div>
            ))}
          </div>

          {/* Rules */}
          <div className="bg-zinc-800 rounded-lg p-4 space-y-2 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400 flex-shrink-0" />
              <span>Answer questions to earn block pieces</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <span>Place pieces on the 8×8 board to clear lines</span>
            </div>
            <div className="flex items-center gap-2">
              <Blocks className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <span>Chain clears for combo multipliers!</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={() => onStart(answerMode, promptSide)}
        size="lg"
        className="gap-2 w-full"
      >
        <Blocks className="h-5 w-5" />
        Start Game
      </Button>
    </div>
  )
}
