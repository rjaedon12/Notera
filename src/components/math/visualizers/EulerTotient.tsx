"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { CanvasErrorBoundary } from "@/components/math/ErrorBoundary"

function gcd(a: number, b: number): number {
  while (b) { [a, b] = [b, a % b] }
  return a
}

function totient(n: number): number {
  let result = 0
  for (let i = 1; i <= n; i++) {
    if (gcd(i, n) === 1) result++
  }
  return result
}

interface EulerTotientCanvasProps {
  n: number
  highlightCoprime: boolean
}

function EulerTotientCanvas({ n, highlightCoprime }: EulerTotientCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isDark = document.documentElement.classList.contains("dark")
    const cols = Math.min(n, Math.max(8, Math.floor(canvas.width / 44)))
    const cellSize = Math.floor(canvas.width / cols)
    const rows = Math.ceil(n / cols)
    canvas.height = rows * cellSize + 4

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = 1; i <= n; i++) {
      const idx = i - 1
      const col = idx % cols
      const row = Math.floor(idx / cols)
      const x = col * cellSize
      const y = row * cellSize
      const isCoprime = gcd(i, n) === 1

      let bgColor: string
      let textColor: string

      if (highlightCoprime && isCoprime) {
        bgColor = "rgba(160,80,220,0.7)"
        textColor = "#ffffff"
      } else if (highlightCoprime && !isCoprime) {
        bgColor = isDark ? "#1c1c1e" : "#d1d1d6"
        textColor = isDark ? "#636366" : "#8e8e93"
      } else {
        bgColor = isDark ? "#2c2c2e" : "#e5e5ea"
        textColor = isDark ? "#f5f5f7" : "#1d1d1f"
      }

      ctx.fillStyle = bgColor
      ctx.beginPath()
      ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, 4)
      ctx.fill()

      ctx.fillStyle = textColor
      ctx.font = `${Math.max(10, cellSize * 0.35)}px system-ui`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(String(i), x + cellSize / 2, y + cellSize / 2)
    }
  }, [n, highlightCoprime])

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

export function EulerTotient() {
  const [n, setN] = useState(30)
  const [highlightCoprime, setHighlightCoprime] = useState(true)

  const phi = totient(n)
  const coprimes: number[] = []
  for (let i = 1; i <= n; i++) {
    if (gcd(i, n) === 1) coprimes.push(i)
  }

  return {
    canvas: (
      <CanvasErrorBoundary>
        <EulerTotientCanvas n={n} highlightCoprime={highlightCoprime} />
      </CanvasErrorBoundary>
    ),
    controls: (
      <div className="space-y-4">
        {/* Totient result */}
        <div
          className="text-center py-2 px-3 rounded-xl text-sm font-medium"
          style={{ background: "rgba(160,80,220,0.12)", color: "#a050dc" }}
        >
          φ({n}) = {phi}
        </div>

        {/* N slider */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
            <span>n</span>
            <span className="font-medium" style={{ color: "var(--foreground)" }}>{n}</span>
          </div>
          <input
            type="range"
            min={2}
            max={100}
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={highlightCoprime}
            onChange={(e) => setHighlightCoprime(e.target.checked)}
            className="rounded accent-primary"
          />
          <span className="text-sm" style={{ color: "var(--foreground)" }}>
            Highlight coprimes
          </span>
        </label>

        {/* Coprime list */}
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
            Integers coprime to {n}:
          </p>
          <div
            className="text-xs leading-relaxed max-h-24 overflow-y-auto rounded-lg p-2"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
          >
            {coprimes.join(", ")}
          </div>
        </div>
      </div>
    ),
  }
}
