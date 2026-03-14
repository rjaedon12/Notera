"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { CanvasErrorBoundary } from "@/components/math/ErrorBoundary"
import * as ss from "simple-statistics"

function drawHistogram(
  canvas: HTMLCanvasElement,
  data: number[],
  stats: { mean: number; median: number; stdDev: number }
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const isDark = document.documentElement.classList.contains("dark")
  const w = canvas.width
  const h = canvas.height
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const plotW = w - padding.left - padding.right
  const plotH = h - padding.top - padding.bottom

  ctx.clearRect(0, 0, w, h)

  if (data.length === 0) return

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const binCount = Math.max(5, Math.min(20, Math.ceil(Math.sqrt(data.length))))
  const binWidth = range / binCount

  // Create bins
  const bins: number[] = new Array(binCount).fill(0)
  for (const val of data) {
    let idx = Math.floor((val - min) / binWidth)
    if (idx >= binCount) idx = binCount - 1
    bins[idx]++
  }

  const maxBin = Math.max(...bins)

  // Draw bars
  const barWidth = plotW / binCount
  for (let i = 0; i < binCount; i++) {
    const barH = maxBin > 0 ? (bins[i] / maxBin) * plotH : 0
    const x = padding.left + i * barWidth
    const y = padding.top + plotH - barH

    ctx.fillStyle = "rgba(0,122,255,0.5)"
    ctx.fillRect(x + 1, y, barWidth - 2, barH)
    ctx.strokeStyle = "rgba(0,122,255,0.7)"
    ctx.lineWidth = 1
    ctx.strokeRect(x + 1, y, barWidth - 2, barH)
  }

  // Mean line
  const meanX = padding.left + ((stats.mean - min) / range) * plotW
  ctx.strokeStyle = "#FF453A"
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(meanX, padding.top)
  ctx.lineTo(meanX, padding.top + plotH)
  ctx.stroke()
  ctx.setLineDash([])

  // Median line
  const medianX = padding.left + ((stats.median - min) / range) * plotW
  ctx.strokeStyle = "#30d158"
  ctx.lineWidth = 2
  ctx.setLineDash([4, 4])
  ctx.beginPath()
  ctx.moveTo(medianX, padding.top)
  ctx.lineTo(medianX, padding.top + plotH)
  ctx.stroke()
  ctx.setLineDash([])

  // Axes
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(padding.left, padding.top)
  ctx.lineTo(padding.left, padding.top + plotH)
  ctx.lineTo(padding.left + plotW, padding.top + plotH)
  ctx.stroke()

  // X axis labels
  ctx.fillStyle = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"
  ctx.font = "10px system-ui"
  ctx.textAlign = "center"
  for (let i = 0; i <= binCount; i += Math.max(1, Math.floor(binCount / 6))) {
    const val = min + i * binWidth
    const x = padding.left + i * barWidth
    ctx.fillText(val.toFixed(1), x, padding.top + plotH + 16)
  }

  // Legend
  ctx.font = "11px system-ui"
  ctx.textAlign = "left"
  ctx.fillStyle = "#FF453A"
  ctx.fillText("— Mean", padding.left + 4, padding.top + 14)
  ctx.fillStyle = "#30d158"
  ctx.fillText("— Median", padding.left + 64, padding.top + 14)
}

function StatsCanvas({ data, stats }: { data: number[]; stats: { mean: number; median: number; stdDev: number } }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawHistogram(canvas, data, stats)
  }, [data, stats])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const ro = new ResizeObserver(() => {
      canvas.width = parent.clientWidth
      canvas.height = Math.min(350, parent.clientWidth * 0.55)
      draw()
    })
    ro.observe(parent)
    canvas.width = parent.clientWidth
    canvas.height = Math.min(350, parent.clientWidth * 0.55)
    draw()
    return () => ro.disconnect()
  }, [draw])

  return <canvas ref={canvasRef} className="w-full" style={{ display: "block" }} />
}

export function StatsPlayground() {
  const [rawInput, setRawInput] = useState("12, 15, 18, 22, 25, 28, 30, 33, 35, 38, 40, 42, 45, 48, 50")
  const [data, setData] = useState<number[]>([])

  const parseData = useCallback(() => {
    const nums = rawInput
      .split(/[,\s\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map(Number)
      .filter((n) => isFinite(n))
    setData(nums)
  }, [rawInput])

  // Auto-parse on mount
  useEffect(() => {
    parseData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const stats = data.length > 0
    ? {
        mean: ss.mean(data),
        median: ss.median(data),
        mode: ss.mode(data),
        stdDev: ss.standardDeviation(data),
        variance: ss.variance(data),
        min: ss.min(data),
        max: ss.max(data),
        range: ss.max(data) - ss.min(data),
        q1: ss.quantile(data, 0.25),
        q3: ss.quantile(data, 0.75),
        iqr: ss.interquartileRange(data),
        count: data.length,
      }
    : null

  return {
    canvas: (
      <CanvasErrorBoundary>
        <div
          className="w-full rounded-2xl overflow-hidden p-4 space-y-4"
          style={{
            background: "var(--glass-fill)",
            border: "1px solid var(--glass-border)",
          }}
        >
          {/* Histogram */}
          {data.length > 0 ? (
            <StatsCanvas data={data} stats={{ mean: stats!.mean, median: stats!.median, stdDev: stats!.stdDev }} />
          ) : (
            <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
              Enter some numbers and click Compute
            </div>
          )}

          {/* Stats table */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              {[
                { label: "Count", value: stats.count },
                { label: "Mean", value: stats.mean.toFixed(4) },
                { label: "Median", value: stats.median.toFixed(4) },
                { label: "Mode", value: stats.mode },
                { label: "Std Dev", value: stats.stdDev.toFixed(4) },
                { label: "Variance", value: stats.variance.toFixed(4) },
                { label: "Min", value: stats.min },
                { label: "Max", value: stats.max },
                { label: "Range", value: stats.range.toFixed(2) },
                { label: "Q1", value: stats.q1.toFixed(4) },
                { label: "Q3", value: stats.q3.toFixed(4) },
                { label: "IQR", value: stats.iqr.toFixed(4) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="p-2 rounded-lg text-center"
                  style={{ background: "var(--muted)" }}
                >
                  <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {label}
                  </p>
                  <p className="text-sm font-mono font-medium" style={{ color: "var(--foreground)" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </CanvasErrorBoundary>
    ),
    controls: (
      <div className="space-y-4">
        {/* Data input */}
        <div>
          <label className="text-xs mb-1 block" style={{ color: "var(--muted-foreground)" }}>
            Data (comma or space separated)
          </label>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={4}
            className="w-full rounded-xl px-3 py-2 text-sm font-mono backdrop-blur-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            style={{
              background: "var(--glass-fill)",
              border: "1px solid var(--glass-border)",
              color: "var(--foreground)",
            }}
          />
        </div>

        <button
          onClick={parseData}
          className="w-full h-9 rounded-xl text-sm font-medium"
          style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
        >
          Compute
        </button>

        {/* Sample datasets */}
        <div>
          <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
            Sample datasets:
          </p>
          <div className="space-y-1.5">
            <button
              onClick={() => {
                const d = "68, 72, 75, 78, 80, 82, 85, 88, 90, 92, 95, 98, 70, 73, 77, 83, 86, 91, 94, 79"
                setRawInput(d)
              }}
              className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg"
              style={{
                background: "var(--muted)",
                color: "var(--foreground)",
                border: "1px solid var(--glass-border)",
              }}
            >
              📊 Test scores (n=20)
            </button>
            <button
              onClick={() => {
                const d = Array.from({ length: 50 }, () => Math.round(Math.random() * 100)).join(", ")
                setRawInput(d)
              }}
              className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg"
              style={{
                background: "var(--muted)",
                color: "var(--foreground)",
                border: "1px solid var(--glass-border)",
              }}
            >
              🎲 Random (n=50)
            </button>
            <button
              onClick={() => {
                // Normal-ish distribution
                const d = Array.from({ length: 100 }, () => {
                  const u1 = Math.random()
                  const u2 = Math.random()
                  return Math.round((Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)) * 15 + 50)
                }).join(", ")
                setRawInput(d)
              }}
              className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg"
              style={{
                background: "var(--muted)",
                color: "var(--foreground)",
                border: "1px solid var(--glass-border)",
              }}
            >
              📈 Normal distribution (n=100)
            </button>
          </div>
        </div>
      </div>
    ),
  }
}
