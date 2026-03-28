/**
 * Block Blast piece definitions and color palette.
 *
 * Each piece is a 2D boolean grid (true = filled cell).
 * Pieces are grouped into "tiers" so the difficulty can ramp:
 *   Tier 1 (rounds 1-3): small pieces only (1-4 cells)
 *   Tier 2 (rounds 4+):  full pool including 4-9 cell pieces & L/T/Z shapes
 */

// ── Color palette (modern Tailwind-inspired) ───────────────────

export const BLOCK_COLORS = [
  "#06B6D4", // Cyan-500
  "#EC4899", // Pink-500
  "#F59E0B", // Amber-500
  "#10B981", // Emerald-500
  "#8B5CF6", // Violet-500
  "#F97316", // Orange-500
  "#3B82F6", // Blue-500
] as const

export type BlockColor = (typeof BLOCK_COLORS)[number]

// ── Piece shapes ───────────────────────────────────────────────

export interface PieceShape {
  id: string
  grid: boolean[][]
  tier: 1 | 2
  /** Weight for random selection — higher = more likely to appear. */
  weight: number
}

/** All available piece shapes. */
export const PIECE_SHAPES: PieceShape[] = [
  // ── Tier 1 (small – rounds 1-3) ──
  { id: "dot",       tier: 1, weight: 1, grid: [[true]] },
  { id: "h2",        tier: 1, weight: 2, grid: [[true, true]] },
  { id: "v2",        tier: 1, weight: 2, grid: [[true], [true]] },
  { id: "h3",        tier: 1, weight: 2, grid: [[true, true, true]] },
  { id: "v3",        tier: 1, weight: 2, grid: [[true], [true], [true]] },
  { id: "sq2",       tier: 1, weight: 3, grid: [[true, true], [true, true]] },
  { id: "l2",        tier: 1, weight: 2, grid: [[true, false], [true, true]] },
  { id: "l2r",       tier: 1, weight: 2, grid: [[false, true], [true, true]] },
  { id: "l2tl",      tier: 1, weight: 2, grid: [[true, true], [true, false]] },
  { id: "l2tr",      tier: 1, weight: 2, grid: [[true, true], [false, true]] },

  // ── Tier 2 (larger – rounds 4+) ──
  { id: "h4",        tier: 2, weight: 2, grid: [[true, true, true, true]] },
  { id: "v4",        tier: 2, weight: 2, grid: [[true], [true], [true], [true]] },
  { id: "h5",        tier: 2, weight: 1, grid: [[true, true, true, true, true]] },
  { id: "v5",        tier: 2, weight: 1, grid: [[true], [true], [true], [true], [true]] },
  { id: "sq3",       tier: 2, weight: 2, grid: [[true, true, true], [true, true, true], [true, true, true]] },
  { id: "rect2x3",   tier: 2, weight: 3, grid: [[true, true, true], [true, true, true]] },
  { id: "rect3x2",   tier: 2, weight: 3, grid: [[true, true], [true, true], [true, true]] },
  { id: "l3",        tier: 2, weight: 2, grid: [[true, false], [true, false], [true, true]] },
  { id: "l3r",       tier: 2, weight: 2, grid: [[false, true], [false, true], [true, true]] },
  { id: "j3",        tier: 2, weight: 2, grid: [[true, true], [false, true], [false, true]] },
  { id: "j3r",       tier: 2, weight: 2, grid: [[true, true], [true, false], [true, false]] },
  { id: "t3",        tier: 2, weight: 3, grid: [[true, true, true], [false, true, false]] },
  { id: "t3u",       tier: 2, weight: 2, grid: [[false, true, false], [true, true, true]] },
  { id: "t3l",       tier: 2, weight: 2, grid: [[true, false], [true, true], [true, false]] },
  { id: "t3r",       tier: 2, weight: 2, grid: [[false, true], [true, true], [false, true]] },
  { id: "z3",        tier: 2, weight: 2, grid: [[true, true, false], [false, true, true]] },
  { id: "s3",        tier: 2, weight: 2, grid: [[false, true, true], [true, true, false]] },
  { id: "plus",      tier: 2, weight: 2, grid: [[false, true, false], [true, true, true], [false, true, false]] },
  { id: "corner3",   tier: 2, weight: 2, grid: [[true, true, true], [true, false, false], [true, false, false]] },
  { id: "corner3r",  tier: 2, weight: 2, grid: [[true, true, true], [false, false, true], [false, false, true]] },
]

// ── Piece generation ───────────────────────────────────────────

export interface GamePiece {
  shape: PieceShape
  color: BlockColor
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
 * Weighted random selection without replacement.
 * Draws `n` distinct items from `arr` based on each item's `weight` accessor.
 */
function weightedPickDistinct<T>(
  arr: readonly T[],
  n: number,
  getWeight: (item: T) => number
): T[] {
  const pool = arr.map((item, i) => ({ item, weight: getWeight(item), idx: i }))
  const result: T[] = []

  for (let i = 0; i < n && pool.length > 0; i++) {
    const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0)
    let roll = Math.random() * totalWeight
    let picked = 0
    for (let j = 0; j < pool.length; j++) {
      roll -= pool[j].weight
      if (roll <= 0) {
        picked = j
        break
      }
    }
    result.push(pool[picked].item)
    pool.splice(picked, 1)
  }

  return result
}

/**
 * Generate a tray of 3 pieces for the given round number.
 * - Rounds 1-3: tier-1 pieces only (small, easy shapes).
 * - Rounds 4+: full pool (tier 1 + tier 2).
 * Uses weighted random selection — no duplicate shapes in a single tray.
 * Each piece gets a distinct color.
 */
export function generatePieceSet(round: number): GamePiece[] {
  const pool =
    round <= 3
      ? PIECE_SHAPES.filter((s) => s.tier === 1)
      : PIECE_SHAPES

  const shapes = weightedPickDistinct(pool, 3, (s) => s.weight)
  const colors = pickDistinct(BLOCK_COLORS, 3)

  return shapes.map((shape, i) => ({
    shape,
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
