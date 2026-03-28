/**
 * Block Blast piece definitions and color palette.
 *
 * Each piece is a 2D boolean grid (true = filled cell).
 * Pieces are grouped into "tiers" so the difficulty can ramp:
 *   Tier 1 (rounds 1-3): small pieces only (1-3 cells)
 *   Tier 2 (rounds 4+):  full pool including 4-5 cell pieces & L/T/Z shapes
 */

// ── Color palette ──────────────────────────────────────────────

export const BLOCK_COLORS = [
  "#00BCD4", // Cyan
  "#E91E63", // Magenta
  "#FFEB3B", // Yellow
  "#FF9800", // Orange
  "#4CAF50", // Green
  "#9C27B0", // Purple
  "#2196F3", // Blue
] as const

export type BlockColor = (typeof BLOCK_COLORS)[number]

// ── Piece shapes ───────────────────────────────────────────────

export interface PieceShape {
  id: string
  grid: boolean[][]
  tier: 1 | 2
}

/** All available piece shapes. */
export const PIECE_SHAPES: PieceShape[] = [
  // ── Tier 1 (small – rounds 1-3) ──
  { id: "dot",       tier: 1, grid: [[true]] },
  { id: "h2",        tier: 1, grid: [[true, true]] },
  { id: "v2",        tier: 1, grid: [[true], [true]] },
  { id: "h3",        tier: 1, grid: [[true, true, true]] },
  { id: "v3",        tier: 1, grid: [[true], [true], [true]] },
  { id: "sq2",       tier: 1, grid: [[true, true], [true, true]] },
  { id: "l2",        tier: 1, grid: [[true, false], [true, true]] },
  { id: "l2r",       tier: 1, grid: [[false, true], [true, true]] },

  // ── Tier 2 (larger – rounds 4+) ──
  { id: "h4",        tier: 2, grid: [[true, true, true, true]] },
  { id: "v4",        tier: 2, grid: [[true], [true], [true], [true]] },
  { id: "h5",        tier: 2, grid: [[true, true, true, true, true]] },
  { id: "v5",        tier: 2, grid: [[true], [true], [true], [true], [true]] },
  { id: "sq3",       tier: 2, grid: [[true, true, true], [true, true, true], [true, true, true]] },
  { id: "l3",        tier: 2, grid: [[true, false], [true, false], [true, true]] },
  { id: "l3r",       tier: 2, grid: [[false, true], [false, true], [true, true]] },
  { id: "j3",        tier: 2, grid: [[true, true], [false, true], [false, true]] },
  { id: "j3r",       tier: 2, grid: [[true, true], [true, false], [true, false]] },
  { id: "t3",        tier: 2, grid: [[true, true, true], [false, true, false]] },
  { id: "z3",        tier: 2, grid: [[true, true, false], [false, true, true]] },
  { id: "s3",        tier: 2, grid: [[false, true, true], [true, true, false]] },
]

// ── Piece generation ───────────────────────────────────────────

export interface GamePiece {
  shape: PieceShape
  color: BlockColor
}

/**
 * Pick a random item from an array.
 */
function randomFrom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Pick `n` distinct random items from an array.
 * Falls back to allowing repeats if `arr.length < n`.
 */
function pickDistinct<T>(arr: readonly T[], n: number): T[] {
  if (arr.length <= n) return [...arr]
  const pool = [...arr]
  const result: T[] = []
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool[idx])
    pool.splice(idx, 1)
  }
  return result
}

/**
 * Generate a tray of 3 pieces for the given round number.
 * - Rounds 1-3: tier-1 pieces only (small, easy shapes).
 * - Rounds 4+: full pool (tier 1 + tier 2).
 * Each piece gets a distinct color.
 */
export function generatePieceSet(round: number): GamePiece[] {
  const pool =
    round <= 3
      ? PIECE_SHAPES.filter((s) => s.tier === 1)
      : PIECE_SHAPES

  const colors = pickDistinct(BLOCK_COLORS, 3)

  return Array.from({ length: 3 }, (_, i) => ({
    shape: randomFrom(pool),
    color: colors[i],
  }))
}

/**
 * Count the filled cells in a piece shape.
 */
export function pieceSize(shape: PieceShape): number {
  return shape.grid.reduce(
    (sum, row) => sum + row.filter(Boolean).length,
    0
  )
}
