"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight } from "lucide-react"
import type { BlastQuestion, AnswerMode } from "@/lib/blast"

interface BlastQuestionModalProps {
  question: BlastQuestion
  answerMode: AnswerMode
  showingCorrectAnswer: boolean
  onSubmit: (answer: string) => "correct" | "close" | "wrong"
  onAcknowledgeWrong: () => void
}

export function BlastQuestionModal({
  question,
  answerMode,
  showingCorrectAnswer,
  onSubmit,
  onAcknowledgeWrong,
}: BlastQuestionModalProps) {
  const [typedAnswer, setTypedAnswer] = useState("")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<
    "correct" | "close" | "wrong" | null
  >(null)
  const [showingFeedback, setShowingFeedback] = useState(false)
  const [userWrongAnswer, setUserWrongAnswer] = useState<string | null>(null)

  useEffect(() => {
    if (showingCorrectAnswer && feedback !== "wrong") {
      setFeedback("wrong")
      setShowingFeedback(true)
    }
  }, [showingCorrectAnswer, feedback])

  useEffect(() => {
    setTypedAnswer("")
    setSelectedOption(null)
    setFeedback(null)
    setShowingFeedback(false)
    setUserWrongAnswer(null)
  }, [question])

  // Enter key to acknowledge wrong answer
  useEffect(() => {
    if (feedback !== "wrong" || !showingFeedback) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault()
        onAcknowledgeWrong()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [feedback, showingFeedback, onAcknowledgeWrong])

  const handleSubmitMC = useCallback(
    (option: string) => {
      if (showingFeedback) return
      setSelectedOption(option)
      const result = onSubmit(option)
      setFeedback(result)
      setShowingFeedback(true)
      if (result === "wrong") setUserWrongAnswer(option)
    },
    [onSubmit, showingFeedback]
  )

  const handleSubmitTyped = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (showingFeedback || !typedAnswer.trim()) return
      const answer = typedAnswer.trim()
      const result = onSubmit(answer)
      setFeedback(result)
      setShowingFeedback(true)
      if (result === "wrong") setUserWrongAnswer(answer)
    },
    [onSubmit, typedAnswer, showingFeedback]
  )

  const isWrongReview = feedback === "wrong" && showingFeedback

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "w-full max-w-sm mx-6 rounded-2xl p-5 border",
          "bg-[var(--card)] border-[var(--glass-border)]"
        )}
        style={{ boxShadow: "var(--glass-shadow)" }}
      >
        {/* Prompt */}
        <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
          {question.promptType === "term" ? "Term" : "Definition"}
        </p>
        <p className="text-lg font-semibold text-foreground mb-4 leading-snug">
          {question.prompt}
        </p>

        {/* Wrong answer review — minimal: just show correct answer + continue */}
        {isWrongReview ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="rounded-xl p-4 bg-[var(--muted)] text-center">
              <p className="text-xs text-muted-foreground font-medium mb-1">Correct answer</p>
              <p className="text-base font-semibold text-foreground">{question.correctAnswer}</p>
            </div>

            <Button
              onClick={onAcknowledgeWrong}
              className="w-full gap-2 font-semibold"
              size="lg"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-[11px] text-center text-muted-foreground">or press Enter</p>
          </motion.div>
        ) : (
          <>
            {/* Feedback banner */}
            <AnimatePresence>
              {feedback && feedback !== "wrong" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center text-sm font-semibold py-2 rounded-lg mb-3 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                >
                  {feedback === "correct" ? "Correct!" : "Close enough!"}
                </motion.div>
              )}
            </AnimatePresence>

            {/* MC Options */}
            {answerMode === "mc" && question.options && (
              <div className="grid grid-cols-1 gap-2">
                {question.options.map((option, i) => {
                  const isSelected = selectedOption === option
                  const isCorrect = option === question.correctAnswer
                  const showFb = showingFeedback && feedback !== "wrong"

                  return (
                    <motion.button
                      key={i}
                      onClick={() => handleSubmitMC(option)}
                      disabled={showFb}
                      className={cn(
                        "flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-colors",
                        showFb && isCorrect
                          ? "bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40"
                          : isSelected && !showFb
                            ? "bg-[var(--primary)]/10 border-[var(--primary)]/40"
                            : "bg-[var(--glass-fill)] border-[var(--glass-border)] hover:bg-[var(--glass-fill-hover)]"
                      )}
                      whileTap={!showFb ? { scale: 0.98 } : {}}
                    >
                      <span className="text-sm font-medium text-foreground">{option}</span>
                    </motion.button>
                  )
                })}
              </div>
            )}

            {/* Typed answer */}
            {answerMode === "typed" && (
              <form onSubmit={handleSubmitTyped} className="space-y-3">
                <Input
                  autoFocus
                  placeholder="Type your answer…"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  disabled={showingFeedback}
                  className="h-12 text-base rounded-xl"
                />
                <Button
                  type="submit"
                  disabled={!typedAnswer.trim() || showingFeedback}
                  className="w-full h-11 font-semibold rounded-xl"
                >
                  Submit
                </Button>
              </form>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
