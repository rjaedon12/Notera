"use client"

import { use, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useStudySet, useSaveTimedScore } from "@/hooks/useStudy"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AnimatePresence } from "framer-motion"
import { useBlastGame } from "@/hooks/useBlastGame"
import { BlastBoard } from "@/components/blast/blast-board"
import { BlastPieceTray } from "@/components/blast/blast-piece-tray"
import { BlastQuestionModal } from "@/components/blast/blast-question-modal"
import { BlastScoreDisplay } from "@/components/blast/blast-score-display"
import { BlastConfig } from "@/components/blast/blast-config"
import { BlastGameOver } from "@/components/blast/blast-game-over"
import type { AnswerMode, PromptSide } from "@/lib/blast"

interface PageProps {
  params: Promise<{ setId: string }>
}

export default function TimedPage({ params }: PageProps) {
  const { setId } = use(params)
  const router = useRouter()
  const { data: set, isLoading } = useStudySet(setId)
  const saveTimedScore = useSaveTimedScore()

  const cards = set?.cards ?? []
  const game = useBlastGame(cards)

  const [isPersonalBest, setIsPersonalBest] = useState(false)
  const [scoreSaved, setScoreSaved] = useState(false)

  // Save score on game over
  useEffect(() => {
    if (game.state.phase === "GAME_OVER" && !scoreSaved) {
      setScoreSaved(true)
      saveTimedScore
        .mutateAsync({
          setId,
          score: game.state.score.score,
          mode: "blast",
        })
        .then((res) => {
          if (res?.isPersonalBest) setIsPersonalBest(true)
        })
        .catch((err) => {
          console.error("Failed to save blast score:", err)
        })
    }
  }, [game.state.phase, game.state.score.score, scoreSaved, setId, saveTimedScore])

  // Auto-complete clearing animations after a timeout fallback
  useEffect(() => {
    if (game.state.phase === "CLEARING") {
      const t = setTimeout(() => game.finishClearing(), 400)
      return () => clearTimeout(t)
    }
  }, [game.state.phase, game.finishClearing])

  const handleStart = useCallback(
    (answerMode: AnswerMode, promptSide: PromptSide) => {
      setIsPersonalBest(false)
      setScoreSaved(false)
      game.startGame(answerMode, promptSide)
    },
    [game]
  )

  const handlePlayAgain = useCallback(() => {
    setIsPersonalBest(false)
    setScoreSaved(false)
    game.restart()
  }, [game])

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-xl">
        <Skeleton className="h-12 w-full mb-8" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  // ── Not enough cards ──
  if (!set || !set.cards || set.cards.length < 4) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Not enough cards</h1>
        <p className="text-muted-foreground mb-4">
          Blocks mode requires at least 4 cards.
        </p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    )
  }

  // ── Config screen ──
  if (game.state.phase === "CONFIG") {
    return (
      <BlastConfig
        setTitle={set.title}
        cardCount={cards.length}
        onStart={handleStart}
      />
    )
  }

  // ── Game over ──
  if (game.state.phase === "GAME_OVER") {
    return (
      <BlastGameOver
        score={game.state.score}
        isPersonalBest={isPersonalBest}
        onPlayAgain={handlePlayAgain}
        onBack={() => router.push(`/sets/${setId}`)}
      />
    )
  }

  // ── Active game (QUESTION / PLACING / CLEARING) ──
  const selectedPiece =
    game.state.selectedPieceIndex !== null
      ? game.state.tray[game.state.selectedPieceIndex] ?? null
      : null

  return (
    <div className="container mx-auto px-4 py-4 max-w-fit">
      {/* Score display */}
      <BlastScoreDisplay score={game.state.score} />

      {/* Game area — board + question overlay */}
      <div className="relative">
        <BlastBoard
          board={game.state.board}
          selectedPiece={selectedPiece}
          clearingRows={game.state.clearingRows}
          clearingCols={game.state.clearingCols}
          onCellClick={(r, c) => game.placePieceAt(r, c)}
          onClearAnimationDone={game.finishClearing}
          disabled={game.state.phase !== "PLACING"}
        />

        {/* Question overlay */}
        <AnimatePresence>
          {game.state.phase === "QUESTION" && game.state.currentQuestion && (
            <BlastQuestionModal
              key={game.state.score.questionsAnswered}
              question={game.state.currentQuestion}
              answerMode={game.state.answerMode}
              onSubmit={game.submitAnswer}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Piece tray */}
      <BlastPieceTray
        tray={game.state.tray}
        selectedIndex={game.state.selectedPieceIndex}
        onSelect={game.selectPiece}
        disabled={game.state.phase !== "PLACING"}
      />
    </div>
  )
}
