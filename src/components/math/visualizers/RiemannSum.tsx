"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { CanvasErrorBoundary } from "@/components/math/ErrorBoundary"
import * as mathjs from "mathjs"

interface RiemannCanvasProps {
  expr: string
  lowerBound: number
  upperBound: number
  numRects: number
  method: "left" | "right" | "midpoint"
}

function evaluateExpr(expr: string, x: number): number {
  try {
    const node = mathjs.parse(expr)
    const compiled = node.compile()
    const result = compiled.evaluate({ x }) as number
    return typeof result === "number" && isFinite(result) ? result : 0
  } catch {
    return 0
  }
}

function computeRiemannSum(
  expr: string,
  a: number,
  b: number,
  n: number,
  method: "left" | "right" | "midpoint"
): number {
  const dx = (b - a) / n
  let sum = 0
  for (let i = 0; i < n; i++) {
    let x: number
    switch (method) {
      case "left":
        x = a + i * dx
        break
      case "right":
        x = a + (i + 1) * dx
        break
      case "midpoint":
        x = a + (i + 0.5) * dx
        break
    }
    sum += evaluateExpr(expr, x) * dx
  }
  return sum
}

function RiemannCanvas({ expr, lowerBound, upperBound, numRects, method }: RiemannCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isDark = document.documentElement.classList.contains("dark")
    const w = canvas.width
    const h = canvas.height
    const padding = { top: 20, right: 20, bottom: 30, left: 50 }
    const plotW = w - padding.left - padding.right
    const plotH = h - padding.top - padding.bottom

    ctx.clearRect(0, 0, w, h)

    // Find y range
    const margin = (upperBound - lowerBound) * 0.15
    const xMin = lowerBound - margin
    const xMax = upperBound + margin
    let yMin = 0
    let yMax = 0

    const samplePoints = 200
    for (let i = 0; i <= samplePoints; i++) {
      const x = xMin + (i / samplePoints) * (xMax - xMin)
      const y = evaluateExpr(expr, x)
      if (y < yMin) yMin = y
      if (y > yMax) yMax = y
    }
    const yPad = (yMax - yMin) * 0.15 || 1
    yMin -= yPad
    yMax += yPad

    const toScreenX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW
    const toScreenY = (y: number) => padding.top + ((yMax - y) / (yMax - yMin)) * plotH

    // Grid
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
    ctx.lineWidth = 1
    const gridStep = Math.pow(10, Math.floor(Math.log10((xMax - xMin) / 5)))
    for (let gx = Math.ceil(xMin / gridStep) * gridStep; gx <= xMax; gx += gridStep) {
      const sx = toScreenX(gx)
      ctx.beginPath()
      ctx.moveTo(sx, padding.top)
      ctx.lineTo(sx, padding.top + plotH)
      ctx.stroke()
    }

    // X axis
    if (yMin <= 0 && yMax >= 0) {
      ctx.strokeStyle = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.2)"
      ctx.lineWidth = 1
      const axisY = toScreenY(0)
      ctx.beginPath()
      ctx.moveTo(padding.left, axisY)
      ctx.lineTo(padding.left + plotW, axisY)
      ctx.stroke()
    }

    // Draw rectangles
    const dx = (upperBound - lowerBound) / numRects
    for (let i = 0; i < numRects; i++) {
      let sampleX: number
      switch (method) {
        case "left":
          sampleX = lowerBound + i * dx
          break
        case "right":
          sampleX = lowerBound + (i + 1) * dx
          break
        case "midpoint":
          sampleX = lowerBound + (i + 0.5) * dx
          break
      }
      const y = evaluateExpr(expr, sampleX)
      const rectLeft = toScreenX(lowerBound + i * dx)
      const rectRight = toScreenX(lowerBound + (i + 1) * dx)
      const rectWidth = rectRight - rectLeft
      const zeroY = toScreenY(0)
      const topY = toScreenY(y)

      ctx.fillStyle = y >= 0 ? "rgba(0,122,255,0.25)" : "rgba(255,69,58,0.25)"
      ctx.strokeStyle = y >= 0 ? "rgba(0,122,255,0.6)" : "rgba(255,69,58,0.6)"
      ctx.lineWidth = 1

      const rectY = Math.min(zeroY, topY)
      const rectH = Math.abs(topY - zeroY)
      ctx.fillRect(rectLeft, rectY, rectWidth, rectH)
      ctx.strokeRect(rectLeft, rectY, rectWidth, rectH)
    }

    // Plot function curve
    ctx.strokeStyle = isDark ? "#f5f5f7" : "#1d1d1f"
    ctx.lineWidth = 2
    ctx.beginPath()
    let started = false
    for (let px = 0; px <= plotW; px++) {
      const x = xMin + (px / plotW) * (xMax - xMin)
      const y = evaluateExpr(expr, x)
      const sy = toScreenY(y)
      if (!started) {
        ctx.moveTo(padding.left + px, sy)
        started = true
      } else {
        ctx.lineTo(padding.left + px, sy)
      }
    }
    ctx.stroke()

    // Bound markers
    ctx.strokeStyle = "rgba(160,80,220,0.7)"
    ctx.lineWidth = 2
    ctx.setLineDash([4, 4])
    const lx = toScreenX(lowerBound)
    ctx.beginPath()
    ctx.moveTo(lx, padding.top)
    ctx.lineTo(lx, padding.top + plotH)
    ctx.stroke()
    const ux = toScreenX(upperBound)
    ctx.beginPath()
    ctx.moveTo(ux, padding.top)
    ctx.lineTo(ux, padding.top + plotH)
    ctx.stroke()
    ctx.setLineDash([])

    // Labels
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"
    ctx.font = "10px system-ui"
    ctx.textAlign = "center"
    ctx.fillText(`a=${lowerBound}`, lx, padding.top + plotH + 14)
    ctx.fillText(`b=${upperBound}`, ux, padding.top + plotH + 14)
  }, [expr, lowerBound, upperBound, numRects, method])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ro = new ResizeObserver(() => {
      canvas.width = parent.clientWidth
      canvas.height = Math.min(420, parent.clientWidth * 0.6)
      draw()
    })
    ro.observe(parent)
    canvas.width = parent.clientWidth
    canvas.height = Math.min(420, parent.clientWidth * 0.6)
    draw()
    return () => ro.disconnect()
  }, [draw])

  return <canvas ref={canvasRef} className="w-full" style={{ display: "block" }} />
}

export function RiemannSum() {
  const [expr, setExpr] = useState("x^2")
  const [lower, setLower] = useState(0)
  const [upper, setUpper] = useState(3)
  const [numRects, setNumRects] = useState(10)
  const [method, setMethod] = useState<"left" | "right" | "midpoint">("left")

  const sum = computeRiemannSum(expr, lower, upper, numRects, method)

  return {
    canvas: (
      <CanvasErrorBoundary>
        <div
          className="w-full rounded-2xl overflow-hidden p-2"
          style={{
            background: "var(--glass-fill)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <RiemannCanvas
            expr={expr}
            lowerBound={lower}
            upperBound={upper}
            numRects={numRects}
            method={method}
          />
        </div>
      </CanvasErrorBoundary>
    ),
    controls: (
      <div className="space-y-4">
        {/* Sum result */}
        <div
          className="text-center py-2 px-3 rounded-xl text-sm font-medium font-mono"
          style={{ background: "rgba(94,92,230,0.12)", color: "#5E5CE6" }}
        >
          Σ ≈ {sum.toFixed(6)}
        </div>

        {/* Function input */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
            f(x) =
          </label>
          <input
            type="text"
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            className="flex h-9 w-full rounded-xl px-3 py-1.5 text-sm font-mono backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        {/* Bounds */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
              Lower (a)
            </label>
            <input
              type="number"
              value={lower}
              step={0.5}
              onChange={(e) => setLower(Number(e.target.value))}
              className="flex h-9 w-full rounded-xl px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                background: "var(--glass-fill)",
                border: "1px solid var(--glass-border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
              Upper (b)
            </label>
            <input
              type="number"
              value={upper}
              step={0.5}
              onChange={(e) => setUpper(Number(e.target.value))}
              className="flex h-9 w-full rounded-xl px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              style={{
                background: "var(--glass-fill)",
                border: "1px solid var(--glass-border)",
                color: "var(--foreground)",
              }}
            />
          </div>
        </div>

        {/* Rectangles slider */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
            <span>Rectangles (n)</span>
            <span className="font-medium" style={{ color: "var(--foreground)" }}>{numRects}</span>
          </div>
          <input
            type="range"
            min={1}
            max={500}
            value={numRects}
            onChange={(e) => setNumRects(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Method */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Method
          </p>
          <div className="flex gap-1.5">
            {(["left", "right", "midpoint"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMethod(m)}
                className="flex-1 h-8 rounded-lg text-xs font-medium capitalize"
                style={{
                  background: method === m ? "var(--primary)" : "var(--muted)",
                  color: method === m ? "var(--primary-foreground)" : "var(--foreground)",
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { label: "x²", expr: "x^2", a: 0, b: 3 },
            { label: "sin(x)", expr: "sin(x)", a: 0, b: 3.14159 },
            { label: "1/x", expr: "1/x", a: 1, b: 5 },
            { label: "e^x", expr: "exp(x)", a: 0, b: 2 },
          ].map((p) => (
            <button
              key={p.label}
              onClick={() => { setExpr(p.expr); setLower(p.a); setUpper(p.b) }}
              className="text-xs px-2.5 py-1 rounded-full font-mono"
              style={{
                background: "var(--muted)",
                color: "var(--foreground)",
                border: "1px solid var(--glass-border)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    ),
  }
}
