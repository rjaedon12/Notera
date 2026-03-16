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
                disabled && "cursor-default"
              )}
              style={{
                ...(state === "idle" ? {
                  background: "var(--glass-fill)",
                  borderColor: "var(--glass-border)",
                  color: "var(--foreground)",
                } : {}),
                ...(state === "correct" ? {
                  background: "rgba(16, 185, 129, 0.15)",
                  borderColor: "#10b981",
                  color: "#10b981",
                  transform: "scale(1.05)",
                } : {}),
                ...(state === "incorrect" ? {
                  background: "rgba(239, 68, 68, 0.15)",
                  borderColor: "#ef4444",
                  color: "#ef4444",
                } : {}),
                ...(state === "dimmed" ? {
                  background: "var(--muted)",
                  borderColor: "var(--glass-border)",
                  color: "var(--muted-foreground)",
                } : {}),
              }}
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
