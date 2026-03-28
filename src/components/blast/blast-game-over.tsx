"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Trophy, RotateCcw, ArrowLeft, Flame, Target, Blocks } from "lucide-react"
import type { ScoreState } from "@/lib/blast"

interface BlastGameOverProps {
  score: ScoreState
  isPersonalBest: boolean
  onPlayAgain: () => void
  onBack: () => void
}

export function BlastGameOver({
  score,
  isPersonalBest,
  onPlayAgain,
  onBack,
}: BlastGameOverProps) {
  const firstTryPct =
    score.questionsAnswered > 0
      ? Math.round((score.firstTryCount / score.questionsAnswered) * 100)
      : 0

  return (
    <div className="container mx-auto px-4 py-8 max-w-md text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-6"
      >
        {isPersonalBest ? (
          <Trophy className="h-10 w-10 text-amber-400" />
        ) : (
          <Blocks className="h-10 w-10 text-purple-400" />
        )}
      </motion.div>

      <h1 className="text-2xl font-bold mb-1">
        {isPersonalBest ? "New Personal Best!" : "Game Over"}
      </h1>

      <motion.p
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-5xl font-bold text-purple-400 mb-1 tabular-nums"
      >
        {score.score}
      </motion.p>
      <p className="text-muted-foreground mb-6 text-sm">points</p>

      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-6 space-y-3 text-left">
        <StatRow
          icon={<Flame className="h-4 w-4 text-amber-400" />}
          label="Best combo"
          value={`×${score.bestCombo}`}
        />
        <StatRow
          icon={<Blocks className="h-4 w-4 text-purple-400" />}
          label="Lines cleared"
          value={String(score.linesCleared)}
        />
        <StatRow
          icon={<Target className="h-4 w-4 text-blue-400" />}
          label="Questions answered"
          value={String(score.questionsAnswered)}
        />
        <StatRow
          icon={<Target className="h-4 w-4 text-green-400" />}
          label="First-try accuracy"
          value={`${firstTryPct}%`}
        />
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="outline" onClick={onPlayAgain} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Play Again
        </Button>
        <Button onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Set
        </Button>
      </div>
    </div>
  )
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-zinc-400 flex items-center gap-2 text-sm">
        {icon}
        {label}
      </span>
      <span className="font-bold text-lg tabular-nums text-white">{value}</span>
    </div>
  )
}
