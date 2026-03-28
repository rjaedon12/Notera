/**
 * 8×8 board operations for Block Blast.
 *
 * The board is a 2D array of cells. Each cell is either `null` (empty)
 * or an object holding the block color.
 */

import type { PieceShape, BlockColor } from "./pieces"

// ── Types ──────────────────────────────────────────────────────

export interface Cell {
  color: BlockColor
}

export type Board = (Cell | null)[][]

export const BOARD_SIZE = 8

// ── Board helpers ──────────────────────────────────────────────

export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  )
}

/**
 * Can the piece be placed with its top-left corner at (row, col)?
 */
export function canPlace(
  board: Board,
  shape: PieceShape,
  row: number,
  col: number
): boolean {
  const grid = shape.grid
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (!grid[r][c]) continue
      const br = row + r
      const bc = col + c
      if (br < 0 || br >= BOARD_SIZE || bc < 0 || bc >= BOARD_SIZE) return false
      if (board[br][bc] !== null) return false
    }
  }
  return true
}

/**
 * Place the piece on the board (returns a new board; does NOT mutate).
 * Assumes `canPlace` was already checked.
 */
export function placePiece(
  board: Board,
  shape: PieceShape,
  row: number,
  col: number,
  color: BlockColor
): Board {
  const newBoard = board.map((r) => [...r])
  const grid = shape.grid
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (!grid[r][c]) continue
      newBoard[row + r][col + c] = { color }
    }
  }
  return newBoard
}

/**
 * Find all completed (fully filled) rows and columns.
 */
export function findCompletedLines(
  board: Board
): { rows: number[]; cols: number[] } {
  const rows: number[] = []
  const cols: number[] = []

  for (let r = 0; r < BOARD_SIZE; r++) {
    if (board[r].every((cell) => cell !== null)) rows.push(r)
  }
  for (let c = 0; c < BOARD_SIZE; c++) {
    if (board.every((row) => row[c] !== null)) cols.push(c)
  }

  return { rows, cols }
}

/**
 * Clear the given rows and columns, returning a new board.
 */
export function clearLines(
  board: Board,
  rows: number[],
  cols: number[]
): Board {
  const newBoard = board.map((r) => [...r])

  for (const r of rows) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      newBoard[r][c] = null
    }
  }
  for (const c of cols) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      newBoard[r][c] = null
    }
  }

  return newBoard
}

/**
 * Check whether ANY of the given pieces can be placed anywhere on the board.
 * If none can fit → game over.
 */
export function hasValidMove(
  board: Board,
  pieces: { shape: PieceShape }[]
): boolean {
  for (const piece of pieces) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (canPlace(board, piece.shape, r, c)) return true
      }
    }
  }
  return false
}
