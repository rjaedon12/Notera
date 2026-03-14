"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { CanvasErrorBoundary } from "@/components/math/ErrorBoundary"
import * as mathjs from "mathjs"

interface FunctionEntry {
  id: string
  expr: string
  color: string
  compiled: mathjs.EvalFunction | null
  error: string | null
}

const COLORS = ["#007AFF", "#FF453A", "#30d158", "#FF9F0A", "#a050dc", "#5E5CE6", "#00C7BE"]

function GraphCanvas({
  functions,
  viewX,
  viewY,
  viewW,
  viewH,
}: {
  functions: FunctionEntry[]
  viewX: number
  viewY: number
  viewW: number
  viewH: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const isDark = document.documentElement.classList.contains("dark")
    const w = canvas.width
    const h = canvas.height

    ctx.clearRect(0, 0, w, h)

    // Background
    ctx.fillStyle = isDark ? "rgba(28,28,30,0.5)" : "rgba(255,255,255,0.5)"
    ctx.fillRect(0, 0, w, h)

    const toScreenX = (x: number) => ((x - viewX) / viewW) * w
    const toScreenY = (y: number) => ((viewY + viewH - y) / viewH) * h

    // Grid lines
    const gridSpacing = Math.pow(10, Math.floor(Math.log10(viewW / 5)))
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"
    ctx.lineWidth = 1

    const startX = Math.floor(viewX / gridSpacing) * gridSpacing
    for (let gx = startX; gx <= viewX + viewW; gx += gridSpacing) {
      const sx = toScreenX(gx)
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, h)
      ctx.stroke()
    }

    const startY = Math.floor(viewY / gridSpacing) * gridSpacing
    for (let gy = startY; gy <= viewY + viewH; gy += gridSpacing) {
      const sy = toScreenY(gy)
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(w, sy)
      ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.25)"
    ctx.lineWidth = 1.5

    // X axis
    if (viewY <= 0 && viewY + viewH >= 0) {
      const sy = toScreenY(0)
      ctx.beginPath()
      ctx.moveTo(0, sy)
      ctx.lineTo(w, sy)
      ctx.stroke()
    }
    // Y axis
    if (viewX <= 0 && viewX + viewW >= 0) {
      const sx = toScreenX(0)
      ctx.beginPath()
      ctx.moveTo(sx, 0)
      ctx.lineTo(sx, h)
      ctx.stroke()
    }

    // Axis labels
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"
    ctx.font = "10px system-ui"
    ctx.textAlign = "center"
    for (let gx = startX; gx <= viewX + viewW; gx += gridSpacing) {
      if (Math.abs(gx) < gridSpacing * 0.01) continue
      const sx = toScreenX(gx)
      const sy = toScreenY(0)
      if (sy > 10 && sy < h - 5) {
        const label = Math.abs(gx) >= 1000 || (Math.abs(gx) < 0.01 && gx !== 0)
          ? gx.toExponential(0) : Number(gx.toPrecision(6)).toString()
        ctx.fillText(label, sx, Math.min(h - 5, sy + 14))
      }
    }

    ctx.textAlign = "right"
    for (let gy = startY; gy <= viewY + viewH; gy += gridSpacing) {
      if (Math.abs(gy) < gridSpacing * 0.01) continue
      const sx = toScreenX(0)
      const sy = toScreenY(gy)
      if (sx > 5 && sx < w - 5) {
        const label = Math.abs(gy) >= 1000 || (Math.abs(gy) < 0.01 && gy !== 0)
          ? gy.toExponential(0) : Number(gy.toPrecision(6)).toString()
        ctx.fillText(label, Math.max(30, sx - 4), sy + 3)
      }
    }

    // Plot functions
    for (const fn of functions) {
      if (!fn.compiled || fn.error) continue
      ctx.strokeStyle = fn.color
      ctx.lineWidth = 2
      ctx.beginPath()
      let started = false

      for (let px = 0; px < w; px++) {
        const x = viewX + (px / w) * viewW
        try {
          const y = fn.compiled.evaluate({ x }) as number
          if (typeof y !== "number" || !isFinite(y)) {
            started = false
            continue
          }
          const sy = toScreenY(y)
          if (!started) {
            ctx.moveTo(px, sy)
            started = true
          } else {
            ctx.lineTo(px, sy)
          }
        } catch {
          started = false
        }
      }
      ctx.stroke()
    }
  }, [functions, viewX, viewY, viewW, viewH])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ro = new ResizeObserver(() => {
      canvas.width = parent.clientWidth
      canvas.height = Math.min(500, parent.clientWidth * 0.7)
      draw()
    })
    ro.observe(parent)
    canvas.width = parent.clientWidth
    canvas.height = Math.min(500, parent.clientWidth * 0.7)
    draw()
    return () => ro.disconnect()
  }, [draw])

  return <canvas ref={canvasRef} className="w-full" style={{ display: "block" }} />
}

export function GraphingCalculator() {
  const [functions, setFunctions] = useState<FunctionEntry[]>([
    { id: "1", expr: "x^2", color: COLORS[0], compiled: null, error: null },
  ])
  const [viewX, setViewX] = useState(-10)
  const [viewY, setViewY] = useState(-10)
  const [viewW, setViewW] = useState(20)
  const [viewH, setViewH] = useState(20)

  // Compile expressions
  useEffect(() => {
    setFunctions((prev) =>
      prev.map((fn) => {
        try {
          const node = mathjs.parse(fn.expr)
          const compiled = node.compile()
          // Test eval
          compiled.evaluate({ x: 0 })
          return { ...fn, compiled, error: null }
        } catch (e: any) {
          return { ...fn, compiled: null, error: e.message || "Invalid expression" }
        }
      })
    )
  }, [functions.map((f) => f.expr).join("|")])

  const addFunction = () => {
    const id = String(Date.now())
    setFunctions((prev) => [
      ...prev,
      { id, expr: "", color: COLORS[prev.length % COLORS.length], compiled: null, error: null },
    ])
  }

  const removeFunction = (id: string) => {
    setFunctions((prev) => prev.filter((f) => f.id !== id))
  }

  const updateExpr = (id: string, expr: string) => {
    setFunctions((prev) => prev.map((f) => (f.id === id ? { ...f, expr } : f)))
  }

  const zoomIn = () => {
    const cx = viewX + viewW / 2
    const cy = viewY + viewH / 2
    const nw = viewW * 0.7
    const nh = viewH * 0.7
    setViewX(cx - nw / 2)
    setViewY(cy - nh / 2)
    setViewW(nw)
    setViewH(nh)
  }

  const zoomOut = () => {
    const cx = viewX + viewW / 2
    const cy = viewY + viewH / 2
    const nw = viewW * 1.4
    const nh = viewH * 1.4
    setViewX(cx - nw / 2)
    setViewY(cy - nh / 2)
    setViewW(nw)
    setViewH(nh)
  }

  const resetView = () => {
    setViewX(-10)
    setViewY(-10)
    setViewW(20)
    setViewH(20)
  }

  return {
    canvas: (
      <CanvasErrorBoundary>
        <div
          className="w-full rounded-2xl overflow-hidden p-1"
          style={{
            background: "var(--glass-fill)",
            border: "1px solid var(--glass-border)",
          }}
        >
          <GraphCanvas
            functions={functions}
            viewX={viewX}
            viewY={viewY}
            viewW={viewW}
            viewH={viewH}
          />
        </div>
      </CanvasErrorBoundary>
    ),
    controls: (
      <div className="space-y-4">
        {/* Function inputs */}
        <div className="space-y-2">
          {functions.map((fn, i) => (
            <div key={fn.id} className="flex gap-2 items-center">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: fn.color }}
              />
              <input
                type="text"
                value={fn.expr}
                onChange={(e) => updateExpr(fn.id, e.target.value)}
                placeholder="e.g. sin(x)"
                className="flex-1 h-8 rounded-lg px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                style={{
                  background: "var(--glass-fill)",
                  border: `1px solid ${fn.error ? "rgba(255,69,58,0.5)" : "var(--glass-border)"}`,
                  color: "var(--foreground)",
                }}
              />
              {functions.length > 1 && (
                <button
                  onClick={() => removeFunction(fn.id)}
                  className="text-xs px-2 h-8 rounded-lg"
                  style={{
                    background: "rgba(255,69,58,0.1)",
                    color: "#FF453A",
                    border: "1px solid rgba(255,69,58,0.2)",
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={addFunction}
          className="w-full h-8 rounded-lg text-xs font-medium"
          style={{
            background: "var(--secondary)",
            color: "var(--secondary-foreground)",
            border: "1px solid var(--glass-border)",
          }}
        >
          + Add Function
        </button>

        {/* Zoom controls */}
        <div className="flex gap-2">
          <button
            onClick={zoomIn}
            className="flex-1 h-9 rounded-xl text-sm font-medium"
            style={{
              background: "var(--secondary)",
              color: "var(--secondary-foreground)",
              border: "1px solid var(--glass-border)",
            }}
          >
            Zoom In
          </button>
          <button
            onClick={zoomOut}
            className="flex-1 h-9 rounded-xl text-sm font-medium"
            style={{
              background: "var(--secondary)",
              color: "var(--secondary-foreground)",
              border: "1px solid var(--glass-border)",
            }}
          >
            Zoom Out
          </button>
          <button
            onClick={resetView}
            className="h-9 px-3 rounded-xl text-sm font-medium"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            Reset
          </button>
        </div>

        {/* View info */}
        <div
          className="text-xs rounded-lg p-2"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          x: [{viewX.toFixed(1)}, {(viewX + viewW).toFixed(1)}] · y: [{viewY.toFixed(1)}, {(viewY + viewH).toFixed(1)}]
        </div>
      </div>
    ),
  }
}
