/**
 * Scoring engine for Block Blast.
 *
 * Mirrors Block Blast's actual scoring:
 *   - Base points per cell placed
 *   - Line-clear bonuses with multi-line scaling
 *   - Combo multiplier for consecutive clearing placements
 *   - First-try question bonus
 */

// ── Types ──────────────────────────────────────────────────────

export interface ScoreState {
  score: number
  comboCount: number
  linesCleared: number
  bestCombo: number
  questionsAnswered: number
  firstTryCount: number
}

export interface ScoreDelta {
  blockPoints: number
  linePoints: number
  comboMultiplier: number
  firstTryBonus: number
  totalAdded: number
}

export function createScoreState(): ScoreState {
  return {
    score: 0,
    comboCount: 0,
    linesCleared: 0,
    bestCombo: 0,
    questionsAnswered: 0,
    firstTryCount: 0,
  }
}

// ── Scoring ────────────────────────────────────────────────────

/**
 * Calculate score for a single piece placement.
 *
 * @param cellsPlaced   Number of cells in the piece that was placed.
 * @param linesClearedNow  Number of rows + columns cleared by this placement.
 * @param comboCount    Current combo streak *before* this placement.
 * @param wasFirstTry   Whether the question that earned this piece set was
 *                      answered correctly on the first attempt.
 *
 * Returns the delta and updated combo count.
 */
export function calculatePlacementScore(
  cellsPlaced: number,
  linesClearedNow: number,
  comboCount: number,
  wasFirstTry: boolean
): { delta: ScoreDelta; newComboCount: number } {
  const blockPoints = cellsPlaced

  let linePoints = 0
  let comboMultiplier = 1
  let newComboCount = comboCount

  if (linesClearedNow > 0) {
    // Base line score: 10 per line + 10 bonus per line beyond the first
    linePoints = linesClearedNow * 10 + Math.max(0, linesClearedNow - 1) * 10
    // Combo: increment THEN apply
    newComboCount = comboCount + 1
    comboMultiplier = newComboCount
    linePoints *= comboMultiplier
  } else {
    // No clear → break the combo
    newComboCount = 0
  }

  const firstTryBonus = wasFirstTry ? 5 : 0

  const totalAdded = blockPoints + linePoints + firstTryBonus

  return {
    delta: {
      blockPoints,
      linePoints,
      comboMultiplier,
      firstTryBonus,
      totalAdded,
    },
    newComboCount,
  }
}
