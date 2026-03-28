"use client"

import { memo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Flame } from "lucide-react"
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
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-extrabold tabular-nums tracking-tight text-foreground"
        >
          {score.score.toLocaleString()}
        </motion.span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
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
            className="flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-sm text-amber-500 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-400/10"
          >
            <Flame className="h-4 w-4" />
            <span>&times;{score.comboCount + 1}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lines + Round */}
      <div className="flex items-center gap-4">
        {round !== undefined && round > 0 && (
          <div className="text-center">
            <div className="text-base font-bold tabular-nums text-foreground">
              {round}
            </div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">
              Round
            </div>
          </div>
        )}
        <div className="text-center">
          <div className="text-base font-bold tabular-nums text-foreground">
            {score.linesCleared}
          </div>
          <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-semibold">
            Lines
          </div>
        </div>
      </div>
    </div>
  )
})
