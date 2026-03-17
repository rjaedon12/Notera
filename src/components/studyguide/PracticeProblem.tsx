"use client"

import { Card } from "@/components/ui/card"
import { useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, RotateCcw, Lightbulb, ChevronDown } from "lucide-react"
import { LatexRenderer } from "./LatexRenderer"
import type { GuideProblem, GuideProblemProgress } from "@/types/studyguide"

interface PracticeProblemProps {
  problem: GuideProblem
  questionText: string
  existingProgress: GuideProblemProgress | null
  onSubmit: (problemId: string, choiceId: string, isCorrect: boolean) => void
}

export function PracticeProblem({
  problem,
  questionText,
  existingProgress,
  onSubmit,
}: PracticeProblemProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    existingProgress?.selectedChoiceId ?? null
  )
  const [submitted, setSubmitted] = useState(!!existingProgress)
  const [showSolution, setShowSolution] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const isCorrect = selectedId === problem.correctAnswerId
  const wasAlreadyCorrect = existingProgress?.isCorrect ?? false

  const handleSelect = (choiceId: string) => {
    if (submitted) return
    setSelectedId(choiceId)
  }

  const handleSubmit = useCallback(() => {
    if (!selectedId || submitted) return
    setSubmitted(true)
    const correct = selectedId === problem.correctAnswerId
    onSubmit(problem.id, selectedId, correct)
  }, [selectedId, submitted, problem, onSubmit])

  const handleRetry = () => {
    setSelectedId(null)
    setSubmitted(false)
    setShowSolution(false)
    setShowHint(false)
  }

  const difficultyColors = {
    easy: { bg: "rgba(16, 185, 129, 0.1)", text: "#10b981" },
    medium: { bg: "rgba(245, 158, 11, 0.1)", text: "#f59e0b" },
    hard: { bg: "rgba(239, 68, 68, 0.1)", text: "#ef4444" },
  }
  const dc = difficultyColors[problem.difficulty]

  return (
    <Card className="overflow-hidden">
      <div style={{ borderLeft: "4px solid var(--primary)" }} className="px-1">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                style={{ background: "rgba(var(--primary-rgb, 0, 122, 255), 0.12)", color: "var(--primary)" }}
              >
                ?
              </div>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
                Practice Problem
              </span>
            </div>
            <span
              className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full"
              style={{ background: dc.bg, color: dc.text }}
            >
              {problem.difficulty}
            </span>
          </div>

          {/* Question */}
          <div className="text-sm leading-relaxed font-medium">
            <LatexRenderer content={questionText} />
          </div>

          {/* Hint */}
          {problem.hint && !submitted && (
            <button
              onClick={() => setShowHint((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors hover:bg-[var(--glass-fill)]"
              style={{ color: "#f59e0b" }}
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {showHint ? "Hide hint" : "Show hint"}
            </button>
          )}
          {showHint && problem.hint && (
            <div
              className="text-sm rounded-xl p-3"
              style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.15)" }}
            >
              <LatexRenderer content={problem.hint} />
            </div>
          )}

          {/* Choices */}
          <div className="grid gap-2">
            {problem.choices.map((choice, idx) => {
              const isSelected = selectedId === choice.id
              const isAnswer = choice.id === problem.correctAnswerId
              let borderColor = "var(--glass-border)"
              let bgColor = "transparent"
              let iconEl: React.ReactNode = null

              if (submitted) {
                if (isAnswer) {
                  borderColor = "#10b981"
                  bgColor = "rgba(16, 185, 129, 0.06)"
                  iconEl = <Check className="h-4 w-4" style={{ color: "#10b981" }} />
                } else if (isSelected && !isAnswer) {
                  borderColor = "#ef4444"
                  bgColor = "rgba(239, 68, 68, 0.06)"
                  iconEl = <X className="h-4 w-4" style={{ color: "#ef4444" }} />
                }
              } else if (isSelected) {
                borderColor = "var(--accent-color)"
                bgColor = "color-mix(in srgb, var(--accent-color) 6%, transparent)"
              }

              return (
                <motion.button
                  key={choice.id}
                  onClick={() => handleSelect(choice.id)}
                  disabled={submitted}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl text-left text-sm transition-all",
                    !submitted && "cursor-pointer"
                  )}
                  style={{
                    border: `1.5px solid ${borderColor}`,
                    background: bgColor,
                  }}
                  whileHover={!submitted ? { scale: 1.01 } : {}}
                  whileTap={!submitted ? { scale: 0.99 } : {}}
                >
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold"
                    style={{
                      background: isSelected && !submitted
                        ? "var(--accent-color)"
                        : submitted && isAnswer
                        ? "#10b981"
                        : submitted && isSelected
                        ? "#ef4444"
                        : "var(--muted)",
                      color: (isSelected && !submitted) || (submitted && (isAnswer || isSelected))
                        ? "#fff"
                        : "var(--foreground)",
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1">
                    <LatexRenderer content={choice.text} />
                  </span>
                  {iconEl}
                </motion.button>
              )
            })}
          </div>

          {/* Submit / Retry / Result */}
          <div className="flex items-center gap-3">
            {!submitted && (
              <button
                onClick={handleSubmit}
                disabled={!selectedId}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all",
                  selectedId
                    ? "glass-btn"
                    : "opacity-40 cursor-not-allowed"
                )}
                style={{
                  background: selectedId ? "var(--primary)" : "var(--muted)",
                  color: selectedId ? "var(--primary-foreground)" : "var(--muted-foreground)",
                }}
              >
                Check Answer
              </button>
            )}

            {submitted && (
              <>
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-center",
                    )}
                    style={{
                      background: isCorrect || wasAlreadyCorrect
                        ? "rgba(16, 185, 129, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                      color: isCorrect || wasAlreadyCorrect ? "#10b981" : "#ef4444",
                    }}
                  >
                    {isCorrect || wasAlreadyCorrect ? "✓ Correct!" : "✗ Incorrect"}
                  </motion.div>
                </AnimatePresence>

                {!isCorrect && !wasAlreadyCorrect && (
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--glass-fill)]"
                    style={{ color: "var(--accent-color)" }}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                )}
              </>
            )}
          </div>

          {/* Solution reveal */}
          {submitted && (
            <div>
              <button
                onClick={() => setShowSolution((v) => !v)}
                className="flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors hover:bg-[var(--glass-fill)]"
                style={{ color: "var(--accent-color)" }}
              >
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showSolution && "rotate-180")} />
                {showSolution ? "Hide solution" : "View full solution"}
              </button>

              <AnimatePresence>
                {showSolution && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2"
                  >
                    <div
                      className="rounded-xl p-4 text-sm leading-relaxed"
                      style={{
                        background: "var(--muted)",
                        border: "1px solid var(--glass-border)",
                      }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-2" style={{ color: "var(--muted-foreground)" }}>
                        Solution
                      </span>
                      <LatexRenderer content={problem.solution} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
