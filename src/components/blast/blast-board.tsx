"use client"

import { memo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Board, GamePiece } from "@/lib/blast"
import { BOARD_SIZE, canPlace } from "@/lib/blast"

/** Tracks which cells were just placed so we can animate them in. */
export interface PlacedCell {
  key: string
  color: string
}

interface BlastBoardProps {
  board: Board
  dragPiece: GamePiece | null
  dragCell: { row: number; col: number } | null
  clearingRows: number[]
  clearingCols: number[]
  onClearAnimationDone: () => void
  onDrop: (row: number, col: number, pieceIndex: number) => void
  boardRef?: React.RefObject<HTMLDivElement | null>
  disabled?: boolean
  justPlacedCells?: Set<string>
}

export const BlastBoard = memo(function BlastBoard({
  board,
  dragPiece,
  dragCell,
  clearingRows,
  clearingCols,
  onClearAnimationDone,
  boardRef,
  disabled,
  justPlacedCells,
}: BlastBoardProps) {
  const isClearing = clearingRows.length > 0 || clearingCols.length > 0

  const ghostCells = new Set<string>()
  let ghostValid = false
  if (dragPiece && dragCell && !isClearing && !disabled) {
    ghostValid = canPlace(board, dragPiece.shape, dragCell.row, dragCell.col)
    const grid = dragPiece.shape.grid
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c]) {
          const br = dragCell.row + r
          const bc = dragCell.col + c
          if (br >= 0 && br < BOARD_SIZE && bc >= 0 && bc < BOARD_SIZE) {
            ghostCells.add(`${br}-${bc}`)
          }
        }
      }
    }
  }

  const clearDoneCalledRef = useRef(false)
  const handleClearDone = useCallback(() => {
    if (isClearing && !clearDoneCalledRef.current) {
      clearDoneCalledRef.current = true
      onClearAnimationDone()
    }
  }, [isClearing, onClearAnimationDone])

  // Reset the flag when clearing state changes
  if (!isClearing) clearDoneCalledRef.current = false

  const isCellClearing = (r: number, c: number) =>
    clearingRows.includes(r) || clearingCols.includes(c)

  return (
    <div
      ref={boardRef}
      className={cn(
        "inline-grid rounded-2xl select-none touch-none overflow-hidden",
        "bg-[var(--background-secondary)] border border-[var(--glass-border)]"
      )}
      style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gap: "3px",
        padding: "3px",
      }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`
          const clearing = isCellClearing(r, c) && cell !== null
          const isGhost = ghostCells.has(key)
          const isEvenCell = (r + c) % 2 === 0
          const wasJustPlaced = justPlacedCells?.has(key) ?? false

          return (
            <motion.div
              key={key}
              className={cn(
                "aspect-square rounded-[5px]",
                disabled && "pointer-events-none"
              )}
              style={{
                width: "clamp(40px, calc((min(100vw, 560px) - 64px) / 8), 56px)",
                backgroundColor: clearing
                  ? cell?.color
                  : cell
                    ? cell.color
                    : isGhost
                      ? ghostValid
                        ? `${dragPiece!.color}40`
                        : "rgba(239,68,68,0.18)"
                      : isEvenCell
                        ? "var(--background-tertiary)"
                        : "var(--background-secondary)",
                boxShadow: cell && !clearing
                  ? "inset 0 -2px 0 rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.10)"
                  : undefined,
                border: isGhost && !clearing
                  ? ghostValid
                    ? `2px solid ${dragPiece!.color}88`
                    : "2px solid rgba(239,68,68,0.3)"
                  : "2px solid transparent",
              }}
              initial={wasJustPlaced ? { scale: 0.5, opacity: 0 } : false}
              animate={
                clearing
                  ? { scale: 0, opacity: 0, filter: "brightness(1.8)" }
                  : wasJustPlaced
                    ? { scale: 1, opacity: 1 }
                    : { scale: 1, opacity: 1 }
              }
              transition={
                clearing
                  ? { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: (r + c) * 0.02 }
                  : wasJustPlaced
                    ? { type: "spring", stiffness: 500, damping: 25, delay: 0.02 * (r + c) }
                    : { duration: 0.08 }
              }
              onAnimationComplete={() => {
                if (clearing && r === (clearingRows[clearingRows.length - 1] ?? clearingCols[clearingCols.length - 1] ?? r) && c === BOARD_SIZE - 1) {
                  handleClearDone()
                }
              }}
            />
          )
        })
      )}
    </div>
  )
})
