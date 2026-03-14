"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { StatsPlayground } from "@/components/math/visualizers/StatsPlayground"

export default function StatsPage() {
  const { canvas, controls } = StatsPlayground()

  return (
    <VisualizerShell
      title="Statistics Playground"
      formula={String.raw`\sigma = \sqrt{\frac{1}{N}\sum_{i=1}^{N}(x_i - \mu)^2}`}
      description="Enter a dataset or generate sample data, and instantly see descriptive statistics: mean, median, mode, standard deviation, quartiles, and IQR — along with a histogram with mean and median markers."
      difficulty="both"
      controls={controls}
      canvas={canvas}
    />
  )
}
