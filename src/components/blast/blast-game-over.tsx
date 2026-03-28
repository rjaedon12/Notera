"use client"

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Trophy, RotateCcw, ArrowLeft, Flame, Target, Blocks, Sparkles } from "lucide-react"
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
        {/* Hero icon */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
          className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: isPersonalBest
              ? "linear-gradient(135deg, #F59E0B, #D97706)"
              : "linear-gradient(135deg, #8B5CF6, #6D28D9)",
            boxShadow: isPersonalBest
              ? "0 8px 32px rgba(245,158,11,0.3)"
              : "0 8px 32px rgba(139,92,246,0.3)",
          }}
        >
          {isPersonalBest ? (
            <Trophy className="h-10 w-10 text-white" />
          ) : (
            <Blocks className="h-10 w-10 text-white" />
          )}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl font-bold text-white mb-1"
        >
          {isPersonalBest ? "New Personal Best!" : "Game Over"}
        </motion.h1>

        {isPersonalBest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-1 mb-2"
          >
            <Sparkles className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">Congratulations!</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </motion.div>
        )}

        {/* Score */}
        <motion.p
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 20 }}
          className="text-5xl font-extrabold mb-1 tabular-nums tracking-tight"
          style={{
            background: isPersonalBest
              ? "linear-gradient(135deg, #FCD34D, #F59E0B)"
              : "linear-gradient(135deg, #C4B5FD, #8B5CF6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {score.score.toLocaleString()}
        </motion.p>
        <p className="text-zinc-500 mb-6 text-sm font-medium">points</p>

        {/* Stats grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 gap-2.5 mb-6"
        >
          <StatCard
            icon={<Flame className="h-4 w-4 text-amber-400" />}
            label="Best combo"
            value={`×${score.bestCombo}`}
            color="amber"
          />
          <StatCard
            icon={<Blocks className="h-4 w-4 text-violet-400" />}
            label="Lines cleared"
            value={String(score.linesCleared)}
            color="violet"
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-cyan-400" />}
            label="Questions"
            value={String(score.questionsAnswered)}
            color="cyan"
          />
          <StatCard
            icon={<Target className="h-4 w-4 text-emerald-400" />}
            label="First-try"
            value={`${firstTryPct}%`}
            color="emerald"
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
            className="w-full h-12 gap-2 font-bold text-base rounded-xl bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20"
          >
            <RotateCcw className="h-4 w-4" />
            Play Again
          </Button>
          <Button
            variant="outline"
            onClick={onBack}
            size="lg"
            className="w-full h-11 gap-2 font-semibold rounded-xl border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
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
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3.5 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1">
        {icon}
        <span className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <span className="text-xl font-bold tabular-nums text-white">{value}</span>
    </div>
  )
}
