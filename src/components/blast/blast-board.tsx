"use client"

import { memo, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Board, GamePiece } from "@/lib/blast"
import { BOARD_SIZE, canPlace } from "@/lib/blast"

interface BlastBoardProps {
  board: Board
  dragPiece: GamePiece | null
  dragCell: { row: number; col: number } | null
  clearingRows: number[]
  clearingCols: number[]
  onClearAnimationDone: () => void
  onDrop: (row: number, col: number, pieceIndex: number) => void
  /** Called by tray drag to update the hover position on the board. */
  boardRef?: React.RefObject<HTMLDivElement | null>
  disabled?: boolean
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
}: BlastBoardProps) {
  const isClearing = clearingRows.length > 0 || clearingCols.length > 0

  // Compute ghost preview cells
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

  const handleClearDone = useCallback(() => {
    if (isClearing) {
      onClearAnimationDone()
    }
  }, [isClearing, onClearAnimationDone])

  const isCellClearing = (r: number, c: number) =>
    clearingRows.includes(r) || clearingCols.includes(c)

  return (
    <div
      ref={boardRef}
      className="inline-grid gap-[2px] bg-muted/50 dark:bg-zinc-800 p-[2px] rounded-lg select-none touch-none"
      style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`
          const clearing = isCellClearing(r, c) && cell !== null
          const isGhost = ghostCells.has(key)

          return (
            <motion.div
              key={key}
              className={cn(
                "aspect-square rounded-sm transition-colors duration-75",
                "w-[clamp(32px,calc((100vw-48px)/8-2px),48px)]",
                !cell && !isGhost && "bg-background dark:bg-zinc-900",
                disabled && "pointer-events-none"
              )}
              style={{
                backgroundColor: clearing
                  ? undefined
                  : cell
                    ? cell.color
                    : isGhost
                      ? ghostValid
                        ? `${dragPiece!.color}55`
                        : undefined
                      : undefined,
                boxShadow:
                  isGhost && ghostValid
                    ? `inset 0 0 0 2px ${dragPiece!.color}88`
                    : undefined,
              }}
              animate={
                clearing
                  ? {
                      scale: [1, 1.15, 0],
                      opacity: [1, 1, 0],
                      backgroundColor: [
                        "#ffffff",
                        cell?.color ?? "#ffffff",
                        "var(--color-background, #18181b)",
                      ],
                    }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                clearing
                  ? { duration: 0.35, ease: "easeOut" }
                  : { duration: 0.1 }
              }
              onAnimationComplete={() => {
                if (
                  clearing &&
                  r === (clearingRows[0] ?? clearingCols[0] ?? r) &&
                  c === 0
                ) {
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
