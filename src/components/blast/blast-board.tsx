"use client"

import { memo, useCallback, useRef, useEffect, useState } from "react"
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
      className={cn(
        "inline-grid p-[3px] rounded-xl select-none touch-none",
        "bg-gradient-to-br from-zinc-800/80 to-zinc-900/90",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_24px_rgba(0,0,0,0.3)]",
        "border border-zinc-700/40"
      )}
      style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
        gap: "3px",
      }}
    >
      {board.map((row, r) =>
        row.map((cell, c) => {
          const key = `${r}-${c}`
          const clearing = isCellClearing(r, c) && cell !== null
          const isGhost = ghostCells.has(key)
          // Subtle checkerboard pattern for empty cells
          const isEvenCell = (r + c) % 2 === 0

          return (
            <motion.div
              key={key}
              className={cn(
                "aspect-square rounded-md transition-colors duration-75",
                "w-[clamp(34px,calc((100vw-48px)/8-3px),48px)]",
                !cell && !isGhost && (isEvenCell
                  ? "bg-zinc-850 dark:bg-zinc-900/80"
                  : "bg-zinc-900 dark:bg-zinc-900/60"),
                disabled && "pointer-events-none"
              )}
              style={{
                backgroundColor: clearing
                  ? undefined
                  : cell
                    ? cell.color
                    : isGhost
                      ? ghostValid
                        ? `${dragPiece!.color}88`   // brighter valid ghost
                        : "#ef444466"                // red tint for invalid
                      : undefined,
                boxShadow: clearing
                  ? undefined
                  : cell
                    ? `inset 2px 2px 0 rgba(255,255,255,0.18), inset -1px -1px 0 rgba(0,0,0,0.15)`
                    : isGhost
                      ? ghostValid
                        ? `inset 0 0 0 2px ${dragPiece!.color}cc, 0 0 8px ${dragPiece!.color}44`
                        : `inset 0 0 0 2px #ef444488`
                      : `inset 0 1px 3px rgba(0,0,0,0.2)`,
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
                  : isGhost && ghostValid
                    ? { opacity: [0.7, 1, 0.7], scale: 1 }
                    : { scale: 1, opacity: 1 }
              }
              transition={
                clearing
                  ? { duration: 0.35, ease: "easeOut" }
                  : isGhost && ghostValid
                    ? { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
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
