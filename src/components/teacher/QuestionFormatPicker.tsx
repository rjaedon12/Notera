"use client"

import { Shuffle, ListChecks } from "lucide-react"
import { cn } from "@/lib/utils"
import type { QuestionType } from "@/types/homework"
import { QUESTION_TYPE_LABELS } from "@/types/homework"

interface QuestionFormatPickerProps {
  selectedTypes: QuestionType[]
  onToggleType: (type: QuestionType, enabled: boolean) => void
  questionsPerSet: number
  onQuestionsPerSetChange: (n: number) => void
  shuffleQuestions: boolean
  onShuffleChange: (v: boolean) => void
}

const ALL_TYPES: QuestionType[] = [
  "term-to-definition",
  "definition-to-term",
  "multiple-choice",
  "matching",
  "fill-in-blank",
]

const QUESTIONS_OPTIONS = [5, 10, 15, 20, 0] // 0 = All

export function QuestionFormatPicker({
  selectedTypes,
  onToggleType,
  questionsPerSet,
  onQuestionsPerSetChange,
  shuffleQuestions,
  onShuffleChange,
}: QuestionFormatPickerProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ListChecks className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
        <h2 className="text-sm font-bold font-heading">Question Format</h2>
      </div>

      {/* Question type checkboxes */}
      <div className="space-y-2">
        {ALL_TYPES.map((type) => {
          const info = QUESTION_TYPE_LABELS[type]
          const checked = selectedTypes.includes(type)

          return (
            <label
              key={type}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                checked
                  ? "border-[var(--accent-color)]/40"
                  : "border-transparent hover:border-[var(--glass-border)]"
              )}
              style={{
                background: checked
                  ? "color-mix(in srgb, var(--accent-color) 6%, transparent)"
                  : "transparent",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onToggleType(type, e.target.checked)}
                className="accent-[var(--accent-color)] mt-0.5 w-4 h-4 rounded shrink-0"
              />
              <div>
                <span className="text-sm font-medium text-foreground block">
                  {info.label}
                </span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {info.description}
                </span>
              </div>
            </label>
          )
        })}
      </div>

      {/* Questions per set + shuffle */}
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
            Questions per type:
          </span>
          <select
            value={questionsPerSet}
            onChange={(e) => onQuestionsPerSetChange(Number(e.target.value))}
            className="px-2 py-1 rounded-lg text-sm bg-transparent border outline-none text-foreground"
            style={{ borderColor: "var(--glass-border)" }}
          >
            {QUESTIONS_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "All" : n}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={(e) => onShuffleChange(e.target.checked)}
            className="accent-[var(--accent-color)] w-4 h-4 rounded"
          />
          <Shuffle className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
          <span className="text-sm">Shuffle questions</span>
        </label>
      </div>
    </div>
  )
}
