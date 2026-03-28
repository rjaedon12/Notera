"use client"

import { use, useState, useEffect, useCallback, useRef } from "react"
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
import type { AnswerMode, PromptSide, GamePiece } from "@/lib/blast"
import { BOARD_SIZE, canPlace } from "@/lib/blast"

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

  // ── Drag state ──
  const boardRef = useRef<HTMLDivElement | null>(null)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null)
  const [dragCell, setDragCell] = useState<{ row: number; col: number } | null>(null)

  const draggingPiece: GamePiece | null =
    draggingIndex !== null ? game.state.tray[draggingIndex] ?? null : null

  // Compute the board cell from a client x/y, centering the piece under the cursor.
  // The anchor cell is offset so the cursor sits at the piece's visual center.
  const clientToCell = useCallback(
    (clientX: number, clientY: number, piece?: GamePiece | null): { row: number; col: number } | null => {
      const el = boardRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      const cellSize = rect.width / BOARD_SIZE

      // Get piece dimensions for center-offset calculation
      const grid = piece?.shape?.grid
      const pieceRows = grid ? grid.length : 1
      const pieceCols = grid ? Math.max(...grid.map((r) => r.length)) : 1

      // Offset so cursor maps to piece center, not top-left corner
      const col = Math.floor((clientX - rect.left) / cellSize - pieceCols / 2)
      const row = Math.floor((clientY - rect.top) / cellSize - pieceRows / 2)

      // Allow slightly out-of-bounds so edge pieces can still be placed
      if (row < -(pieceRows - 1) || row >= BOARD_SIZE || col < -(pieceCols - 1) || col >= BOARD_SIZE)
        return null
      return { row, col }
    },
    []
  )

  const handleDragStart = useCallback((index: number) => {
    setDraggingIndex(index)
  }, [])

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      setDragPos({ x: clientX, y: clientY })
      // Pass the active piece so clientToCell can center-offset properly
      const piece = draggingIndex !== null ? game.state.tray[draggingIndex] ?? null : null
      const cell = clientToCell(clientX, clientY, piece)
      setDragCell(cell)
    },
    [clientToCell, draggingIndex, game.state.tray]
  )

  const handleDragEnd = useCallback(() => {
    if (draggingIndex !== null && dragCell && draggingPiece) {
      if (canPlace(game.state.board, draggingPiece.shape, dragCell.row, dragCell.col)) {
        game.placePieceDirect(draggingIndex, dragCell.row, dragCell.col)
      }
    }
    setDraggingIndex(null)
    setDragPos(null)
    setDragCell(null)
  }, [draggingIndex, dragCell, draggingPiece, game])

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
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-4 bg-background">
      <div className="w-full max-w-fit">
        {/* Score display */}
        <BlastScoreDisplay score={game.state.score} round={game.state.round} />

        {/* Game area — board + question overlay */}
        <div className="relative overflow-hidden rounded-2xl">
          <BlastBoard
            board={game.state.board}
            dragPiece={draggingPiece}
            dragCell={dragCell}
            clearingRows={game.state.clearingRows}
            clearingCols={game.state.clearingCols}
            onClearAnimationDone={game.finishClearing}
            onDrop={() => {}}
            boardRef={boardRef}
            disabled={game.state.phase !== "PLACING"}
          />

          {/* Question overlay */}
          <AnimatePresence>
            {game.state.phase === "QUESTION" && game.state.currentQuestion && (
              <BlastQuestionModal
                key={game.state.currentQuestion.prompt + game.state.score.questionsAnswered}
                question={game.state.currentQuestion}
                answerMode={game.state.answerMode}
                showingCorrectAnswer={game.state.showingCorrectAnswer}
                onSubmit={game.submitAnswer}
                onAcknowledgeWrong={game.acknowledgeWrong}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Piece tray */}
        <div className="mt-2">
          <BlastPieceTray
            tray={game.state.tray}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            disabled={game.state.phase !== "PLACING"}
          />
        </div>

        {/* Floating drag ghost — only while actively dragging */}
        {draggingPiece && dragPos && draggingIndex !== null && (
          <DragGhost piece={draggingPiece} x={dragPos.x} y={dragPos.y} />
        )}
      </div>
    </div>
  )
}

/** Floating piece that follows the pointer during drag. */
function DragGhost({ piece, x, y }: { piece: GamePiece; x: number; y: number }) {
  const grid = piece.shape.grid
  const cols = Math.max(...grid.map((r) => r.length))
  const cellPx = 36
  const gap = 2
  const w = cols * cellPx + (cols - 1) * gap
  const h = grid.length * cellPx + (grid.length - 1) * gap

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: x - w / 2,
        top: y - h / 2,
        opacity: 0.88,
      }}
    >
      <div
        className="inline-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${cellPx}px)`,
          gap: `${gap}px`,
        }}
      >
        {grid.flatMap((row, r) =>
          Array.from({ length: cols }, (_, c) => (
            <div
              key={`${r}-${c}`}
              className="rounded-[4px]"
              style={{
                width: cellPx,
                height: cellPx,
                backgroundColor: row[c] ? piece.color : "transparent",
                boxShadow: row[c]
                  ? "inset 0 -1px 0 rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.15)"
                  : undefined,
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}
