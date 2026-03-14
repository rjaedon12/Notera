"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { GCDVisualizer } from "@/components/math/visualizers/GCDVisualizer"

export default function GCDPage() {
  const { canvas, controls } = GCDVisualizer()

  return (
    <VisualizerShell
      title="GCD Visualizer"
      formula={String.raw`\gcd(a, b) = \gcd(b, a \bmod b)`}
      description="The Euclidean algorithm finds the greatest common divisor by repeatedly dividing and taking remainders. This geometric view shows the process as tiling a rectangle with squares — each step fits the largest possible square, and the final square size is the GCD."
      difficulty="both"
      controls={controls}
      canvas={canvas}
    />
  )
}
