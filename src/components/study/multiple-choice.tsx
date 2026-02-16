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
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm text-slate-500">{promptLabel}</span>
          <button
            onClick={() => speakText(prompt)}
            className="p-1 hover:bg-slate-100 rounded"
            aria-label="Read prompt aloud"
          >
            <Volume2 className="h-4 w-4 text-slate-400" />
          </button>
        </div>
        <p className="text-xl font-medium text-slate-900">{prompt}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <p className="text-sm text-blue-600 font-medium">Choose an answer</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option
            const isCorrect = option === correctAnswer
            
            let borderColor = "border-slate-200"
            let bgColor = "bg-white hover:bg-slate-50"
            
            if (showResult) {
              if (isCorrect) {
                borderColor = "border-green-500"
                bgColor = "bg-green-50"
              } else if (isSelected && !isCorrect) {
                borderColor = "border-red-500"
                bgColor = "bg-red-50"
              }
            } else if (isSelected) {
              borderColor = "border-blue-500"
              bgColor = "bg-blue-50"
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
                  isSelected ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
                )}>
                  {index + 1}
                </span>
                <span className="flex-1 text-slate-900">{option}</span>
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
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
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
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
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
