"use client"

import { use, useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useStudySet, useSaveSession } from "@/hooks/useStudy"
import { StudyHeader } from "@/components/study/study-controls"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { motion, AnimatePresence } from "framer-motion"
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRightLeft,
  ArrowRight,
  Keyboard,
  Volume2,
} from "lucide-react"
import { cn, shuffleArray, speakText } from "@/lib/utils"
import { matchAnswer, type MatchResult } from "@/lib/levenshtein"

// ─── Types ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ setId: string }>
}

interface SRSCardItem {
  flashcard: { id: string; front: string; back: string }
  progress: {
    id: string
    userId: string
    flashcardId: string
    due: string
    stability: number
    difficulty: number
    elapsedDays: number
    scheduledDays: number
    reps: number
    lapses: number
    state: number
    lastReview: string | null
  } | null
}

type RatingValue = 1 | 2 | 3 | 4

/** Bucket a card lives in during the session. */
type Bucket = "new" | "learning" | "familiar" | "known"

/** Internal card state tracked per-session (not persisted). */
interface LearnCard {
  item: SRSCardItem
  bucket: Bucket
  /** How many times the card has been answered correctly via MC */
  mcCorrect: number
  /** Whether the card has graduated to written mode */
  writtenMode: boolean
  /** Times seen this session */
  timesShown: number
}

/** What the user is currently doing with a card */
type QuestionMode = "mc" | "written"

// ─── Constants ──────────────────────────────────────────────────────────────────

const ROUND_SIZE = 7
const MC_CORRECT_TO_GRADUATE = 1 // correct once in MC → graduate to written
const WRITTEN_CORRECT_TO_MASTER = 1 // correct once in written → mark known

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Pick `n` unique random distractors from `pool`, excluding `exclude`. */
function pickDistractors(pool: string[], exclude: string, n: number): string[] {
  const candidates = pool.filter((s) => s !== exclude)
  return shuffleArray(candidates).slice(0, n)
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function LearnPage({ params }: PageProps) {
  const { setId } = use(params)
  const router = useRouter()
  const { data: set, isLoading: isSetLoading } = useStudySet(setId)
  const saveSession = useSaveSession()

  // ── Core state ──────────────────────────────────────────────────────────────
  const [allCards, setAllCards] = useState<LearnCard[]>([])
  const [roundQueue, setRoundQueue] = useState<LearnCard[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [roundNumber, setRoundNumber] = useState(1)
  const [isLoadingCards, setIsLoadingCards] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isComplete, setIsComplete] = useState(false)
  const [showRoundSummary, setShowRoundSummary] = useState(false)
  const [startTime] = useState(() => Date.now())

  // ── Prompt direction (term → def or def → term) ────────────────────────────
  const [promptWithTerm, setPromptWithTerm] = useState(true)

  // ── Current question state ──────────────────────────────────────────────────
  const [questionMode, setQuestionMode] = useState<QuestionMode>("mc")
  const [mcOptions, setMcOptions] = useState<string[]>([])
  const [selectedMcAnswer, setSelectedMcAnswer] = useState<string | null>(null)
  const [writtenAnswer, setWrittenAnswer] = useState("")
  const [answerResult, setAnswerResult] = useState<MatchResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  // ── Derived ─────────────────────────────────────────────────────────────────
  const currentCard = roundQueue[currentIdx] ?? null
  const totalSessionCards = allCards.length

  const bucketCounts = useMemo(() => {
    const counts = { new: 0, learning: 0, familiar: 0, known: 0 }
    allCards.forEach((c) => counts[c.bucket]++)
    return counts
  }, [allCards])

  const totalReviewed = allCards.filter((c) => c.timesShown > 0).length

  /** All answer strings from all loaded cards — used for MC distractors. */
  const allAnswerPool = useMemo(() => {
    return allCards.map((c) =>
      promptWithTerm ? c.item.flashcard.back : c.item.flashcard.front
    )
  }, [allCards, promptWithTerm])

  // ── Fetch due cards from SRS API ────────────────────────────────────────────
  const fetchDueCards = useCallback(async (forceAll = false) => {
    setIsLoadingCards(true)
    setFetchError(null)
    try {
      const url = forceAll
        ? `/api/srs/due?setId=${setId}&forceAll=true`
        : `/api/srs/due?setId=${setId}`
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to fetch cards")
      }
      const data: { cards: SRSCardItem[] } = await res.json()
      if (data.cards.length === 0) {
        setIsComplete(true)
        setIsLoadingCards(false)
        return
      }

      const learnCards: LearnCard[] = data.cards.map((item) => ({
        item,
        bucket: item.progress === null ? "new" : determineBucket(item),
        mcCorrect: 0,
        writtenMode: false,
        timesShown: 0,
      }))

      setAllCards(learnCards)
      buildRound(learnCards, 1)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Failed to load cards")
    } finally {
      setIsLoadingCards(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setId])

  useEffect(() => {
    fetchDueCards()
  }, [fetchDueCards])

  /** Determine initial bucket from FSRS progress state. */
  function determineBucket(item: SRSCardItem): Bucket {
    if (!item.progress) return "new"
    // FSRS states: 0=New, 1=Learning, 2=Review, 3=Relearning
    const state = item.progress.state
    if (state === 0) return "new"
    if (state === 1 || state === 3) return "learning"
    if (item.progress.stability > 5) return "familiar"
    return "learning"
  }

  // ── Build a round of ~ROUND_SIZE cards ──────────────────────────────────────
  function buildRound(cards: LearnCard[], roundNum: number) {
    const notKnown = cards.filter((c) => c.bucket !== "known")
    if (notKnown.length === 0) {
      setIsComplete(true)
      return
    }

    // Priority: learning > new > familiar
    const prioritized = [
      ...shuffleArray(notKnown.filter((c) => c.bucket === "learning")),
      ...shuffleArray(notKnown.filter((c) => c.bucket === "new")),
      ...shuffleArray(notKnown.filter((c) => c.bucket === "familiar")),
    ]

    const round = prioritized.slice(0, ROUND_SIZE)
    const shuffled = shuffleArray(round)
    setRoundQueue(shuffled)
    setCurrentIdx(0)
    setRoundNumber(roundNum)
    setShowRoundSummary(false)
    setupQuestion(shuffled[0], cards)
  }

  // ── Set up a question for the current card ──────────────────────────────────
  function setupQuestion(card: LearnCard | undefined, cardsForPool?: LearnCard[]) {
    if (!card) return

    setSelectedMcAnswer(null)
    setWrittenAnswer("")
    setAnswerResult(null)
    setShowResult(false)

    const mode: QuestionMode = card.writtenMode ? "written" : "mc"
    setQuestionMode(mode)

    if (mode === "mc") {
      const pool = (cardsForPool ?? allCards).map((c) =>
        promptWithTerm ? c.item.flashcard.back : c.item.flashcard.front
      )
      const correctAnswer = promptWithTerm
        ? card.item.flashcard.back
        : card.item.flashcard.front
      const distractors = pickDistractors(pool, correctAnswer, 3)
      setMcOptions(shuffleArray([correctAnswer, ...distractors]))
    }

    if (mode === "written") {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  // ── Submit SRS review to backend ────────────────────────────────────────────
  async function submitReview(flashcardId: string, rating: RatingValue) {
    setIsSubmittingReview(true)
    try {
      await fetch("/api/srs/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId, rating }),
      })
    } catch (err) {
      console.error("Review submission error:", err)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  // ── Handle MC answer selection ──────────────────────────────────────────────
  function handleMcSelect(option: string) {
    if (showResult || !currentCard) return
    setSelectedMcAnswer(option)

    const correctAnswer = promptWithTerm
      ? currentCard.item.flashcard.back
      : currentCard.item.flashcard.front
    const isCorrect = option === correctAnswer

    setAnswerResult(isCorrect ? "exact" : "wrong")
    setShowResult(true)
    updateCardAfterAnswer(currentCard, isCorrect ? "exact" : "wrong")
  }

  // ── Handle "Don't know" ─────────────────────────────────────────────────────
  function handleDontKnow() {
    if (showResult || !currentCard) return

    const correctAnswer = promptWithTerm
      ? currentCard.item.flashcard.back
      : currentCard.item.flashcard.front
    setSelectedMcAnswer(correctAnswer)
    setAnswerResult("wrong")
    setShowResult(true)
    updateCardAfterAnswer(currentCard, "wrong")
  }

  // ── Handle written answer submission ────────────────────────────────────────
  function handleWrittenSubmit() {
    if (showResult || !currentCard || writtenAnswer.trim() === "") return

    const correctAnswer = promptWithTerm
      ? currentCard.item.flashcard.back
      : currentCard.item.flashcard.front

    const result = matchAnswer(writtenAnswer, correctAnswer)
    setAnswerResult(result)
    setShowResult(true)
    updateCardAfterAnswer(currentCard, result)
  }

  // ── Update a card's bucket & counters after an answer ───────────────────────
  function updateCardAfterAnswer(card: LearnCard, result: MatchResult) {
    setAllCards((prev) =>
      prev.map((c) => {
        if (c.item.flashcard.id !== card.item.flashcard.id) return c
        const updated = { ...c, timesShown: c.timesShown + 1 }

        if (result === "exact" || result === "close") {
          if (!c.writtenMode) {
            // MC mode — increment correct count, graduate to written
            updated.mcCorrect = c.mcCorrect + 1
            if (updated.mcCorrect >= MC_CORRECT_TO_GRADUATE) {
              updated.writtenMode = true
              updated.bucket = "familiar"
            } else {
              updated.bucket = "familiar"
            }
          } else {
            // Written mode correct → mark known
            updated.bucket = "known"
          }
        } else {
          // Wrong — demote back to learning, reset graduation
          updated.bucket = "learning"
          updated.mcCorrect = 0
          updated.writtenMode = false
        }
        return updated
      })
    )

    // Submit FSRS rating
    const rating: RatingValue =
      result === "wrong" ? 1 : result === "close" ? 3 : card.writtenMode ? 4 : 3
    submitReview(card.item.flashcard.id, rating)
  }

  // ── Advance to next card or end round ───────────────────────────────────────
  function handleContinue() {
    if (currentIdx >= roundQueue.length - 1) {
      // End of round — check if all mastered
      const remaining = allCards.filter((c) => c.bucket !== "known")
      if (remaining.length === 0) {
        finishSession()
      } else {
        setShowRoundSummary(true)
      }
    } else {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      setupQuestion(roundQueue[nextIdx])
    }
  }

  function handleNextRound() {
    buildRound(allCards, roundNumber + 1)
  }

  function finishSession() {
    setIsComplete(true)
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    saveSession.mutate({
      setId,
      mode: "learn",
      stats: {
        totalCards: totalSessionCards,
        correctAnswers: bucketCounts.known + bucketCounts.familiar,
        incorrectAnswers: bucketCounts.learning + bucketCounts.new,
        timeSpent,
        accuracy:
          totalSessionCards > 0
            ? Math.round(
                ((bucketCounts.known + bucketCounts.familiar) / totalSessionCards) * 100
              )
            : 0,
      },
    })
  }

  function handleRestart(forceAll = false) {
    setAllCards([])
    setRoundQueue([])
    setCurrentIdx(0)
    setRoundNumber(1)
    setIsComplete(false)
    setShowRoundSummary(false)
    fetchDueCards(forceAll)
  }

  function togglePromptDirection() {
    setPromptWithTerm((prev) => !prev)
  }

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in the input
      if (document.activeElement?.tagName === "INPUT" && !showResult) return

      if (showResult) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault()
          handleContinue()
        }
        return
      }

      if (questionMode === "mc") {
        const num = parseInt(e.key)
        if (num >= 1 && num <= mcOptions.length) {
          e.preventDefault()
          handleMcSelect(mcOptions[num - 1])
        }
      }

      if (questionMode === "written" && e.key === "Enter") {
        e.preventDefault()
        handleWrittenSubmit()
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

  // ── Prompt / answer for the current card ────────────────────────────────────
  const prompt = currentCard
    ? promptWithTerm
      ? currentCard.item.flashcard.front
      : currentCard.item.flashcard.back
    : ""
  const correctAnswer = currentCard
    ? promptWithTerm
      ? currentCard.item.flashcard.back
      : currentCard.item.flashcard.front
    : ""
  const promptLabel = promptWithTerm ? "Term" : "Definition"
  const answerLabel = promptWithTerm ? "Definition" : "Term"

  // ── Progress percentage (known / total) ─────────────────────────────────────
  const progressPct =
    totalSessionCards > 0 ? (bucketCounts.known / totalSessionCards) * 100 : 0

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════════

  // --- Loading ---
  if (isSetLoading || isLoadingCards) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
        <div className="flex items-center justify-between py-4 px-4 border-b border-border">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-2xl px-4 space-y-6">
            <Skeleton className="h-3 w-full rounded-full" />
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  // --- Error ---
  if (fetchError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md glass-surface border border-border">
          <CardContent className="p-8 text-center">
            <p className="text-destructive mb-4">{fetchError}</p>
            <Button onClick={() => router.push(`/sets/${setId}`)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- All caught up (no cards due) ---
  if (isComplete && totalReviewed === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md glass-surface border border-border">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-heading font-semibold mb-2 text-foreground">
              All caught up!
            </h1>
            <p className="text-muted-foreground mb-6">
              No cards are due for review right now. Come back later!
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => handleRestart(true)}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Practice All Cards
              </Button>
              <Button onClick={() => router.push(`/sets/${setId}`)}>Go Back</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- Session complete ---
  if (isComplete) {
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    const minutes = Math.floor(timeSpent / 60)
    const seconds = timeSpent % 60

    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="glass-surface border border-border">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-2xl font-heading font-semibold mb-2 text-foreground">
                Session Complete!
              </h1>
              <p className="text-muted-foreground mb-6">
                You reviewed {totalSessionCards} card
                {totalSessionCards !== 1 ? "s" : ""} in{" "}
                {minutes > 0 ? `${minutes}m ` : ""}
                {seconds}s
              </p>

              {/* Bucket breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-xl bg-primary/10 border border-primary/20 p-3">
                  <div className="text-xl font-bold text-primary">
                    {bucketCounts.known}
                  </div>
                  <div className="text-xs text-muted-foreground">Mastered</div>
                </div>
                <div className="rounded-xl bg-accent border border-border p-3">
                  <div className="text-xl font-bold text-accent-foreground">
                    {bucketCounts.familiar}
                  </div>
                  <div className="text-xs text-muted-foreground">Familiar</div>
                </div>
                <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3">
                  <div className="text-xl font-bold text-destructive">
                    {bucketCounts.learning + bucketCounts.new}
                  </div>
                  <div className="text-xs text-muted-foreground">Still learning</div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => handleRestart(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Study Again
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => router.push(`/sets/${setId}`)}
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // --- Round summary ---
  if (showRoundSummary) {
    const remaining = allCards.filter((c) => c.bucket !== "known").length
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="glass-surface border border-border">
            <CardContent className="p-8 text-center">
              <h2 className="text-xl font-heading font-semibold mb-1 text-foreground">
                Round {roundNumber} Complete
              </h2>
              <p className="text-muted-foreground mb-6">
                {remaining} card{remaining !== 1 ? "s" : ""} remaining
              </p>

              {/* Bucket progress bars */}
              <div className="space-y-3 mb-6">
                <BucketBar
                  label="Mastered"
                  count={bucketCounts.known}
                  total={totalSessionCards}
                  colorClass="bg-primary"
                />
                <BucketBar
                  label="Familiar"
                  count={bucketCounts.familiar}
                  total={totalSessionCards}
                  colorClass="bg-accent-foreground/60"
                />
                <BucketBar
                  label="Still learning"
                  count={bucketCounts.learning + bucketCounts.new}
                  total={totalSessionCards}
                  colorClass="bg-destructive/70"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => finishSession()}
                >
                  End Session
                </Button>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleNextRound}
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // --- Fallback ---
  if (!set || !currentCard) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md glass-surface border border-border">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              Something went wrong. No cards to show.
            </p>
            <Button onClick={() => router.push(`/sets/${setId}`)}>Go Back</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // ACTIVE STUDY
  // ═══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background flex flex-col">
      {/* Header */}
      <StudyHeader
        title={set?.title ?? "Learn"}
        currentIndex={currentIdx}
        totalCards={roundQueue.length}
        setId={setId}
        mode="learn"
      />

      {/* Global progress bar (known / total) */}
      <div className="w-full h-1.5 bg-muted">
        <motion.div
          className="h-full bg-primary"
          initial={false}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Toolbar row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Round {roundNumber}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {currentIdx + 1}/{roundQueue.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Direction toggle */}
          <button
            onClick={togglePromptDirection}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
            title="Swap prompt direction"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {promptWithTerm ? "Term → Def" : "Def → Term"}
            </span>
          </button>

          {/* Keyboard shortcut hint */}
          <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
            <Keyboard className="h-3.5 w-3.5" />
            <span>
              {questionMode === "mc" ? "1-4 to select" : "Enter to submit"}
            </span>
          </div>
        </div>
      </div>

      {/* Bucket indicator pills */}
      <div className="flex items-center justify-center gap-3 px-4 py-2">
        <BucketPill label="Known" count={bucketCounts.known} variant="primary" />
        <BucketPill label="Familiar" count={bucketCounts.familiar} variant="accent" />
        <BucketPill
          label="Learning"
          count={bucketCounts.learning + bucketCounts.new}
          variant="destructive"
        />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard.item.flashcard.id + "-" + currentIdx}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-2xl"
          >
            {/* Prompt card */}
            <Card className="glass-surface border border-border mb-6">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                    {promptLabel}
                  </span>
                  <button
                    onClick={() => speakText(prompt)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    aria-label="Read aloud"
                  >
                    <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  {currentCard.writtenMode && (
                    <span className="ml-auto text-[10px] uppercase tracking-wider text-accent-foreground bg-accent px-2 py-0.5 rounded-full font-medium">
                      Write it
                    </span>
                  )}
                </div>
                <p className="text-xl sm:text-2xl text-foreground leading-relaxed font-heading">
                  {prompt}
                </p>
              </CardContent>
            </Card>

            {/* MC mode */}
            {questionMode === "mc" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-medium">
                  Choose the correct {answerLabel.toLowerCase()}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mcOptions.map((option, i) => {
                    const isSelected = selectedMcAnswer === option
                    const isCorrect = option === correctAnswer

                    let borderClass = "border-border"
                    let bgClass = "bg-card hover:bg-muted/50 hover:border-foreground/20"
                    let textClass = "text-foreground"

                    if (showResult) {
                      if (isCorrect) {
                        borderClass = "border-green-500 dark:border-green-400"
                        bgClass = "bg-green-500/10"
                        textClass = "text-green-700 dark:text-green-400"
                      } else if (isSelected && !isCorrect) {
                        borderClass = "border-destructive"
                        bgClass = "bg-destructive/10"
                        textClass = "text-destructive"
                      }
                    } else if (isSelected) {
                      borderClass = "border-primary"
                      bgClass = "bg-primary/10"
                    }

                    return (
                      <motion.button
                        key={i}
                        onClick={() => handleMcSelect(option)}
                        disabled={showResult}
                        className={cn(
                          "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all",
                          borderClass,
                          bgClass,
                          !showResult && "cursor-pointer"
                        )}
                        whileHover={!showResult ? { scale: 1.02 } : {}}
                        whileTap={!showResult ? { scale: 0.98 } : {}}
                      >
                        <span
                          className={cn(
                            "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors",
                            showResult && isCorrect
                              ? "bg-green-500 text-white"
                              : showResult && isSelected && !isCorrect
                              ? "bg-destructive text-destructive-foreground"
                              : isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span className={cn("flex-1 text-sm", textClass)}>
                          {option}
                        </span>
                      </motion.button>
                    )
                  })}
                </div>

                {!showResult && (
                  <div className="flex justify-center pt-1">
                    <button
                      onClick={handleDontKnow}
                      className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                    >
                      Don&apos;t know?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Written mode */}
            {questionMode === "written" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-medium">
                  Type the {answerLabel.toLowerCase()}
                </p>
                <div className="flex gap-3">
                  <Input
                    ref={inputRef}
                    value={writtenAnswer}
                    onChange={(e) => setWrittenAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !showResult) {
                        e.preventDefault()
                        handleWrittenSubmit()
                      }
                    }}
                    placeholder="Type your answer…"
                    disabled={showResult}
                    className={cn(
                      "flex-1 h-12 text-base bg-card border-border",
                      showResult && answerResult === "exact" && "border-green-500 dark:border-green-400",
                      showResult && answerResult === "close" && "border-yellow-500 dark:border-yellow-400",
                      showResult && answerResult === "wrong" && "border-destructive"
                    )}
                  />
                  {!showResult && (
                    <Button
                      onClick={handleWrittenSubmit}
                      disabled={writtenAnswer.trim() === ""}
                      className="h-12 px-6 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Check
                    </Button>
                  )}
                </div>

                {!showResult && (
                  <div className="flex justify-center pt-1">
                    <button
                      onClick={() => {
                        setWrittenAnswer("")
                        setAnswerResult("wrong")
                        setShowResult(true)
                        updateCardAfterAnswer(currentCard, "wrong")
                      }}
                      className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                    >
                      Don&apos;t know?
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Result feedback */}
            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 space-y-3"
                >
                  {/* Result banner */}
                  <div
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border",
                      answerResult === "exact" &&
                        "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",
                      answerResult === "close" &&
                        "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-300",
                      answerResult === "wrong" &&
                        "bg-destructive/10 border-destructive/30 text-destructive"
                    )}
                  >
                    {answerResult === "exact" && (
                      <>
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        <span className="font-medium">Correct!</span>
                      </>
                    )}
                    {answerResult === "close" && (
                      <>
                        <CheckCircle className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Almost!</span>
                          <span className="ml-1 opacity-80">
                            The exact answer is: <strong>{correctAnswer}</strong>
                          </span>
                        </div>
                      </>
                    )}
                    {answerResult === "wrong" && (
                      <>
                        <XCircle className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">
                            {questionMode === "written" ? "Not quite." : "Incorrect."}
                          </span>
                          <span className="ml-1 opacity-80">
                            The correct answer is: <strong>{correctAnswer}</strong>
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Continue button */}
                  <Button
                    onClick={handleContinue}
                    className="w-full h-12 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4 ml-2" />
                    <span className="ml-2 text-xs opacity-60 hidden sm:inline">
                      Space / Enter
                    </span>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function BucketBar({
  label,
  count,
  total,
  colorClass,
}: {
  label: string
  count: number
  total: number
  colorClass: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-24 text-right">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", colorClass)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <span className="text-xs font-medium text-foreground w-6">{count}</span>
    </div>
  )
}

function BucketPill({
  label,
  count,
  variant,
}: {
  label: string
  count: number
  variant: "primary" | "accent" | "destructive"
}) {
  const styles = {
    primary: "bg-primary/10 text-primary border-primary/20",
    accent: "bg-accent text-accent-foreground border-border",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
  }
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium",
        styles[variant]
      )}
    >
      <span className="font-bold">{count}</span>
      <span className="opacity-80">{label}</span>
    </div>
  )
}
