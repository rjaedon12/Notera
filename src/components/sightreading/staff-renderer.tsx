"use client"

import { type SightreadingNote, type Clef } from "@/lib/sightreading-notes"

// ─── SVG Clef Path Data ──────────────────────────────────

const TREBLE_CLEF_PATH = `M 12.8 67.5 C 12.8 63.5 15.4 59 19 56.5 C 22.6 54 25.2 53.4 26.5 54.5 C 27.8 55.6 27.6 58.2 25.5 60.5 C 23.4 62.8 19 65 15.5 65.8 C 12 66.6 10.5 66 10.5 66 L 10.5 66 C 10.5 66 11 62 13 57 C 15 52 18.5 45.5 20.5 41 C 22.5 36.5 24 33 24.5 30 C 25 27 24.5 24 23.5 21.5 C 22.5 19 21 17.5 19 17 C 17 16.5 14.5 17 12.5 19 C 10.5 21 9 24.5 8.5 28.5 C 8 32.5 8.5 37 10 41.5 C 11.5 46 14 50.5 16.5 54 C 19 57.5 21 60 22.5 62.5 C 24 65 25 67.5 25 70 C 25 72.5 24 75 22 77 C 20 79 17 80.5 14.5 80.5 C 12 80.5 10 79.5 9 77.5 C 8 75.5 8 73 9 71 C 10 69 12.8 67.5 12.8 67.5 Z`

const BASS_CLEF_PATH = `M 8 22 C 8 18 10 14.5 13.5 12.5 C 17 10.5 21 10.5 23.5 12 C 26 13.5 27 16 27 19 C 27 22 25.5 24.5 23 26 C 20.5 27.5 17 28 14.5 27.5 C 12 27 10 25.5 8.5 23.5 M 31 16.5 C 32.5 16.5 33.5 17.5 33.5 18.5 C 33.5 19.5 32.5 20.5 31 20.5 C 29.5 20.5 28.5 19.5 28.5 18.5 C 28.5 17.5 29.5 16.5 31 16.5 Z M 31 24 C 32.5 24 33.5 25 33.5 26 C 33.5 27 32.5 28 31 28 C 29.5 28 28.5 27 28.5 26 C 28.5 25 29.5 24 31 24 Z`

const ALTO_CLEF_PATH = `M 4 8 L 4 72 L 8 72 L 8 8 Z M 12 8 L 12 72 L 14 72 L 14 8 Z M 18 40 C 18 32 22 24 28 18 C 28 18 28.5 17 28 17 L 18 17 L 18 8 L 30 8 L 30 10 C 24 16 20 26 20 40 C 20 54 24 64 30 70 L 30 72 L 18 72 L 18 63 L 28 63 C 28.5 63 28 62 28 62 C 22 56 18 48 18 40 Z`

interface StaffRendererProps {
  note: SightreadingNote
  clef: Clef
  width?: number
  height?: number
}

/**
 * Renders a 5-line music staff with the correct clef and a note at the right position.
 * Pure SVG — no images, no fonts, no external dependencies.
 */
export function StaffRenderer({ note, clef, width = 320, height = 220 }: StaffRendererProps) {
  // Staff geometry
  const staffTop = 60        // y of top line
  const lineSpacing = 16     // distance between adjacent lines
  const staffBottom = staffTop + lineSpacing * 4  // y of bottom line
  const staffMiddle = staffTop + lineSpacing * 2  // y of middle line
  const halfSpace = lineSpacing / 2

  // Note position: staffMiddle + position * halfSpace
  // position 0 = middle line, negative = above, positive = below
  const noteY = staffMiddle + note.staffPosition * halfSpace
  const noteX = width * 0.6
  const noteRadius = halfSpace * 0.85

  // Ledger lines
  const ledgerLines: number[] = []
  if (note.staffPosition > 4) {
    // Below staff
    for (let p = 6; p <= note.staffPosition; p += 2) {
      ledgerLines.push(staffMiddle + p * halfSpace)
    }
  }
  if (note.staffPosition < -4) {
    // Above staff
    for (let p = -6; p >= note.staffPosition; p -= 2) {
      ledgerLines.push(staffMiddle + p * halfSpace)
    }
  }
  // Special case: note is exactly on a ledger line
  if (note.staffPosition === 4 && note.ledgerLines === 0) {
    // on bottom line, no extra
  }

  // Accidental glyph offset
  const accidentalX = noteX - noteRadius * 2.4

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      className="select-none"
      aria-label={`Music staff showing a note`}
    >
      {/* Staff lines */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line
          key={`line-${i}`}
          x1={30}
          y1={staffTop + i * lineSpacing}
          x2={width - 20}
          y2={staffTop + i * lineSpacing}
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-foreground"
        />
      ))}

      {/* Clef */}
      <g transform={clefTransform(clef, staffTop, lineSpacing)}>
        <path
          d={clefPath(clef)}
          fill="currentColor"
          className="text-foreground"
          stroke="none"
        />
      </g>

      {/* Ledger lines */}
      {ledgerLines.map((y, i) => (
        <line
          key={`ledger-${i}`}
          x1={noteX - noteRadius * 2}
          y1={y}
          x2={noteX + noteRadius * 2}
          y2={y}
          stroke="currentColor"
          strokeWidth={1.5}
          className="text-foreground"
        />
      ))}

      {/* Accidental */}
      {note.accidental === "sharp" && (
        <g transform={`translate(${accidentalX}, ${noteY})`}>
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={lineSpacing * 1.8}
            fontWeight="bold"
            fill="currentColor"
            className="text-foreground"
          >
            ♯
          </text>
        </g>
      )}
      {note.accidental === "flat" && (
        <g transform={`translate(${accidentalX}, ${noteY - 2})`}>
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={lineSpacing * 2}
            fill="currentColor"
            className="text-foreground"
          >
            ♭
          </text>
        </g>
      )}

      {/* Note head (whole note) */}
      <ellipse
        cx={noteX}
        cy={noteY}
        rx={noteRadius}
        ry={noteRadius * 0.75}
        fill="currentColor"
        className="text-foreground"
        stroke="none"
      />
      {/* Inner cutout for whole note appearance */}
      <ellipse
        cx={noteX}
        cy={noteY}
        rx={noteRadius * 0.5}
        ry={noteRadius * 0.35}
        fill="var(--background, white)"
        stroke="none"
        transform={`rotate(-25, ${noteX}, ${noteY})`}
      />

      {/* Stem */}
      {renderStem(noteX, noteY, noteRadius, note.staffPosition)}
    </svg>
  )
}

function renderStem(noteX: number, noteY: number, noteRadius: number, position: number) {
  // Stem goes up if note is on or below middle line, down if above
  const stemUp = position >= 0
  const stemLength = 48
  const stemX = stemUp ? noteX + noteRadius - 1 : noteX - noteRadius + 1
  const stemEndY = stemUp ? noteY - stemLength : noteY + stemLength

  return (
    <line
      x1={stemX}
      y1={noteY}
      x2={stemX}
      y2={stemEndY}
      stroke="currentColor"
      strokeWidth={1.8}
      className="text-foreground"
    />
  )
}

function clefPath(clef: Clef): string {
  switch (clef) {
    case "treble": return TREBLE_CLEF_PATH
    case "bass": return BASS_CLEF_PATH
    case "alto": return ALTO_CLEF_PATH
  }
}

function clefTransform(clef: Clef, staffTop: number, lineSpacing: number): string {
  switch (clef) {
    case "treble": {
      // Treble clef: the curl sits around the G line (2nd line from bottom)
      const scale = lineSpacing * 4 / 70
      return `translate(30, ${staffTop - lineSpacing * 0.3}) scale(${scale})`
    }
    case "bass": {
      // Bass clef: the two dots sit around the F line (4th line = 2nd from top)
      const scale = lineSpacing * 3 / 35
      return `translate(32, ${staffTop - 2}) scale(${scale})`
    }
    case "alto": {
      // Alto clef: centered on middle line
      const scale = lineSpacing * 4 / 80
      return `translate(30, ${staffTop}) scale(${scale})`
    }
  }
}
