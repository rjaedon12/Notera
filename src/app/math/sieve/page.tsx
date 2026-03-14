"use client"

import { VisualizerShell } from "@/components/math/VisualizerShell"
import { PrimeSieve } from "@/components/math/visualizers/PrimeSieve"

export default function SievePage() {
  const { canvas, controls } = PrimeSieve()

  return (
    <VisualizerShell
      title="Sieve of Eratosthenes"
      formula={String.raw`p \text{ is prime} \iff \nexists\, d \in (1,p) : d \mid p`}
      description="The Sieve of Eratosthenes is one of the oldest known algorithms for finding all prime numbers up to a given limit. It works by iteratively marking the multiples of each prime number starting from 2. Watch as composite numbers are eliminated and primes emerge."
      difficulty="high-school"
      controls={controls}
      canvas={canvas}
    />
  )
}
