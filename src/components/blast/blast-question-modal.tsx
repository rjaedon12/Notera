"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react"
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
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 12 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "w-full max-w-md mx-4 rounded-2xl p-6 border",
          feedback === "correct" || feedback === "close"
            ? "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800"
            : isWrongReview
              ? "bg-red-50 dark:bg-red-950/80 border-red-200 dark:border-red-800"
              : "bg-[var(--card)] border-[var(--glass-border)]"
        )}
        style={{ boxShadow: "var(--glass-shadow)" }}
      >
        {/* Prompt label */}
        <div className="mb-1.5">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
            {question.promptType === "term" ? "Term" : "Definition"}
          </span>
        </div>
        <p className="text-xl font-bold text-foreground mb-5 leading-snug">
          {question.prompt}
        </p>

        {/* Wrong answer review */}
        {isWrongReview ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {userWrongAnswer && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                <XCircle className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-0.5">Your answer</p>
                  <p className="text-sm text-red-700 dark:text-red-300 line-through">{userWrongAnswer}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-0.5">Correct answer</p>
                <p className="text-base font-semibold text-emerald-700 dark:text-emerald-200">{question.correctAnswer}</p>
              </div>
            </div>

            {answerMode === "mc" && question.options && (
              <div className="grid grid-cols-1 gap-1.5 mt-2">
                {question.options.map((option, i) => {
                  const isCorrect = option === question.correctAnswer
                  const isWrong = option === userWrongAnswer && !isCorrect

                  return (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-lg border text-left text-sm",
                        isCorrect
                          ? "bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-200"
                          : isWrong
                            ? "bg-red-100 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-300 line-through"
                            : "bg-[var(--muted)] border-[var(--glass-border)] text-muted-foreground"
                      )}
                    >
                      <span className={cn(
                        "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                        isCorrect ? "bg-emerald-200 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                          : isWrong ? "bg-red-200 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                          : "bg-[var(--muted)] text-muted-foreground"
                      )}>
                        {isCorrect ? "✓" : isWrong ? "✗" : i + 1}
                      </span>
                      <span>{option}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <Button
              onClick={onAcknowledgeWrong}
              className="w-full gap-2 font-semibold mt-2"
              size="lg"
            >
              Got it
              <ArrowRight className="h-4 w-4" />
            </Button>
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
                  className="text-center text-sm font-semibold py-2.5 rounded-lg mb-4 bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
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
                        "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-colors",
                        showFb && isCorrect
                          ? "bg-emerald-100 dark:bg-emerald-500/15 border-emerald-300 dark:border-emerald-500/40"
                          : isSelected && !showFb
                            ? "bg-[var(--primary)]/10 border-[var(--primary)]/40"
                            : "bg-[var(--glass-fill)] border-[var(--glass-border)] hover:bg-[var(--glass-fill-hover)]"
                      )}
                      whileTap={!showFb ? { scale: 0.98 } : {}}
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-[var(--muted)] flex items-center justify-center text-xs font-bold text-muted-foreground">
                        {i + 1}
                      </span>
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
