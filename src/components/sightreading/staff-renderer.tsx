"use client"

import { useEffect, useRef } from "react"
import type { SightreadingNote, Clef } from "@/lib/sightreading-notes"

/** Convert scientificName like "C4", "F#5", "Bb4" → VexFlow key "c/4", "f#/5", "bb/4" */
function toVexKey(name: string): string {
  const m = name.match(/^([A-G])(#|b)?(\d+)$/)
  if (!m) return "c/4"
  return `${m[1].toLowerCase()}${m[2] ?? ""}/${m[3]}`
}

interface StaffRendererProps {
  note: SightreadingNote
  clef: Clef
}

/**
 * Renders a professional music staff using VexFlow — correct clef glyphs,
 * properly positioned whole notes, accurate ledger lines and accidentals.
 * Uses a neutral white/near-white background for readability in both themes.
 */
export function StaffRenderer({ note, clef }: StaffRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let alive = true

    ;(async () => {
      const vf = await import("vexflow")
      if (!alive || !containerRef.current) return

      const { Renderer, Stave, StaveNote, Voice, Formatter, Accidental } = vf

      // Clear previous render
      el.innerHTML = ""

      const W = Math.max(el.clientWidth || 0, 320)
      const H = 200

      const renderer = new Renderer(el, Renderer.Backends.SVG)
      renderer.resize(W, H)
      const ctx = renderer.getContext()

      // Use dark ink on the staff for maximum contrast on the light card
      ctx.setFillStyle("#1e293b")
      ctx.setStrokeStyle("#1e293b")
      ctx.setFont("Arial", 10)

      // Stave: leave vertical padding so ledger-line notes above/below don't clip
      const staveX = 12
      const staveY = 60
      const staveW = W - 24

      const stave = new Stave(staveX, staveY, staveW)
      stave.addClef(clef)
      stave.setContext(ctx).draw()

      // Build VexFlow note
      const key = toVexKey(note.scientificName)
      const staveNote = new StaveNote({
        keys: [key],
        duration: "w",  // whole note — no stem, open note head
        clef,
      })

      if (note.accidental === "sharp") {
        staveNote.addModifier(new Accidental("#"), 0)
      } else if (note.accidental === "flat") {
        staveNote.addModifier(new Accidental("b"), 0)
      }

      // VexFlow Voice (strict: false = don't enforce beat count)
      const voice = new Voice({ num_beats: 4, beat_value: 4 }).setStrict(false)
      voice.addTickables([staveNote])

      // Format: center the note in the available space after the clef
      new Formatter().joinVoices([voice]).format([voice], staveW - 100)

      voice.draw(ctx, stave)

      // Make the SVG responsive
      const svg = el.querySelector("svg")
      if (svg) {
        svg.setAttribute("width", "100%")
        svg.setAttribute("height", "100%")
        svg.style.display = "block"
      }
    })()

    return () => {
      alive = false
    }
  }, [note.scientificName, note.accidental, clef])

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{
        height: 200,
        background: "#fafafa",
        border: "1px solid var(--glass-border)",
      }}
    />
  )
}
