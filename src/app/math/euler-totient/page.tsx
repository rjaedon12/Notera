"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { EulerTotient } from "@/components/math/visualizers/EulerTotient"

export default function EulerTotientPage() {
  const { canvas, controls } = EulerTotient()

  return (
    <VisualizerShell
      title="Euler's Totient Function"
      formula={String.raw`\varphi(n) = n \prod_{p \mid n} \left(1 - \frac{1}{p}\right)`}
      description="Euler's totient function φ(n) counts how many integers from 1 to n are coprime to n (share no common factors). It's fundamental in number theory and the basis of RSA encryption. Highlighted cells are coprime to n."
      difficulty="college"
      controls={controls}
      canvas={canvas}
    />
  )
}
