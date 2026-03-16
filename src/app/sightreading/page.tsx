"use client"

import { useState, useCallback, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { Music, ArrowLeft, RotateCcw, ChevronRight, Trophy, Flame, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { StaffRenderer } from "@/components/sightreading/staff-renderer"
import { NoteKeyboard } from "@/components/sightreading/note-keyboard"
import {
  type Clef,
  type SightreadingNote,
  type DifficultyLevel,
  DIFFICULTY_LEVELS,
  getNotesForLevel,
  generateQuestions,
} from "@/lib/sightreading-notes"

type Phase = "select" | "playing" | "results"

export default function SightreadingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  // ─── Setup state ─────────────────────────────────────
  const [clef, setClef] = useState<Clef>("treble")
  const [level, setLevel] = useState<DifficultyLevel>(DIFFICULTY_LEVELS[0])
  const [questionCount, setQuestionCount] = useState<number>(DIFFICULTY_LEVELS[0].questionCount)
  const [phase, setPhase] = useState<Phase>("select")

  // ─── Playing state ───────────────────────────────────
  const [questions, setQuestions] = useState<SightreadingNote[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<{
    letter: string
    accidental: "sharp" | "flat" | "natural"
  } | null>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [saving, setSaving] = useState(false)

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login")
  }, [status, router])

  // ─── Start a round ───────────────────────────────────
  const startRound = useCallback(() => {
    const pool = getNotesForLevel(clef, level)
    const qs = generateQuestions(pool, questionCount)
    setQuestions(qs)
    setCurrentIndex(0)
    setCorrectCount(0)
    setSelectedAnswer(null)
    setIsRevealed(false)
    setPhase("playing")
  }, [clef, level, questionCount])

  // ─── Handle answer ──────────────────────────────────
  const handleSelect = useCallback(
    (letter: string, accidental: "sharp" | "flat" | "natural") => {
      if (isRevealed || !questions[currentIndex]) return

      const current = questions[currentIndex]
      const isCorrect =
        current.letter === letter &&
        (current.accidental ?? "natural") === accidental

      if (isCorrect) setCorrectCount((c) => c + 1)
      setSelectedAnswer({ letter, accidental })
      setIsRevealed(true)
    },
    [isRevealed, questions, currentIndex]
  )

  // ─── Advance to next question ───────────────────────
  const nextQuestion = useCallback(async () => {
    if (currentIndex + 1 >= questions.length) {
      // Round complete — save results
      setSaving(true)
      try {
        await fetch("/api/sightreading", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clef,
            level: level.id,
            correct: correctCount + (selectedAnswer ? 0 : 0), // already counted
            total: questions.length,
          }),
        })
        // Invalidate streak and analytics
        queryClient.invalidateQueries({ queryKey: ["streak"] })
        queryClient.invalidateQueries({ queryKey: ["analytics"] })
      } catch {
        // Silently handle — results still shown locally
      } finally {
        setSaving(false)
      }
      setPhase("results")
      return
    }

    setCurrentIndex((i) => i + 1)
    setSelectedAnswer(null)
    setIsRevealed(false)
  }, [currentIndex, questions.length, clef, level, correctCount, selectedAnswer, queryClient])

  // ─── Loading ─────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // ─── PHASE: Select clef + level ──────────────────────
  if (phase === "select") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-heading flex items-center gap-3">
            <Music className="h-8 w-8 text-primary" />
            Sightreading Practice
          </h1>
          <p className="text-muted-foreground mt-2">
            Identify notes on the staff as quickly as you can
          </p>
        </div>

        {/* Clef Selection */}
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: "var(--glass-border)",
            background: "var(--glass-fill)",
          }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Choose a Clef</h2>
          <div className="grid grid-cols-3 gap-3">
            {(["treble", "bass", "alto"] as Clef[]).map((c) => (
              <button
                key={c}
                onClick={() => setClef(c)}
                className={cn(
                  "rounded-xl border-2 p-4 text-center transition-all",
                  clef === c
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "hover:border-[var(--muted-foreground)]"
                )}
                style={clef !== c ? { borderColor: "var(--glass-border)" } : {}}
              >
                <div className="text-3xl mb-2">
                  {c === "treble" ? "𝄞" : c === "bass" ? "𝄢" : "𝄡"}
                </div>
                <div className="font-semibold text-foreground capitalize">{c} Clef</div>
              </button>
            ))}
          </div>
        </div>

        {/* Level Selection */}
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: "var(--glass-border)",
            background: "var(--glass-fill)",
          }}
        >
          <h2 className="text-lg font-semibold text-foreground mb-4">Choose Difficulty</h2>
          <div className="space-y-2">
            {DIFFICULTY_LEVELS.map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  setLevel(l)
                  setQuestionCount(l.questionCount)
                }}
                className={cn(
                  "w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all text-left",
                  level.id === l.id
                    ? "border-[var(--primary)] bg-[var(--primary)]/10"
                    : "hover:border-[var(--muted-foreground)]"
                )}
                style={level.id !== l.id ? { borderColor: "var(--glass-border)" } : {}}
              >
                <div>
                  <div className="font-semibold text-foreground">{l.label}</div>
                  <div className="text-sm text-muted-foreground">{l.description}</div>
                </div>
                <div
                  className={cn(
                    "text-sm font-medium whitespace-nowrap ml-4 px-2 py-0.5 rounded-full",
                    level.id === l.id
                      ? "bg-[var(--primary)] text-white"
                      : "text-muted-foreground"
                  )}
                >
                  {l.accidentals.join(" + ")}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Question Count */}
        <div
          className="rounded-xl border p-6"
          style={{
            borderColor: "var(--glass-border)",
            background: "var(--glass-fill)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Number of Questions</h2>
            <span
              className="text-2xl font-bold"
              style={{ color: "var(--primary)" }}
            >
              {questionCount}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[5, 10, 15, 20, 25, 30, 40, 50].map((n) => (
              <button
                key={n}
                onClick={() => setQuestionCount(n)}
                className={cn(
                  "w-12 h-10 rounded-lg font-semibold text-sm border-2 transition-all",
                  questionCount === n
                    ? "text-white border-[var(--primary)] bg-[var(--primary)]"
                    : "text-foreground"
                )}
                style={questionCount !== n ? { borderColor: "var(--glass-border)" } : {}}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={startRound}
          className="w-full py-4 rounded-xl font-bold text-lg text-white transition-all hover:opacity-90 active:scale-[0.98] flex items-center justify-center gap-2"
          style={{ background: "var(--primary)" }}
        >
          Start Practice
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    )
  }

  // ─── PHASE: Playing ──────────────────────────────────
  if (phase === "playing" && questions[currentIndex]) {
    const current = questions[currentIndex]
    const progress = ((currentIndex + 1) / questions.length) * 100
    const showSharps = level.accidentals.includes("sharp")
    const showFlats = level.accidentals.includes("flat")

    return (
      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Header: progress */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPhase("select")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="text-sm font-medium text-muted-foreground">
            {currentIndex + 1}/{questions.length}
            <span className="ml-3">
              {questions.length > 0
                ? Math.round(((currentIndex + (isRevealed ? 1 : 0)) / questions.length) * 100)
                : 0}
              %
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: "var(--primary)" }}
          />
        </div>

        {/* Staff card */}
        <div
          className="rounded-2xl border p-4 sm:p-6"
          style={{
            borderColor: "var(--glass-border)",
            background: "var(--glass-fill)",
          }}
        >
          <StaffRenderer note={current} clef={clef} />
        </div>

        {/* Feedback */}
        {isRevealed && (
          <div
            className={cn(
              "text-center py-2 rounded-xl font-semibold text-sm",
              selectedAnswer &&
                current.letter === selectedAnswer.letter &&
                (current.accidental ?? "natural") === selectedAnswer.accidental
                ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                : "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300"
            )}
          >
            {selectedAnswer &&
            current.letter === selectedAnswer.letter &&
            (current.accidental ?? "natural") === selectedAnswer.accidental
              ? "Correct! ✓"
              : `Incorrect — the answer is ${current.displayName}`}
          </div>
        )}

        {/* Keyboard */}
        <NoteKeyboard
          showSharps={showSharps}
          showFlats={showFlats}
          correctAnswer={current}
          selectedAnswer={selectedAnswer}
          onSelect={handleSelect}
          disabled={isRevealed}
        />

        {/* Next button */}
        {isRevealed && (
          <button
            onClick={nextQuestion}
            className="w-full py-3 rounded-xl font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--primary)" }}
          >
            {currentIndex + 1 >= questions.length ? "See Results" : "Next"}
          </button>
        )}
      </div>
    )
  }

  // ─── PHASE: Results ──────────────────────────────────
  if (phase === "results") {
    const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

    return (
      <div className="max-w-lg mx-auto px-4 py-10 space-y-8 text-center">
        <div
          className="rounded-2xl border p-8"
          style={{
            borderColor: "var(--glass-border)",
            background: "var(--glass-fill)",
          }}
        >
          <Trophy className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
          <h2 className="text-3xl font-bold text-foreground mb-2">Round Complete!</h2>
          <p className="text-muted-foreground mb-6">
            {clef.charAt(0).toUpperCase() + clef.slice(1)} Clef — {level.label}
          </p>

          <div className="text-6xl font-bold text-foreground mb-2">{pct}%</div>
          <p className="text-lg text-muted-foreground">
            {correctCount} / {questions.length} correct
          </p>

          {pct === 100 && (
            <div className="mt-4 flex items-center justify-center gap-2 text-amber-500">
              <Flame className="h-5 w-5" />
              <span className="font-semibold">Perfect score!</span>
              <Flame className="h-5 w-5" />
            </div>
          )}

          {saving && (
            <div className="mt-4 flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Saving...</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setPhase("select")
            }}
            className="flex-1 py-3 rounded-xl font-semibold border transition-all hover:bg-[var(--glass-fill-hover)]"
            style={{ borderColor: "var(--glass-border)" }}
          >
            <ArrowLeft className="h-4 w-4 inline mr-2" />
            Change Settings
          </button>
          <button
            onClick={startRound}
            className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            <RotateCcw className="h-4 w-4 inline mr-2" />
            Play Again
          </button>
        </div>
      </div>
    )
  }

  return null
}
