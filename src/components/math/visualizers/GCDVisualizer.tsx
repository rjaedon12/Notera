"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { CanvasErrorBoundary } from "@/components/math/ErrorBoundary"

interface GCDStep {
  a: number
  b: number
  quotient: number
  remainder: number
}

function euclideanSteps(a: number, b: number): GCDStep[] {
  const steps: GCDStep[] = []
  let x = Math.max(a, b)
  let y = Math.min(a, b)
  while (y > 0) {
    const q = Math.floor(x / y)
    const r = x % y
    steps.push({ a: x, b: y, quotient: q, remainder: r })
    x = y
    y = r
  }
  return steps
}

interface GCDCanvasProps {
  a: number
  b: number
  currentStep: number
  steps: GCDStep[]
}

function GCDCanvas({ a, b, currentStep, steps }: GCDCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isDark = document.documentElement.classList.contains("dark")
    const width = canvas.width
    const height = canvas.height

    ctx.clearRect(0, 0, width, height)

    // Draw the Euclidean rectangle subtraction visualization
    const maxDim = Math.max(a, b)
    if (maxDim === 0) return

    const padding = 20
    const availW = width - padding * 2
    const availH = height - padding * 2
    const scale = Math.min(availW / Math.max(a, b), availH / Math.min(a, b))

    let rectW = Math.max(a, b) * scale
    let rectH = Math.min(a, b) * scale

    // Center it
    const offsetX = (width - rectW) / 2
    const offsetY = (height - rectH) / 2

    // Draw outer rectangle
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"
    ctx.lineWidth = 1
    ctx.strokeRect(offsetX, offsetY, rectW, rectH)

    // Color the squares for each step up to currentStep
    const colors = [
      "rgba(0,122,255,0.3)",
      "rgba(48,209,88,0.3)",
      "rgba(255,159,10,0.3)",
      "rgba(160,80,220,0.3)",
      "rgba(255,69,58,0.3)",
      "rgba(88,86,214,0.3)",
      "rgba(0,199,190,0.3)",
    ]

    let cx = offsetX
    let cy = offsetY
    let cw = rectW
    let ch = rectH
    let horizontal = cw >= ch

    for (let i = 0; i <= Math.min(currentStep, steps.length - 1); i++) {
      const step = steps[i]
      const color = colors[i % colors.length]

      for (let q = 0; q < step.quotient; q++) {
        if (horizontal) {
          const squareSize = ch
          ctx.fillStyle = color
          ctx.fillRect(cx, cy, squareSize, squareSize)
          ctx.strokeStyle = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"
          ctx.strokeRect(cx, cy, squareSize, squareSize)

          // Label
          ctx.fillStyle = isDark ? "#f5f5f7" : "#1d1d1f"
          ctx.font = `${Math.max(9, Math.min(14, squareSize * 0.2))}px system-ui`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          if (squareSize > 20) {
            ctx.fillText(`${step.b}`, cx + squareSize / 2, cy + squareSize / 2)
          }

          cx += squareSize
          cw -= squareSize
        } else {
          const squareSize = cw
          ctx.fillStyle = color
          ctx.fillRect(cx, cy, squareSize, squareSize)
          ctx.strokeStyle = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"
          ctx.strokeRect(cx, cy, squareSize, squareSize)

          ctx.fillStyle = isDark ? "#f5f5f7" : "#1d1d1f"
          ctx.font = `${Math.max(9, Math.min(14, squareSize * 0.2))}px system-ui`
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          if (squareSize > 20) {
            ctx.fillText(`${step.b}`, cx + squareSize / 2, cy + squareSize / 2)
          }

          cy += squareSize
          ch -= squareSize
        }
      }
      horizontal = !horizontal
    }
  }, [a, b, currentStep, steps])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ro = new ResizeObserver(() => {
      canvas.width = parent.clientWidth
      canvas.height = Math.min(400, parent.clientWidth * 0.65)
      draw()
    })
    ro.observe(parent)
    canvas.width = parent.clientWidth
    canvas.height = Math.min(400, parent.clientWidth * 0.65)
    draw()
    return () => ro.disconnect()
  }, [draw])

  return (
    <div
      className="w-full rounded-2xl overflow-hidden p-3"
      style={{
        background: "var(--glass-fill)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <canvas ref={canvasRef} className="w-full" style={{ display: "block" }} />
    </div>
  )
}

export function GCDVisualizer() {
  const [a, setA] = useState(48)
  const [b, setB] = useState(18)
  const [currentStep, setCurrentStep] = useState(-1)
  const [animating, setAnimating] = useState(false)
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const steps = euclideanSteps(a, b)
  const result = steps.length > 0 ? steps[steps.length - 1].b : Math.max(a, b)

  const reset = useCallback(() => {
    if (animRef.current) clearInterval(animRef.current)
    setAnimating(false)
    setCurrentStep(-1)
  }, [])

  const animate = useCallback(() => {
    reset()
    setAnimating(true)
    let idx = 0
    const iv = setInterval(() => {
      setCurrentStep(idx)
      idx++
      if (idx >= steps.length) {
        clearInterval(iv)
        setAnimating(false)
      }
    }, 600)
    animRef.current = iv
  }, [reset, steps.length])

  const doStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1))
  }, [steps.length])

  useEffect(() => {
    return () => {
      if (animRef.current) clearInterval(animRef.current)
    }
  }, [])

  return {
    canvas: (
      <CanvasErrorBoundary>
        <GCDCanvas a={a} b={b} currentStep={currentStep} steps={steps} />
      </CanvasErrorBoundary>
    ),
    controls: (
      <div className="space-y-4">
        {/* GCD result */}
        <div
          className="text-center py-2 px-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(48,209,88,0.12)", color: "#30d158" }}
        >
          gcd({a}, {b}) = {result}
        </div>

        {/* Steps display */}
        <div
          className="text-xs max-h-32 overflow-y-auto rounded-lg p-2 space-y-1"
          style={{ background: "var(--muted)", color: "var(--foreground)" }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-1"
              style={{ opacity: i <= currentStep ? 1 : 0.3 }}
            >
              <span className="font-mono">
                {s.a} = {s.quotient} × {s.b} + {s.remainder}
              </span>
            </div>
          ))}
        </div>

        {/* Input A */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
            a
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={a}
            onChange={(e) => { setA(Math.max(1, Number(e.target.value) || 1)); reset() }}
            className="flex h-9 w-full rounded-xl px-3 py-1.5 text-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Input B */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
            b
          </label>
          <input
            type="number"
            min={1}
            max={200}
            value={b}
            onChange={(e) => { setB(Math.max(1, Number(e.target.value) || 1)); reset() }}
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
