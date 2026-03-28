"use client"

import { memo, useCallback } from "react"
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
    if (isClearing) onClearAnimationDone()
  }, [isClearing, onClearAnimationDone])

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
        gap: "2px",
        padding: "2px",
      }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`
          const clearing = isCellClearing(r, c) && cell !== null
          const isGhost = ghostCells.has(key)
          const isEvenCell = (r + c) % 2 === 0

          return (
            <motion.div
              key={key}
              className={cn(
                "aspect-square rounded-[4px] w-[clamp(34px,calc((100vw-48px)/8-2px),48px)]",
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
                        : "rgba(239,68,68,0.25)"
                      : isEvenCell
                        ? "var(--background-tertiary)"
                        : "var(--background-secondary)",
                boxShadow: cell && !clearing
                  ? "inset 0 -1px 0 rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.12)"
                  : undefined,
                border: isGhost && !clearing
                  ? ghostValid
                    ? `1.5px solid ${dragPiece!.color}aa`
                    : "1.5px solid rgba(239,68,68,0.4)"
                  : "1.5px solid transparent",
              }}
              animate={
                clearing
                  ? { scale: [1, 1.1, 0], opacity: [1, 1, 0] }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                clearing
                  ? { duration: 0.3, ease: "easeOut" }
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
