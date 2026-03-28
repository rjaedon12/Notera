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

  // Sync external showingCorrectAnswer into local state
  useEffect(() => {
    if (showingCorrectAnswer && feedback !== "wrong") {
      setFeedback("wrong")
      setShowingFeedback(true)
    }
  }, [showingCorrectAnswer, feedback])

  // Reset when question identity changes (new question served)
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

      if (result === "wrong") {
        setUserWrongAnswer(option)
        // Don't auto-reset — wait for user to click "Got it"
      }
      // Correct: the parent will transition phase, unmounting this component
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

      if (result === "wrong") {
        setUserWrongAnswer(answer)
        // Don't auto-reset — wait for user to click "Got it"
      }
    },
    [onSubmit, typedAnswer, showingFeedback]
  )

  const isWrongReview = feedback === "wrong" && showingFeedback

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-lg"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)" }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 16 }}
        transition={{ type: "spring", stiffness: 420, damping: 32 }}
        className={cn(
          "w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl border",
          feedback === "correct" || feedback === "close"
            ? "bg-emerald-950/90 border-emerald-500/60"
            : isWrongReview
              ? "bg-red-950/90 border-red-500/60 animate-shake"
              : "bg-zinc-900/95 border-zinc-700/50"
        )}
      >
        {/* Prompt label */}
        <div className="mb-1.5">
          <span className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400">
            {question.promptType === "term" ? "Term" : "Definition"}
          </span>
        </div>
        <p className="text-xl font-bold text-white mb-5 leading-snug">
          {question.prompt}
        </p>

        {/* ── Wrong answer review state ── */}
        {isWrongReview ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            {/* User's wrong answer */}
            {userWrongAnswer && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/15 border border-red-500/30">
                <XCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-red-400 font-medium mb-0.5">Your answer</p>
                  <p className="text-sm text-red-200 line-through">{userWrongAnswer}</p>
                </div>
              </div>
            )}

            {/* Correct answer */}
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30">
              <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-400 font-medium mb-0.5">Correct answer</p>
                <p className="text-base font-semibold text-emerald-200">{question.correctAnswer}</p>
              </div>
            </div>

            {/* MC: also show full options with highlights */}
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
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-200"
                          : isWrong
                            ? "bg-red-500/10 border-red-500/30 text-red-300 line-through"
                            : "bg-zinc-800/50 border-zinc-700/30 text-zinc-500"
                      )}
                    >
                      <span className={cn(
                        "flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                        isCorrect ? "bg-emerald-500/20 text-emerald-400"
                          : isWrong ? "bg-red-500/20 text-red-400"
                          : "bg-zinc-700/50 text-zinc-500"
                      )}>
                        {isCorrect ? "✓" : isWrong ? "✗" : i + 1}
                      </span>
                      <span>{option}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* "Got it" button */}
            <Button
              onClick={onAcknowledgeWrong}
              className="w-full gap-2 bg-zinc-100 text-zinc-900 hover:bg-white font-semibold mt-2"
              size="lg"
            >
              Got it
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Feedback banner (correct/close only) */}
            <AnimatePresence>
              {feedback && feedback !== "wrong" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-center text-sm font-semibold py-2.5 rounded-lg mb-4 bg-emerald-500/20 text-emerald-300"
                >
                  {feedback === "correct" ? "✓ Correct!" : "✓ Close enough!"}
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

                  let bg = "bg-zinc-800/70 hover:bg-zinc-700/70 border-zinc-700/50"
                  if (showFb && isCorrect) {
                    bg = "bg-emerald-500/20 border-emerald-500/60"
                  } else if (isSelected && !showFb) {
                    bg = "bg-violet-500/15 border-violet-500/50"
                  }

                  return (
                    <motion.button
                      key={i}
                      onClick={() => handleSubmitMC(option)}
                      disabled={showFb}
                      className={cn(
                        "flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-150",
                        bg
                      )}
                      whileHover={!showFb ? { scale: 1.015 } : {}}
                      whileTap={!showFb ? { scale: 0.975 } : {}}
                    >
                      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-zinc-700/60 flex items-center justify-center text-xs font-bold text-zinc-300">
                        {i + 1}
                      </span>
                      <span className="text-sm font-medium text-zinc-100">{option}</span>
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
                  className="bg-zinc-800/70 border-zinc-700/50 text-white placeholder:text-zinc-500 h-12 text-base rounded-xl focus-visible:ring-violet-500/50"
                />
                <Button
                  type="submit"
                  disabled={!typedAnswer.trim() || showingFeedback}
                  className="w-full h-11 font-semibold bg-violet-600 hover:bg-violet-500 text-white rounded-xl"
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
