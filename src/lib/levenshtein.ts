/**
 * Levenshtein distance + fuzzy answer matching for Learn mode.
 *
 * Design decisions (per user spec):
 * - Levenshtein ≤ 3 as the "almost correct" threshold (forgiving for typos/misspellings).
 * - Case + accent normalization before comparison.
 * - Expose an "almost correct" band so the UI can give learning-signal feedback
 *   rather than a binary pass/fail.
 */

/** Strip accents / diacritics and lowercase. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip combining marks
    .toLowerCase()
    .trim()
}

/** Classic DP Levenshtein distance — O(m·n) time, O(min(m,n)) space. */
export function levenshtein(a: string, b: string): number {
  const an = a.length
  const bn = b.length
  if (an === 0) return bn
  if (bn === 0) return an

  // Keep the shorter string in the inner loop for space efficiency
  let prev: number[] = []
  let curr: number[] = []

  const [short, long] =
    an <= bn ? [a, b] : [b, a]
  const sn = short.length
  const ln = long.length

  for (let j = 0; j <= sn; j++) prev[j] = j

  for (let i = 1; i <= ln; i++) {
    curr[0] = i
    for (let j = 1; j <= sn; j++) {
      const cost = long[i - 1] === short[j - 1] ? 0 : 1
      curr[j] = Math.min(
        curr[j - 1] + 1, // insertion
        prev[j] + 1, // deletion
        prev[j - 1] + cost // substitution
      )
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[sn]
}

export type MatchResult = "exact" | "close" | "wrong"

/**
 * Compare a user's typed answer to the correct answer.
 *
 * Returns:
 * - `"exact"` — normalized strings match perfectly
 * - `"close"` — Levenshtein distance ≤ 2 (the "almost correct" band)
 * - `"wrong"` — too far off
 */
export function matchAnswer(
  userAnswer: string,
  correctAnswer: string
): MatchResult {
  const a = normalize(userAnswer)
  const b = normalize(correctAnswer)

  if (a === b) return "exact"

  const dist = levenshtein(a, b)

  // ≤ 3 edits → "almost correct" (forgiving for typos / minor misspellings)
  if (dist <= 3) return "close"

  return "wrong"
}
