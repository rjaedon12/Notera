"use client"

import { cn } from "@/lib/utils"

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"] as const

interface NoteKeyboardProps {
  /** Which button rows to show */
  showSharps?: boolean
  showFlats?: boolean
  /** The letter+accidental the user needs to match (e.g. { letter: "B", accidental: "flat" }) */
  correctAnswer: { letter: string; accidental: "sharp" | "flat" | "natural" | null }
  /** Currently selected answer (null = not yet answered) */
  selectedAnswer: { letter: string; accidental: "sharp" | "flat" | "natural" | null } | null
  /** Called when user taps a button */
  onSelect: (letter: string, accidental: "sharp" | "flat" | "natural") => void
  /** Whether input is disabled (after answering) */
  disabled?: boolean
}

export function NoteKeyboard({
  showSharps = true,
  showFlats = true,
  correctAnswer,
  selectedAnswer,
  onSelect,
  disabled = false,
}: NoteKeyboardProps) {
  function getButtonState(letter: string, accidental: "sharp" | "flat" | "natural") {
    if (!selectedAnswer) return "idle"

    const isThis =
      selectedAnswer.letter === letter &&
      (selectedAnswer.accidental ?? "natural") === accidental

    const isCorrect =
      correctAnswer.letter === letter &&
      (correctAnswer.accidental ?? "natural") === accidental

    if (isCorrect) return "correct"
    if (isThis && !isCorrect) return "incorrect"
    return "dimmed"
  }

  function renderRow(accidental: "sharp" | "natural" | "flat", suffix: string) {
    return (
      <div className="flex gap-2 justify-center">
        {LETTERS.map((letter) => {
          const state = getButtonState(letter, accidental)
          return (
            <button
              key={`${letter}${suffix}`}
              disabled={disabled}
              onClick={() => onSelect(letter, accidental)}
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-xl font-bold text-base sm:text-lg transition-all",
                "border-2 shadow-sm active:scale-95",
                state === "idle" && "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-700",
                state === "correct" && "bg-emerald-100 dark:bg-emerald-900/50 border-emerald-500 text-emerald-700 dark:text-emerald-300 scale-105",
                state === "incorrect" && "bg-red-100 dark:bg-red-900/50 border-red-400 text-red-600 dark:text-red-300",
                state === "dimmed" && "bg-zinc-100 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-600",
                disabled && "cursor-default"
              )}
            >
              {letter}
              {accidental === "sharp" && <span className="text-xs">♯</span>}
              {accidental === "flat" && <span className="text-xs">♭</span>}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {showSharps && renderRow("sharp", "#")}
      {renderRow("natural", "")}
      {showFlats && renderRow("flat", "b")}
    </div>
  )
}
