"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { BaseConverter } from "@/components/math/visualizers/BaseConverter"

export default function BaseConverterPage() {
  const { canvas, controls } = BaseConverter()

  return (
    <VisualizerShell
      title="Base Converter"
      formula={String.raw`N = \sum_{i=0}^{k} d_i \cdot b^i`}
      description="Convert numbers between binary, octal, decimal, and hexadecimal. See the positional breakdown of each digit's contribution, and use the bit flipper to toggle individual bits and watch all representations update instantly."
      difficulty="high-school"
      controls={controls}
      canvas={canvas}
    />
  )
}
