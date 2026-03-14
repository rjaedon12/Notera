"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { CanvasErrorBoundary } from "@/components/math/ErrorBoundary"

type CellState = "default" | "prime" | "current-prime" | "checking" | "composite"

interface PrimeSieveProps {
  limit: number
  speed: number
  running: boolean
  onPrimesFound: (count: number) => void
  onFinished: () => void
  resetKey: number
}

function PrimeSieveCanvas({ limit, speed, running, onPrimesFound, onFinished, resetKey }: PrimeSieveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<CellState[]>([])
  const animRef = useRef<number | null>(null)
  const runningRef = useRef(running)
  const speedRef = useRef(speed)
  const currentPrimeRef = useRef(2)
  const currentMultipleRef = useRef(0)
  const phaseRef = useRef<"idle" | "finding-prime" | "marking-multiples" | "done">("idle")
  const lastStepRef = useRef(0)

  runningRef.current = running
  speedRef.current = speed

  const getCols = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return 10
    const w = canvas.width
    const cellSize = Math.max(24, Math.min(40, w / 15))
    return Math.floor(w / cellSize)
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const cols = getCols()
    const cellSize = Math.floor(canvas.width / cols)
    const rows = Math.ceil((limit - 1) / cols)
    canvas.height = rows * cellSize + 4

    const isDark = document.documentElement.classList.contains("dark")

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const colors: Record<CellState, string> = {
      default: isDark ? "#2c2c2e" : "#e5e5ea",
      prime: "#30d158",
      "current-prime": "#007AFF",
      checking: "#FF453A",
      composite: isDark ? "#1c1c1e" : "#d1d1d6",
    }

    const textColors: Record<CellState, string> = {
      default: isDark ? "#f5f5f7" : "#1d1d1f",
      prime: "#ffffff",
      "current-prime": "#ffffff",
      checking: "#ffffff",
      composite: isDark ? "#636366" : "#8e8e93",
    }

    for (let num = 2; num <= limit; num++) {
      const idx = num - 2
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x = col * cellSize
      const y = row * cellSize
      const state = stateRef.current[idx] || "default"

      ctx.fillStyle = colors[state]
      ctx.beginPath()
      ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 4)
      ctx.fill()

      ctx.fillStyle = textColors[state]
      ctx.font = `${Math.max(10, cellSize * 0.35)}px system-ui`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(String(num), x + cellSize / 2, y + cellSize / 2)
    }
  }, [limit, getCols])

  // Reset
  useEffect(() => {
    stateRef.current = new Array(limit - 1).fill("default")
    currentPrimeRef.current = 2
    currentMultipleRef.current = 0
    phaseRef.current = "idle"
    lastStepRef.current = 0
    if (animRef.current) cancelAnimationFrame(animRef.current)
    onPrimesFound(0)
    draw()
  }, [resetKey, limit, draw, onPrimesFound])

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ro = new ResizeObserver(() => {
      canvas.width = parent.clientWidth
      draw()
    })
    ro.observe(parent)
    canvas.width = parent.clientWidth
    draw()
    return () => ro.disconnect()
  }, [draw])

  // Animation loop
  useEffect(() => {
    if (!running) return

    if (phaseRef.current === "idle") {
      phaseRef.current = "finding-prime"
    }

    const step = (timestamp: number) => {
      if (!runningRef.current) return

      if (timestamp - lastStepRef.current < speedRef.current) {
        animRef.current = requestAnimationFrame(step)
        return
      }
      lastStepRef.current = timestamp

      const states = stateRef.current

      if (phaseRef.current === "finding-prime") {
        let p = currentPrimeRef.current
        // find next unmarked
        while (p * p <= limit && states[p - 2] === "composite") {
          p++
        }
        if (p * p > limit) {
          // Mark remaining unmarked as prime
          for (let i = 0; i < states.length; i++) {
            if (states[i] === "default" || states[i] === "current-prime") {
              states[i] = "prime"
            }
          }
          phaseRef.current = "done"
          const count = states.filter((s) => s === "prime").length
          onPrimesFound(count)
          onFinished()
          draw()
          return
        }
        // Clear previous current-prime highlight
        for (let i = 0; i < states.length; i++) {
          if (states[i] === "current-prime") states[i] = "prime"
          if (states[i] === "checking") states[i] = "composite"
        }
        currentPrimeRef.current = p
        states[p - 2] = "current-prime"
        currentMultipleRef.current = p * 2
        phaseRef.current = "marking-multiples"
        const count = states.filter((s) => s === "prime" || s === "current-prime").length
        onPrimesFound(count)
        draw()
      } else if (phaseRef.current === "marking-multiples") {
        const p = currentPrimeRef.current
        const m = currentMultipleRef.current

        if (m <= limit) {
          // clear previous flash
          for (let i = 0; i < states.length; i++) {
            if (states[i] === "checking") states[i] = "composite"
          }
          states[m - 2] = "checking"
          currentMultipleRef.current = m + p
          draw()
        } else {
          // clear flash
          for (let i = 0; i < states.length; i++) {
            if (states[i] === "checking") states[i] = "composite"
          }
          currentPrimeRef.current = currentPrimeRef.current + 1
          phaseRef.current = "finding-prime"
          draw()
        }
      }

      animRef.current = requestAnimationFrame(step)
    }

    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [running, limit, draw, onPrimesFound, onFinished])

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

export function PrimeSieve() {
  const [limit, setLimit] = useState(100)
  const [speed, setSpeed] = useState(100)
  const [running, setRunning] = useState(false)
  const [primesFound, setPrimesFound] = useState(0)
  const [resetKey, setResetKey] = useState(0)
  const [finished, setFinished] = useState(false)

  return {
    canvas: (
      <CanvasErrorBoundary>
        <PrimeSieveCanvas
          limit={limit}
          speed={speed}
          running={running}
          onPrimesFound={setPrimesFound}
          onFinished={() => { setRunning(false); setFinished(true) }}
          resetKey={resetKey}
        />
      </CanvasErrorBoundary>
    ),
    controls: (
      <div className="space-y-4">
        {/* Primes found counter */}
        <div
          className="text-center py-2 px-3 rounded-xl text-sm font-medium"
          style={{
            background: primesFound > 0 ? "rgba(48,209,88,0.12)" : "var(--muted)",
            color: primesFound > 0 ? "#30d158" : "var(--muted-foreground)",
          }}
        >
          Primes found: {primesFound}
        </div>

        {/* Limit slider */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
            <span>Limit</span>
            <span className="font-medium" style={{ color: "var(--foreground)" }}>{limit}</span>
          </div>
          <input
            type="range"
            min={50}
            max={300}
            step={10}
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value))
              setRunning(false)
              setFinished(false)
              setResetKey((k) => k + 1)
            }}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Speed slider */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
            <span>Speed</span>
            <span className="font-medium" style={{ color: "var(--foreground)" }}>{speed}ms</span>
          </div>
          <input
            type="range"
            min={20}
            max={500}
            step={10}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { setRunning(!running); setFinished(false) }}
            disabled={finished}
            className="flex-1 h-9 rounded-xl text-sm font-medium transition-all disabled:opacity-40"
            style={{
              background: running ? "rgba(255,69,58,0.15)" : "var(--primary)",
              color: running ? "#FF453A" : "var(--primary-foreground)",
              border: running ? "1px solid rgba(255,69,58,0.3)" : "none",
            }}
          >
            {running ? "Pause" : "Run Sieve"}
          </button>
          <button
            onClick={() => {
              setRunning(false)
              setFinished(false)
              setResetKey((k) => k + 1)
            }}
            className="h-9 px-4 rounded-xl text-sm font-medium transition-all"
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
    primesFound,
  }
}
