"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { RiemannSum } from "@/components/math/visualizers/RiemannSum"

export default function RiemannPage() {
  const { canvas, controls } = RiemannSum()

  return (
    <VisualizerShell
      title="Riemann Sum"
      formula={String.raw`\int_a^b f(x)\,dx \approx \sum_{i=1}^{n} f(x_i^*)\,\Delta x`}
      description="Approximate the area under any curve using rectangles. Choose left, right, or midpoint sampling, then drag the slider to increase n and watch the approximation converge to the true integral in real time."
      difficulty="college"
      controls={controls}
      canvas={canvas}
    />
  )
}
