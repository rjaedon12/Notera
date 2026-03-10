/**
 * Sightreading note definitions.
 *
 * Each note knows:
 *   - name (e.g. "C4"), display name ("C"), accidental
 *   - staffY: vertical position on a 5-line staff (0 = top line, counted in half-spaces)
 *   - ledgerLines: how many ledger lines to draw above (<0) or below (>0) the staff
 *
 * Staff coordinate system (half-space units from middle line = 0):
 *   +6 = 3 ledger lines below staff
 *   +4 = 2 ledger lines below
 *   +2 = 1 ledger line below
 *   +1 = first space below bottom line
 *    0 = bottom line (line 1)
 *   -1 = first space above bottom line
 *   ...
 *   -8 = top line (line 5)
 *   -10 = 1 ledger line above
 *   -12 = 2 ledger lines above
 *
 * We use "position" where 0 = middle line (3rd line), positive = below, negative = above.
 */

export type Accidental = "sharp" | "flat" | "natural" | null

export interface SightreadingNote {
  /** Unique ID, e.g. "treble-C4" */
  id: string
  /** Scientific name, e.g. "C4", "F#5" */
  scientificName: string
  /** Display answer, e.g. "C", "F#", "Bb" */
  displayName: string
  /** Letter only — the answer the user presses */
  letter: string
  /** Accidental type */
  accidental: Accidental
  /** MIDI-ish number for ordering (C4 = 60) */
  midi: number
  /** Position on staff: 0 = middle line, negative = above, positive = below */
  staffPosition: number
  /** Ledger lines needed: negative = above, positive = below */
  ledgerLines: number
}

export type Clef = "treble" | "bass" | "alto"

export interface DifficultyLevel {
  id: string
  label: string
  description: string
  /** Which accidentals to include */
  accidentals: ("natural" | "sharp" | "flat")[]
  /** Filter: min/max staff positions to limit range */
  minPosition?: number
  maxPosition?: number
  /** How many questions per round */
  questionCount: number
}

// ─── Difficulty Levels ───────────────────────────────────

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  {
    id: "naturals-easy",
    label: "Natural Notes (Easy)",
    description: "Notes on the staff lines and spaces — no ledger lines",
    accidentals: ["natural"],
    minPosition: -8,
    maxPosition: 0,
    questionCount: 15,
  },
  {
    id: "naturals-full",
    label: "Natural Notes (Full)",
    description: "All natural notes including ledger lines",
    accidentals: ["natural"],
    questionCount: 20,
  },
  {
    id: "sharps",
    label: "Sharps",
    description: "Sharp notes on the staff",
    accidentals: ["sharp"],
    questionCount: 20,
  },
  {
    id: "flats",
    label: "Flats",
    description: "Flat notes on the staff",
    accidentals: ["flat"],
    questionCount: 20,
  },
  {
    id: "mixed",
    label: "All Accidentals",
    description: "Naturals, sharps, and flats — the full challenge",
    accidentals: ["natural", "sharp", "flat"],
    questionCount: 25,
  },
]

// ─── Note Definitions ────────────────────────────────────
//
// Treble clef: middle line = B4.  Bottom line = E4, Top line = F5.
// Bass   clef: middle line = D3.  Bottom line = G2, Top line = A3.
// Alto   clef: middle line = C4.  Bottom line = F3, Top line = G4.
//
// Position is measured in half-spaces from the middle line.
// 0 = middle line, -1 = one space above middle, -2 = one line above middle, etc.

function n(
  id: string,
  scientificName: string,
  displayName: string,
  letter: string,
  accidental: Accidental,
  midi: number,
  staffPosition: number,
  ledgerLines: number
): SightreadingNote {
  return { id, scientificName, displayName, letter, accidental, midi, staffPosition, ledgerLines }
}

// ─── Treble Clef Notes ───────────────────────────────────
// Middle line (0) = B4

const TREBLE_NATURALS: SightreadingNote[] = [
  // Below staff (ledger lines)
  n("treble-C4", "C4", "C", "C", "natural", 60, 6, 1),   // Middle C — 1 ledger line below
  n("treble-D4", "D4", "D", "D", "natural", 62, 5, 0),   // Space below bottom line
  n("treble-E4", "E4", "E", "E", "natural", 64, 4, 0),   // Bottom line
  n("treble-F4", "F4", "F", "F", "natural", 65, 3, 0),   // 1st space
  n("treble-G4", "G4", "G", "G", "natural", 67, 2, 0),   // 2nd line
  n("treble-A4", "A4", "A", "A", "natural", 69, 1, 0),   // 2nd space
  n("treble-B4", "B4", "B", "B", "natural", 71, 0, 0),   // Middle line (3rd)
  n("treble-C5", "C5", "C", "C", "natural", 72, -1, 0),  // 3rd space
  n("treble-D5", "D5", "D", "D", "natural", 74, -2, 0),  // 4th line
  n("treble-E5", "E5", "E", "E", "natural", 76, -3, 0),  // 4th space
  n("treble-F5", "F5", "F", "F", "natural", 77, -4, 0),  // Top line (5th)
  // Above staff (ledger lines)
  n("treble-G5", "G5", "G", "G", "natural", 79, -5, 0),  // Space above top
  n("treble-A5", "A5", "A", "A", "natural", 81, -6, -1), // 1 ledger line above
  n("treble-B5", "B5", "B", "B", "natural", 83, -7, 0),  // Space above 1st ledger
  n("treble-C6", "C6", "C", "C", "natural", 84, -8, -2), // 2 ledger lines above
]

const TREBLE_SHARPS: SightreadingNote[] = [
  n("treble-C#4", "C#4", "C♯", "C", "sharp", 61, 6, 1),
  n("treble-D#4", "D#4", "D♯", "D", "sharp", 63, 5, 0),
  n("treble-F#4", "F#4", "F♯", "F", "sharp", 66, 3, 0),
  n("treble-G#4", "G#4", "G♯", "G", "sharp", 68, 2, 0),
  n("treble-A#4", "A#4", "A♯", "A", "sharp", 70, 1, 0),
  n("treble-C#5", "C#5", "C♯", "C", "sharp", 73, -1, 0),
  n("treble-D#5", "D#5", "D♯", "D", "sharp", 75, -2, 0),
  n("treble-F#5", "F#5", "F♯", "F", "sharp", 78, -4, 0),
  n("treble-G#5", "G#5", "G♯", "G", "sharp", 80, -5, 0),
  n("treble-A#5", "A#5", "A♯", "A", "sharp", 82, -6, -1),
]

const TREBLE_FLATS: SightreadingNote[] = [
  n("treble-Db4", "Db4", "D♭", "D", "flat", 61, 5, 0),
  n("treble-Eb4", "Eb4", "E♭", "E", "flat", 63, 4, 0),
  n("treble-Gb4", "Gb4", "G♭", "G", "flat", 66, 2, 0),
  n("treble-Ab4", "Ab4", "A♭", "A", "flat", 68, 1, 0),
  n("treble-Bb4", "Bb4", "B♭", "B", "flat", 70, 0, 0),
  n("treble-Db5", "Db5", "D♭", "D", "flat", 73, -2, 0),
  n("treble-Eb5", "Eb5", "E♭", "E", "flat", 75, -3, 0),
  n("treble-Gb5", "Gb5", "G♭", "G", "flat", 78, -5, 0),
  n("treble-Ab5", "Ab5", "A♭", "A", "flat", 80, -6, -1),
  n("treble-Bb5", "Bb5", "B♭", "B", "flat", 82, -7, 0),
]

// ─── Bass Clef Notes ─────────────────────────────────────
// Middle line (0) = D3

const BASS_NATURALS: SightreadingNote[] = [
  // Below staff (ledger lines)
  n("bass-E2", "E2", "E", "E", "natural", 40, 6, 1),     // 1 ledger line below
  n("bass-F2", "F2", "F", "F", "natural", 41, 5, 0),
  n("bass-G2", "G2", "G", "G", "natural", 43, 4, 0),     // Bottom line
  n("bass-A2", "A2", "A", "A", "natural", 45, 3, 0),
  n("bass-B2", "B2", "B", "B", "natural", 47, 2, 0),     // 2nd line
  n("bass-C3", "C3", "C", "C", "natural", 48, 1, 0),
  n("bass-D3", "D3", "D", "D", "natural", 50, 0, 0),     // Middle line
  n("bass-E3", "E3", "E", "E", "natural", 52, -1, 0),
  n("bass-F3", "F3", "F", "F", "natural", 53, -2, 0),    // 4th line
  n("bass-G3", "G3", "G", "G", "natural", 55, -3, 0),
  n("bass-A3", "A3", "A", "A", "natural", 57, -4, 0),    // Top line
  // Above staff (ledger lines)
  n("bass-B3", "B3", "B", "B", "natural", 59, -5, 0),
  n("bass-C4", "C4", "C", "C", "natural", 60, -6, -1),   // Middle C — 1 ledger above
  n("bass-D4", "D4", "D", "D", "natural", 62, -7, 0),
  n("bass-E4", "E4", "E", "E", "natural", 64, -8, -2),
]

const BASS_SHARPS: SightreadingNote[] = [
  n("bass-F#2", "F#2", "F♯", "F", "sharp", 42, 5, 0),
  n("bass-G#2", "G#2", "G♯", "G", "sharp", 44, 4, 0),
  n("bass-A#2", "A#2", "A♯", "A", "sharp", 46, 3, 0),
  n("bass-C#3", "C#3", "C♯", "C", "sharp", 49, 1, 0),
  n("bass-D#3", "D#3", "D♯", "D", "sharp", 51, 0, 0),
  n("bass-F#3", "F#3", "F♯", "F", "sharp", 54, -2, 0),
  n("bass-G#3", "G#3", "G♯", "G", "sharp", 56, -3, 0),
  n("bass-A#3", "A#3", "A♯", "A", "sharp", 58, -4, 0),
  n("bass-C#4", "C#4", "C♯", "C", "sharp", 61, -6, -1),
  n("bass-D#4", "D#4", "D♯", "D", "sharp", 63, -7, 0),
]

const BASS_FLATS: SightreadingNote[] = [
  n("bass-Gb2", "Gb2", "G♭", "G", "flat", 42, 4, 0),
  n("bass-Ab2", "Ab2", "A♭", "A", "flat", 44, 3, 0),
  n("bass-Bb2", "Bb2", "B♭", "B", "flat", 46, 2, 0),
  n("bass-Db3", "Db3", "D♭", "D", "flat", 49, 1, 0),
  n("bass-Eb3", "Eb3", "E♭", "E", "flat", 51, 0, 0),
  n("bass-Gb3", "Gb3", "G♭", "G", "flat", 54, -3, 0),
  n("bass-Ab3", "Ab3", "A♭", "A", "flat", 56, -4, 0),
  n("bass-Bb3", "Bb3", "B♭", "B", "flat", 58, -5, 0),
  n("bass-Db4", "Db4", "D♭", "D", "flat", 61, -7, 0),
  n("bass-Eb4", "Eb4", "E♭", "E", "flat", 63, -8, -2),
]

// ─── Alto Clef Notes ─────────────────────────────────────
// Middle line (0) = C4

const ALTO_NATURALS: SightreadingNote[] = [
  // Below staff (ledger lines)
  n("alto-D3", "D3", "D", "D", "natural", 50, 6, 1),
  n("alto-E3", "E3", "E", "E", "natural", 52, 5, 0),
  n("alto-F3", "F3", "F", "F", "natural", 53, 4, 0),   // Bottom line
  n("alto-G3", "G3", "G", "G", "natural", 55, 3, 0),
  n("alto-A3", "A3", "A", "A", "natural", 57, 2, 0),   // 2nd line
  n("alto-B3", "B3", "B", "B", "natural", 59, 1, 0),
  n("alto-C4", "C4", "C", "C", "natural", 60, 0, 0),   // Middle line = Middle C
  n("alto-D4", "D4", "D", "D", "natural", 62, -1, 0),
  n("alto-E4", "E4", "E", "E", "natural", 64, -2, 0),  // 4th line
  n("alto-F4", "F4", "F", "F", "natural", 65, -3, 0),
  n("alto-G4", "G4", "G", "G", "natural", 67, -4, 0),  // Top line
  // Above staff (ledger lines)
  n("alto-A4", "A4", "A", "A", "natural", 69, -5, 0),
  n("alto-B4", "B4", "B", "B", "natural", 71, -6, -1),
  n("alto-C5", "C5", "C", "C", "natural", 72, -7, 0),
  n("alto-D5", "D5", "D", "D", "natural", 74, -8, -2),
]

const ALTO_SHARPS: SightreadingNote[] = [
  n("alto-D#3", "D#3", "D♯", "D", "sharp", 51, 6, 1),
  n("alto-F#3", "F#3", "F♯", "F", "sharp", 54, 4, 0),
  n("alto-G#3", "G#3", "G♯", "G", "sharp", 56, 3, 0),
  n("alto-A#3", "A#3", "A♯", "A", "sharp", 58, 2, 0),
  n("alto-C#4", "C#4", "C♯", "C", "sharp", 61, 0, 0),
  n("alto-D#4", "D#4", "D♯", "D", "sharp", 63, -1, 0),
  n("alto-F#4", "F#4", "F♯", "F", "sharp", 66, -3, 0),
  n("alto-G#4", "G#4", "G♯", "G", "sharp", 68, -4, 0),
  n("alto-A#4", "A#4", "A♯", "A", "sharp", 70, -5, 0),
  n("alto-C#5", "C#5", "C♯", "C", "sharp", 73, -7, 0),
]

const ALTO_FLATS: SightreadingNote[] = [
  n("alto-Eb3", "Eb3", "E♭", "E", "flat", 51, 5, 0),
  n("alto-Gb3", "Gb3", "G♭", "G", "flat", 54, 3, 0),
  n("alto-Ab3", "Ab3", "A♭", "A", "flat", 56, 2, 0),
  n("alto-Bb3", "Bb3", "B♭", "B", "flat", 58, 1, 0),
  n("alto-Db4", "Db4", "D♭", "D", "flat", 61, -1, 0),
  n("alto-Eb4", "Eb4", "E♭", "E", "flat", 63, -2, 0),
  n("alto-Gb4", "Gb4", "G♭", "G", "flat", 66, -4, 0),
  n("alto-Ab4", "Ab4", "A♭", "A", "flat", 68, -5, 0),
  n("alto-Bb4", "Bb4", "B♭", "B", "flat", 70, -6, -1),
  n("alto-Db5", "Db5", "D♭", "D", "flat", 73, -8, -2),
]

// ─── All notes indexed by clef ───────────────────────────

export const ALL_NOTES: Record<Clef, { naturals: SightreadingNote[]; sharps: SightreadingNote[]; flats: SightreadingNote[] }> = {
  treble: { naturals: TREBLE_NATURALS, sharps: TREBLE_SHARPS, flats: TREBLE_FLATS },
  bass:   { naturals: BASS_NATURALS,   sharps: BASS_SHARPS,   flats: BASS_FLATS   },
  alto:   { naturals: ALTO_NATURALS,   sharps: ALTO_SHARPS,   flats: ALTO_FLATS   },
}

/**
 * Get a filtered pool of notes for a given clef + difficulty.
 */
export function getNotesForLevel(clef: Clef, level: DifficultyLevel): SightreadingNote[] {
  const bank = ALL_NOTES[clef]
  let pool: SightreadingNote[] = []

  if (level.accidentals.includes("natural")) pool.push(...bank.naturals)
  if (level.accidentals.includes("sharp"))   pool.push(...bank.sharps)
  if (level.accidentals.includes("flat"))    pool.push(...bank.flats)

  // Filter by position range if specified
  if (level.minPosition !== undefined || level.maxPosition !== undefined) {
    pool = pool.filter((note) => {
      const min = level.minPosition ?? -999
      const max = level.maxPosition ?? 999
      return note.staffPosition >= min && note.staffPosition <= max
    })
  }

  return pool
}

/**
 * Generate a randomized question set from a note pool.
 * Ensures no immediate repeats.
 */
export function generateQuestions(pool: SightreadingNote[], count: number): SightreadingNote[] {
  if (pool.length === 0) return []
  const questions: SightreadingNote[] = []
  let lastNote: SightreadingNote | null = null

  for (let i = 0; i < count; i++) {
    const available = pool.filter((n) => n.id !== lastNote?.id)
    const pick = available[Math.floor(Math.random() * available.length)]
    questions.push(pick)
    lastNote = pick
  }

  return questions
}
