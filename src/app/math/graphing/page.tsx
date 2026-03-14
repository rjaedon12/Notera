"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { GraphingCalculator } from "@/components/math/visualizers/GraphingCalculator"

export default function GraphingPage() {
  const { canvas, controls } = GraphingCalculator()

  return (
    <VisualizerShell
      title="Graphing Calculator"
      formula={String.raw`f(x) = ax^2 + bx + c`}
      description="Plot any mathematical function and explore it visually. Add multiple functions, zoom in and out, and see how expressions like polynomials, trigonometric functions, and exponentials behave across different domains."
      difficulty="both"
      controls={controls}
      canvas={canvas}
    />
  )
}
