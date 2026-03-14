"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { EquationSolver } from "@/components/math/visualizers/EquationSolver"

export default function SolverPage() {
  const { canvas, controls } = EquationSolver()

  return (
    <VisualizerShell
      title="Equation Solver"
      formula={String.raw`x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`}
      description="Enter a linear or quadratic equation and see every algebraic step worked out — from identifying coefficients through the discriminant to the final roots. A deterministic, rule-based solver with no AI required."
      difficulty="high-school"
      controls={controls}
      canvas={canvas}
    />
  )
}
