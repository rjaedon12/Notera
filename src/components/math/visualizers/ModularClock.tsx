"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { CanvasErrorBoundary } from "@/components/math/ErrorBoundary"

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b] }
  return a
}

interface ModularClockCanvasProps {
  modulus: number
  step: number
  sequence: number[]
  currentIndex: number
}

function ModularClockCanvas({ modulus, step, sequence, currentIndex }: ModularClockCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const radius = size * 0.38
    const isDark = document.documentElement.classList.contains("dark")

    ctx.clearRect(0, 0, size, size)

    // Clock face circle
    ctx.beginPath()
    ctx.arc(cx, cy, radius + 16, 0, Math.PI * 2)
    ctx.fillStyle = isDark ? "rgba(28,28,30,0.5)" : "rgba(255,255,255,0.5)"
    ctx.fill()
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"
    ctx.lineWidth = 1
    ctx.stroke()

    // Draw nodes
    const nodePositions: { x: number; y: number }[] = []
    for (let i = 0; i < modulus; i++) {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / modulus
      const x = cx + radius * Math.cos(angle)
      const y = cy + radius * Math.sin(angle)
      nodePositions.push({ x, y })

      const isVisited = sequence.slice(0, currentIndex + 1).includes(i)
      const isCurrent = currentIndex >= 0 && sequence[currentIndex] === i

      // Node circle
      ctx.beginPath()
      ctx.arc(x, y, 14, 0, Math.PI * 2)
      if (isCurrent) {
        ctx.fillStyle = "#007AFF"
      } else if (isVisited) {
        ctx.fillStyle = "#30d158"
      } else {
        ctx.fillStyle = isDark ? "#3a3a3c" : "#d1d1d6"
      }
      ctx.fill()

      // Node label
      ctx.fillStyle = isCurrent || isVisited ? "#ffffff" : isDark ? "#f5f5f7" : "#1d1d1f"
      ctx.font = `${modulus > 20 ? 10 : 12}px system-ui`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(String(i), x, y)
    }

    // Draw connecting lines
    if (currentIndex > 0) {
      ctx.strokeStyle = "rgba(0,122,255,0.5)"
      ctx.lineWidth = 2
      ctx.setLineDash([])

      for (let i = 0; i < currentIndex; i++) {
        const from = nodePositions[sequence[i]]
        const to = nodePositions[sequence[i + 1]]
        if (from && to) {
          ctx.beginPath()
          ctx.moveTo(from.x, from.y)
          ctx.lineTo(to.x, to.y)
          ctx.stroke()

          // Arrowhead
          const angle = Math.atan2(to.y - from.y, to.x - from.x)
          const arrowLen = 8
          const endX = to.x - 16 * Math.cos(angle)
          const endY = to.y - 16 * Math.sin(angle)
          ctx.beginPath()
          ctx.moveTo(endX, endY)
          ctx.lineTo(endX - arrowLen * Math.cos(angle - 0.4), endY - arrowLen * Math.sin(angle - 0.4))
          ctx.moveTo(endX, endY)
          ctx.lineTo(endX - arrowLen * Math.cos(angle + 0.4), endY - arrowLen * Math.sin(angle + 0.4))
          ctx.stroke()
        }
      }
    }
  }, [modulus, sequence, currentIndex])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ro = new ResizeObserver(() => {
      const s = Math.min(parent.clientWidth, 500)
      canvas.width = s
      canvas.height = s
      draw()
    })
    ro.observe(parent)
    const s = Math.min(parent.clientWidth, 500)
    canvas.width = s
    canvas.height = s
    draw()
    return () => ro.disconnect()
  }, [draw])

  return (
    <div
      className="w-full rounded-2xl overflow-hidden flex items-center justify-center p-4"
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block", maxWidth: 500 }} />
    </div>
  )
}

export function ModularClock() {
  const [modulus, setModulus] = useState(12)
  const [step, setStep] = useState(5)
  const [sequence, setSequence] = useState<number[]>([0])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [animating, setAnimating] = useState(false)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const g = gcd(step, modulus)
  const isGenerator = g === 1
  const maxElements = modulus / g

  const reset = useCallback(() => {
    if (animRef.current) clearInterval(animRef.current)
    setAnimating(false)
    setSequence([0])
    setCurrentIndex(0)
  }, [])

  const doStep = useCallback(() => {
    setSequence((prev) => {
      const last = prev[prev.length - 1]
      const next = (last + step) % modulus
      // If we've returned to start, stop
      if (prev.length > 1 && next === prev[0]) {
        setAnimating(false)
        if (animRef.current) clearInterval(animRef.current)
        return prev
      }
      setCurrentIndex(prev.length)
      return [...prev, next]
    })
  }, [step, modulus])

  const animate = useCallback(() => {
    reset()
    setAnimating(true)
    let seq = [0]
    const iv = setInterval(() => {
      const last = seq[seq.length - 1]
      const next = (last + step) % modulus
      if (seq.length > 1 && next === seq[0]) {
        clearInterval(iv)
        setAnimating(false)
        return
      }
      seq = [...seq, next]
      setSequence([...seq])
      setCurrentIndex(seq.length - 1)
    }, 300)
    animRef.current = iv
  }, [step, modulus, reset])

  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current)
    }
  }, [])

  const uniqueVisited = new Set(sequence).size

  return {
    canvas: (
      <CanvasErrorBoundary>
        <ModularClockCanvas
          modulus={modulus}
          step={step}
          sequence={sequence}
          currentIndex={currentIndex}
        />
      </CanvasErrorBoundary>
    ),
    controls: (
      <div className="space-y-4">
        {/* Generator message */}
        <div
          className="text-center py-2 px-3 rounded-xl text-sm font-medium"
          style={{
            background: isGenerator ? "rgba(48,209,88,0.12)" : "rgba(255,159,10,0.12)",
            color: isGenerator ? "#30d158" : "#FF9F0A",
          }}
        >
          {isGenerator
            ? "Generator! Every element reached."
            : `Not a generator — only ${maxElements} elements reached.`}
        </div>

        {/* Visited counter */}
        <div
          className="text-center py-1.5 px-3 rounded-xl text-xs"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          Visited: {uniqueVisited} / {modulus} nodes
        </div>

        {/* Modulus */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
            Modulus (n)
          </label>
          <input
            type="number"
            min={2}
            max={30}
            value={modulus}
            onChange={(e) => {
              const v = Math.max(2, Math.min(30, Number(e.target.value) || 2))
              setModulus(v)
              setStep((s) => Math.min(s, v - 1))
              reset()
            }}
            className="flex h-9 w-full rounded-xl px-3 py-1.5 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Step */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
            Step size (a)
          </label>
          <input
            type="number"
            min={1}
            max={modulus - 1}
            value={step}
            onChange={(e) => {
              const v = Math.max(1, Math.min(modulus - 1, Number(e.target.value) || 1))
              setStep(v)
              reset()
            }}
            className="flex h-9 w-full rounded-xl px-3 py-1.5 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={animate}
            disabled={animating}
            className="flex-1 h-9 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            Animate
          </button>
          <button
            onClick={doStep}
            disabled={animating}
            className="h-9 px-3 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{
              background: "var(--secondary)",
              color: "var(--secondary-foreground)",
              border: "1px solid var(--glass-border)",
            }}
          >
            Step
          </button>
          <button
            onClick={reset}
            className="h-9 px-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "var(--secondary)",
              color: "var(--secondary-foreground)",
              border: "1px solid var(--glass-border)",
            }}
          >
            Reset
          </button>
        </div>
      </div>
    ),
  }
}
