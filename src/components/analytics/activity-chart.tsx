"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

interface ActivityChartProps {
  data: { date: string; count: number; minutesPracticed: number }[]
}

export function ActivityChart({ data }: ActivityChartProps) {
  const [range, setRange] = useState<7 | 30>(30)
  const containerRef = useRef<HTMLDivElement>(null)
  const [colors, setColors] = useState({
    primary: "#0071E3",
    border: "#e5e7eb",
    mutedFg: "#6b7280",
  })

  const resolveColors = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const style = getComputedStyle(el)
    setColors({
      primary: style.getPropertyValue("--primary").trim() || "#0071E3",
      border: style.getPropertyValue("--glass-border").trim() || "#e5e7eb",
      mutedFg: style.getPropertyValue("--muted-foreground").trim() || "#6b7280",
    })
  }, [])

  useEffect(() => {
    resolveColors()
    const observer = new MutationObserver(resolveColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] })
    return () => observer.disconnect()
  }, [resolveColors])

  const sliced = data.slice(-range)

  const chartData = {
    labels: sliced.map((d) => {
      const date = new Date(d.date + "T00:00:00")
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }),
    datasets: [
      {
        data: sliced.map((d) => d.minutesPracticed),
        fill: true,
        backgroundColor: `${colors.primary}18`,
        borderColor: colors.primary,
        borderWidth: 2,
        pointBackgroundColor: colors.primary,
        pointRadius: range === 7 ? 4 : 2,
        pointHoverRadius: 6,
        tension: 0.35,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        backgroundColor: colors.primary,
        titleColor: "#fff",
        bodyColor: "#fff",
        cornerRadius: 8,
        padding: 10,
        callbacks: {
          title: (items: { dataIndex: number }[]) => sliced[items[0].dataIndex]?.date ?? "",
          label: (item: { raw: unknown; dataIndex: number }) => {
            const d = sliced[item.dataIndex]
            return `${d.minutesPracticed} min · ${d.count} session${d.count !== 1 ? "s" : ""}`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxTicksLimit: range === 7 ? 7 : 8,
          color: colors.mutedFg,
          font: { size: 11 },
        },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: `${colors.border}40`, drawBorder: false },
        ticks: {
          color: colors.mutedFg,
          font: { size: 11 },
          callback: (v: string | number) => `${v}m`,
        },
        border: { display: false },
      },
    },
  } as const

  return (
    <div ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Study Activity</h2>
        <div className="flex gap-1 rounded-lg p-0.5" style={{ background: "var(--muted)" }}>
          {([7, 30] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-3 py-1 text-xs font-medium rounded-md transition-all"
              style={{
                background: range === r ? "var(--glass-fill)" : "transparent",
                color: range === r ? "var(--foreground)" : "var(--muted-foreground)",
                boxShadow: range === r ? "var(--glass-shadow)" : "none",
              }}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>
      <div className="h-52">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
