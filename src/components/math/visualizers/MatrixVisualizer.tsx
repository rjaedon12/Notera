"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { CanvasErrorBoundary } from "@/components/math/ErrorBoundary"

type Matrix2x2 = [[number, number], [number, number]]

function matMul(a: Matrix2x2, b: Matrix2x2): Matrix2x2 {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ]
}

function det(m: Matrix2x2): number {
  return m[0][0] * m[1][1] - m[0][1] * m[1][0]
}

function transpose(m: Matrix2x2): Matrix2x2 {
  return [
    [m[0][0], m[1][0]],
    [m[0][1], m[1][1]],
  ]
}

interface MatrixCanvasProps {
  matrix: Matrix2x2
  showTransformed: boolean
  animProgress: number
}

function MatrixCanvas({ matrix, showTransformed, animProgress }: MatrixCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isDark = document.documentElement.classList.contains("dark")
    const w = canvas.width
    const h = canvas.height
    const cx = w / 2
    const cy = h / 2
    const scale = Math.min(w, h) / 8

    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = isDark ? "rgba(28,28,30,0.5)" : "rgba(255,255,255,0.5)"
    ctx.fillRect(0, 0, w, h)

    // Grid
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
    ctx.lineWidth = 1
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath()
      ctx.moveTo(cx + i * scale, 0)
      ctx.lineTo(cx + i * scale, h)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, cy + i * scale)
      ctx.lineTo(w, cy + i * scale)
      ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, cy)
    ctx.lineTo(w, cy)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(cx, 0)
    ctx.lineTo(cx, h)
    ctx.stroke()

    // Unit square (original)
    const unitSquare = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]

    // Draw original unit square
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 0; i < 4; i++) {
      const [x, y] = unitSquare[i]
      const sx = cx + x * scale
      const sy = cy - y * scale
      if (i === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.setLineDash([])

    if (showTransformed) {
      // Interpolate between identity and matrix based on animProgress
      const m: Matrix2x2 = [
        [1 + (matrix[0][0] - 1) * animProgress, matrix[0][1] * animProgress],
        [matrix[1][0] * animProgress, 1 + (matrix[1][1] - 1) * animProgress],
      ]

      // Transform unit square
      const transformedSquare = unitSquare.map(([x, y]) => [
        m[0][0] * x + m[0][1] * y,
        m[1][0] * x + m[1][1] * y,
      ])

      // Fill transformed
      ctx.fillStyle = "rgba(0,122,255,0.15)"
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const [x, y] = transformedSquare[i]
        const sx = cx + x * scale
        const sy = cy - y * scale
        if (i === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.closePath()
      ctx.fill()

      // Stroke transformed
      ctx.strokeStyle = "#007AFF"
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < 4; i++) {
        const [x, y] = transformedSquare[i]
        const sx = cx + x * scale
        const sy = cy - y * scale
        if (i === 0) ctx.moveTo(sx, sy)
        else ctx.lineTo(sx, sy)
      }
      ctx.closePath()
      ctx.stroke()

      // Basis vectors
      // e1
      const e1x = cx + m[0][0] * scale
      const e1y = cy - m[1][0] * scale
      ctx.strokeStyle = "#FF453A"
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(e1x, e1y)
      ctx.stroke()

      // e2
      const e2x = cx + m[0][1] * scale
      const e2y = cy - m[1][1] * scale
      ctx.strokeStyle = "#30d158"
      ctx.lineWidth = 2.5
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.lineTo(e2x, e2y)
      ctx.stroke()
    }
  }, [matrix, showTransformed, animProgress])

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

  return <canvas ref={canvasRef} style={{ display: "block", maxWidth: 500, width: "100%" }} />
}

export function MatrixVisualizer() {
  const [matrix, setMatrix] = useState<Matrix2x2>([
    [2, 1],
    [0, 1.5],
  ])
  const [showTransformed, setShowTransformed] = useState(true)
  const [animProgress, setAnimProgress] = useState(1)
  const [animating, setAnimating] = useState(false)
  const animRef = useRef<number | null>(null)

  const d = det(matrix)
  const t = transpose(matrix)

  const animate = useCallback(() => {
    setAnimProgress(0)
    setShowTransformed(true)
    setAnimating(true)
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const elapsed = ts - start
      const progress = Math.min(1, elapsed / 1000)
      setAnimProgress(progress)
      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        setAnimating(false)
      }
    }
    animRef.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [])

  const updateCell = (r: number, c: number, val: string) => {
    const num = parseFloat(val) || 0
    setMatrix((prev) => {
      const next: Matrix2x2 = [
        [prev[0][0], prev[0][1]],
        [prev[1][0], prev[1][1]],
      ]
      next[r][c] = num
      return next
    })
  }

  return {
    canvas: (
      <CanvasErrorBoundary>
        <div
          className="w-full rounded-2xl overflow-hidden flex items-center justify-center p-4"
          style={{
            background: "var(--glass-fill)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <MatrixCanvas matrix={matrix} showTransformed={showTransformed} animProgress={animProgress} />
        </div>
      </CanvasErrorBoundary>
    ),
    controls: (
      <div className="space-y-4">
        {/* Determinant */}
        <div
          className="text-center py-2 px-3 rounded-xl text-sm font-medium"
          style={{
            background: Math.abs(d) < 0.001 ? "rgba(255,69,58,0.12)" : "rgba(0,122,255,0.12)",
            color: Math.abs(d) < 0.001 ? "#FF453A" : "#007AFF",
          }}
        >
          det(A) = {d.toFixed(4)} {Math.abs(d) < 0.001 ? "(singular!)" : ""}
        </div>

        {/* Matrix input */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Matrix A (2×2)
          </p>
          <div className="grid grid-cols-2 gap-2">
            {[0, 1].map((r) =>
              [0, 1].map((c) => (
                <input
                  key={`${r}-${c}`}
                  type="number"
                  step="0.5"
                  value={matrix[r][c]}
                  onChange={(e) => updateCell(r, c, e.target.value)}
                  className="h-9 rounded-xl px-3 text-sm text-center font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  style={{
                    background: "var(--glass-fill)",
                    border: "1px solid var(--glass-border)",
                    color: "var(--foreground)",
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Transpose */}
        <div>
          <p className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
            Transpose Aᵀ
          </p>
          <div
            className="grid grid-cols-2 gap-1 p-2 rounded-lg font-mono text-xs text-center"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
          >
            <span>{t[0][0]}</span>
            <span>{t[0][1]}</span>
            <span>{t[1][0]}</span>
            <span>{t[1][1]}</span>
          </div>
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
            onClick={() => setShowTransformed(!showTransformed)}
            className="h-9 px-3 rounded-xl text-sm font-medium"
            style={{
              background: "var(--secondary)",
              color: "var(--secondary-foreground)",
              border: "1px solid var(--glass-border)",
            }}
          >
            {showTransformed ? "Hide" : "Show"}
          </button>
        </div>

        {/* Presets */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Presets:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Rotate 45°", m: [[0.707, -0.707], [0.707, 0.707]] as Matrix2x2 },
              { label: "Shear", m: [[1, 1], [0, 1]] as Matrix2x2 },
              { label: "Scale 2×", m: [[2, 0], [0, 2]] as Matrix2x2 },
              { label: "Reflect X", m: [[1, 0], [0, -1]] as Matrix2x2 },
              { label: "Singular", m: [[1, 2], [0.5, 1]] as Matrix2x2 },
            ].map(({ label, m }) => (
              <button
                key={label}
                onClick={() => { setMatrix(m); setAnimProgress(1); setShowTransformed(true) }}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "var(--muted)",
                  color: "var(--foreground)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    ),
  }
}
