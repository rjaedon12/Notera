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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: isPersonalBest ? "var(--warning)" : "var(--accent)",
          }}
        >
          {isPersonalBest ? (
            <Trophy className="h-8 w-8 text-white" />
          ) : (
            <Blocks className="h-8 w-8 text-white" />
          )}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl font-bold text-foreground mb-1"
        >
          {isPersonalBest ? "New Personal Best!" : "Game Over"}
        </motion.h1>

        {isPersonalBest && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm text-amber-500 dark:text-amber-400 font-medium mb-2"
          >
            Congratulations!
          </motion.p>
        )}

        {/* Score */}
        <motion.p
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
          className="text-5xl font-extrabold mb-1 tabular-nums tracking-tight text-foreground"
        >
          {score.score.toLocaleString()}
        </motion.p>
        <p className="text-muted-foreground mb-6 text-sm">points</p>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 gap-2.5 mb-6"
        >
          <StatCard
            icon={<Flame className="h-4 w-4 text-amber-500 dark:text-amber-400" />}
            label="Best combo"
            value={`×${score.bestCombo}`}
          />
          <StatCard
            icon={<Blocks className="h-4 w-4 text-[var(--accent)]" />}
            label="Lines cleared"
            value={String(score.linesCleared)}
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-[var(--secondary)]" />}
            label="Questions"
            value={String(score.questionsAnswered)}
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-[var(--success)]" />}
            label="First-try"
            value={`${firstTryPct}%`}
          />
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col gap-2.5"
        >
          <Button
            onClick={onPlayAgain}
            size="lg"
            className="w-full h-12 gap-2 font-semibold text-base rounded-xl"
          >
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
            className="w-full h-11 gap-2 font-semibold rounded-xl"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Set
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div
      className="rounded-xl p-3.5 text-center border border-[var(--glass-border)]"
      style={{ background: "var(--glass-fill)" }}
    >
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <span className="text-xl font-bold tabular-nums text-foreground">{value}</span>
    </div>
  )
}
