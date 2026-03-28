"use client"

import { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame, Layers, Zap } from "lucide-react"
import type { ScoreState } from "@/lib/blast"

interface BlastScoreDisplayProps {
  score: ScoreState
  round?: number
}

export const BlastScoreDisplay = memo(function BlastScoreDisplay({
  score,
  round,
}: BlastScoreDisplayProps) {
  return (
    <div className="flex items-center justify-between px-1 py-2.5 gap-3">
      {/* Score */}
      <div className="flex items-baseline gap-1.5">
        <motion.span
          key={score.score}
          initial={{ scale: 1.25, color: "#a78bfa" }}
          animate={{ scale: 1, color: "#ffffff" }}
          transition={{ duration: 0.35 }}
          className="text-3xl font-extrabold tabular-nums tracking-tight"
        >
          {score.score.toLocaleString()}
        </motion.span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
          pts
        </span>
      </div>

      {/* Combo badge */}
      <AnimatePresence>
        {score.comboCount > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(245,158,11,0.15))",
              color: "#fbbf24",
              boxShadow: "0 0 12px rgba(251,191,36,0.15)",
            }}
          >
            <Flame className="h-4 w-4" />
            <span>×{score.comboCount + 1}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lines + Round */}
      <div className="flex items-center gap-4">
        {round !== undefined && round > 0 && (
          <div className="text-center">
            <div className="text-base font-bold tabular-nums text-zinc-300">
              {round}
            </div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">
              Round
            </div>
          </div>
        )}
        <div className="text-center">
          <div className="text-base font-bold tabular-nums text-zinc-300">
            {score.linesCleared}
          </div>
          <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-semibold">
            Lines
          </div>
        </div>
      </div>
    </div>
  )
})
