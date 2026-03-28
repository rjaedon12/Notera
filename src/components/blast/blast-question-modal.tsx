"use client"

import { useState, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { BlastQuestion, AnswerMode } from "@/lib/blast"

interface BlastQuestionModalProps {
  question: BlastQuestion
  answerMode: AnswerMode
  onSubmit: (answer: string) => "correct" | "close" | "wrong"
}

export function BlastQuestionModal({
  question,
  answerMode,
  onSubmit,
}: BlastQuestionModalProps) {
  const [typedAnswer, setTypedAnswer] = useState("")
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<
    "correct" | "close" | "wrong" | null
  >(null)
  const [showingFeedback, setShowingFeedback] = useState(false)

  // Reset when question changes
  useEffect(() => {
    setTypedAnswer("")
    setSelectedOption(null)
    setFeedback(null)
    setShowingFeedback(false)
  }, [question])

  const handleSubmitMC = useCallback(
    (option: string) => {
      if (showingFeedback) return
      setSelectedOption(option)
      const result = onSubmit(option)
      setFeedback(result)
      setShowingFeedback(true)

      if (result === "wrong") {
        // After feedback delay, reset for retry with a new question
        setTimeout(() => {
          setSelectedOption(null)
          setFeedback(null)
          setShowingFeedback(false)
        }, 800)
      }
      // Correct: the parent will transition phase, unmounting this component
    },
    [onSubmit, showingFeedback]
  )

  const handleSubmitTyped = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (showingFeedback || !typedAnswer.trim()) return

      const result = onSubmit(typedAnswer.trim())
      setFeedback(result)
      setShowingFeedback(true)

      if (result === "wrong") {
        setTimeout(() => {
          setTypedAnswer("")
          setFeedback(null)
          setShowingFeedback(false)
        }, 800)
      }
    },
    [onSubmit, typedAnswer, showingFeedback]
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-lg"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className={cn(
          "w-full max-w-sm mx-4 rounded-2xl p-6 border-2",
          feedback === "correct" || feedback === "close"
            ? "bg-green-950 border-green-500"
            : feedback === "wrong"
              ? "bg-red-950 border-red-500 animate-shake"
              : "bg-zinc-900 border-zinc-700"
        )}
      >
        {/* Prompt */}
        <div className="mb-1">
          <span className="text-xs uppercase tracking-wider text-zinc-400">
            {question.promptType === "term" ? "Term" : "Definition"}
          </span>
        </div>
        <p className="text-lg font-semibold text-white mb-5">
          {question.prompt}
        </p>

        {/* Feedback banner */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "text-center text-sm font-medium py-2 rounded-lg mb-4",
                feedback === "correct"
                  ? "bg-green-500/20 text-green-300"
                  : feedback === "close"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
              )}
            >
              {feedback === "correct"
                ? "Correct!"
                : feedback === "close"
                  ? "Close enough!"
                  : "Incorrect — try again!"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* MC Options */}
        {answerMode === "mc" && question.options && (
          <div className="grid grid-cols-1 gap-2">
            {question.options.map((option, i) => {
              const isSelected = selectedOption === option
              const isCorrect = option === question.correctAnswer
              const showFb = showingFeedback

              let bg = "bg-zinc-800 hover:bg-zinc-700 border-zinc-600"
              if (showFb && isCorrect) {
                bg = "bg-green-900 border-green-500"
              } else if (showFb && isSelected && !isCorrect) {
                bg = "bg-red-900 border-red-500"
              } else if (isSelected) {
                bg = "bg-zinc-700 border-white"
              }

              return (
                <motion.button
                  key={i}
                  onClick={() => handleSubmitMC(option)}
                  disabled={showFb}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border text-left transition-colors",
                    bg
                  )}
                  whileHover={!showFb ? { scale: 1.02 } : {}}
                  whileTap={!showFb ? { scale: 0.97 } : {}}
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-md bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300">
                    {i + 1}
                  </span>
                  <span className="text-sm text-zinc-100">{option}</span>
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
              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-500"
            />
            <Button
              type="submit"
              disabled={!typedAnswer.trim() || showingFeedback}
              className="w-full"
            >
              Submit
            </Button>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}
