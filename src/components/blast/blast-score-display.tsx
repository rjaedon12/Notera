"use client"

import { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame } from "lucide-react"
import type { ScoreState } from "@/lib/blast"

interface BlastScoreDisplayProps {
  score: ScoreState
}

export const BlastScoreDisplay = memo(function BlastScoreDisplay({
  score,
}: BlastScoreDisplayProps) {
  return (
    <div className="flex items-center justify-between px-1 py-2">
      {/* Score */}
      <div className="flex items-baseline gap-2">
        <motion.span
          key={score.score}
          initial={{ scale: 1.3, color: "#facc15" }}
          animate={{ scale: 1, color: "#ffffff" }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold tabular-nums text-white"
        >
          {score.score}
        </motion.span>
        <span className="text-xs text-zinc-500 uppercase tracking-wider">
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
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold"
          >
            <Flame className="h-4 w-4" />
            ×{score.comboCount + 1} COMBO
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lines cleared */}
      <div className="text-right">
        <div className="text-lg font-bold tabular-nums text-zinc-300">
          {score.linesCleared}
        </div>
        <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
          Lines
        </div>
      </div>
    </div>
  )
})
