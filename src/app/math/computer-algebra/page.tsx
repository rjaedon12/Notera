"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { ComputerAlgebra } from "@/components/math/visualizers/ComputerAlgebra"

export default function ComputerAlgebraPage() {
  const { canvas, controls } = ComputerAlgebra()

  return (
    <VisualizerShell
      title="Computer Algebra"
      formula={String.raw`\int e^{x}\sin x\,dx = \frac{e^{x}(\sin x - \cos x)}{2} + C`}
      description="A full symbolic math engine powered by SymPy, running entirely in your browser. Simplify, factor, differentiate, integrate, solve equations, work with matrices, and more — all with step-free LaTeX output. No server required."
      difficulty="college"
      controls={controls}
      canvas={canvas}
    />
  )
}
