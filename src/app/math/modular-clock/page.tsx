"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { ModularClock } from "@/components/math/visualizers/ModularClock"

export default function ModularClockPage() {
  const { canvas, controls } = ModularClock()

  return (
    <VisualizerShell
      title="Modular Clock"
      formula={String.raw`a \equiv b \pmod{n}`}
      description="Modular arithmetic wraps numbers around a fixed modulus, like hours on a clock. Set a step size and watch the sequence trace a path around the clock. When the step and modulus are coprime, every number is visited — the step is a generator of the cyclic group."
      difficulty="high-school"
      controls={controls}
      canvas={canvas}
    />
  )
}
