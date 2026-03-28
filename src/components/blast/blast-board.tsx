"use client"

import { memo, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import type { Board, GamePiece, PieceShape } from "@/lib/blast"
import { BOARD_SIZE, canPlace } from "@/lib/blast"

interface BlastBoardProps {
  board: Board
  selectedPiece: GamePiece | null
  clearingRows: number[]
  clearingCols: number[]
  onCellClick: (row: number, col: number) => void
  onClearAnimationDone: () => void
  disabled?: boolean
}

export const BlastBoard = memo(function BlastBoard({
  board,
  selectedPiece,
  clearingRows,
  clearingCols,
  onCellClick,
  onClearAnimationDone,
  disabled,
}: BlastBoardProps) {
  const [hoverCell, setHoverCell] = useState<{
    row: number
    col: number
  } | null>(null)

  const isClearing = clearingRows.length > 0 || clearingCols.length > 0

  // Compute ghost preview cells
  const ghostCells = new Set<string>()
  let ghostValid = false
  if (selectedPiece && hoverCell && !isClearing && !disabled) {
    ghostValid = canPlace(
      board,
      selectedPiece.shape,
      hoverCell.row,
      hoverCell.col
    )
    if (ghostValid) {
      const grid = selectedPiece.shape.grid
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c]) {
            ghostCells.add(`${hoverCell.row + r}-${hoverCell.col + c}`)
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

  // Track if we've started the exit animation to call done once
  const isCellClearing = (r: number, c: number) =>
    clearingRows.includes(r) || clearingCols.includes(c)

  return (
    <div
      className="inline-grid gap-[2px] bg-zinc-800 p-[2px] rounded-lg select-none"
      style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
      onMouseLeave={() => setHoverCell(null)}
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
                "aspect-square rounded-sm cursor-pointer transition-colors duration-75",
                "w-[clamp(32px,calc((100vw-48px)/8-2px),48px)]",
                !cell && !isGhost && "bg-zinc-900",
                disabled && "pointer-events-none"
              )}
              style={{
                backgroundColor: clearing
                  ? undefined
                  : cell
                    ? cell.color
                    : isGhost
                      ? ghostValid
                        ? `${selectedPiece!.color}55`
                        : undefined
                      : undefined,
              }}
              animate={
                clearing
                  ? {
                      scale: [1, 1.15, 0],
                      opacity: [1, 1, 0],
                      backgroundColor: ["#ffffff", cell?.color ?? "#ffffff", "#18181b"],
                    }
                  : { scale: 1, opacity: 1 }
              }
              transition={
                clearing
                  ? { duration: 0.35, ease: "easeOut" }
                  : { duration: 0.1 }
              }
              onAnimationComplete={() => {
                // Only fire once — from the first clearing cell
                if (clearing && r === (clearingRows[0] ?? clearingCols[0] ?? r) && c === 0) {
                  handleClearDone()
                }
              }}
              onMouseEnter={() => setHoverCell({ row: r, col: c })}
              onTouchStart={() => setHoverCell({ row: r, col: c })}
              onClick={() => {
                if (!disabled && !isClearing) onCellClick(r, c)
              }}
            />
          )
        })
      )}
    </div>
  )
})
