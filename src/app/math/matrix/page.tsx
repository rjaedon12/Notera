"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { MatrixVisualizer } from "@/components/math/visualizers/MatrixVisualizer"

export default function MatrixPage() {
  const { canvas, controls } = MatrixVisualizer()

  return (
    <VisualizerShell
      title="Matrix Visualizer"
      formula={String.raw`\det(A) = ad - bc \quad \text{for } A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}`}
      description="See how 2×2 matrix transformations affect geometry. Enter a matrix and watch the unit square stretch, rotate, shear, or reflect. Red and green arrows show the transformed basis vectors. The determinant tells you the area scaling factor."
      difficulty="college"
      controls={controls}
      canvas={canvas}
    />
  )
}
