"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Volume2 } from "lucide-react"
import { speakText } from "@/lib/utils"

interface MultipleChoiceProps {
  prompt: string
  promptLabel: string
  options: string[]
  selectedAnswer: string | null
  correctAnswer: string
  showResult: boolean
  onSelect: (answer: string) => void
  onDontKnow: () => void
}

export function MultipleChoice({
  prompt,
  promptLabel,
  options,
  selectedAnswer,
  correctAnswer,
  showResult,
  onSelect,
  onDontKnow
}: MultipleChoiceProps) {
  return (
    <div className="space-y-6">
      {/* Prompt */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-muted-foreground">{promptLabel}</span>
          <button
            onClick={() => speakText(prompt)}
            className="p-1 hover:bg-muted rounded"
            aria-label="Read prompt aloud"
          >
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <p className="text-xl font-medium text-foreground">{prompt}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Choose an answer</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const isCorrect = option === correctAnswer
            
            let borderColor = "border-border"
            let bgColor = "bg-card hover:bg-muted"
            
            if (showResult) {
              if (isCorrect) {
                borderColor = "border-green-500"
                bgColor = "bg-green-50 dark:bg-green-900/20"
              } else if (isSelected && !isCorrect) {
                borderColor = "border-red-500"
                bgColor = "bg-red-50 dark:bg-red-900/20"
              }
            } else if (isSelected) {
              borderColor = "border-blue-500"
              bgColor = "bg-blue-50 dark:bg-blue-900/20"
            }
            
            return (
              <motion.button
                key={index}
                onClick={() => !showResult && onSelect(option)}
                disabled={showResult}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                  borderColor,
                  bgColor,
                  !showResult && "cursor-pointer"
                )}
                whileHover={!showResult ? { scale: 1.02 } : {}}
                whileTap={!showResult ? { scale: 0.98 } : {}}
              >
                <span className={cn(
                  "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                  showResult && isCorrect ? "bg-green-500 text-white" :
                  showResult && isSelected && !isCorrect ? "bg-red-500 text-white" :
                  isSelected ? "bg-blue-500 text-white" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                )}>
                  {index + 1}
                </span>
                <span className="flex-1 text-foreground">{option}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Don't Know Button */}
      {!showResult && (
        <div className="flex justify-center">
          <button
            onClick={onDontKnow}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            Don't know?
          </button>
        </div>
      )}

      {/* Result Message */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "text-center py-3 rounded-lg font-medium",
            selectedAnswer === correctAnswer 
              ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400"
          )}
        >
          {selectedAnswer === correctAnswer 
            ? "Correct!" 
            : `Incorrect. The answer is: ${correctAnswer}`}
        </motion.div>
      )}
    </div>
  )
}
