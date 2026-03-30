"use client"

import { useEffect, useRef, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
} from "chart.js"
import { Line } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

interface QuizTrendProps {
  history: { date: string; score: number; bankName: string }[]
  average: number
}

export function QuizTrend({ history, average }: QuizTrendProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [colors, setColors] = useState({ primary: "#0071E3", border: "#e5e7eb" })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const style = getComputedStyle(el)
    setColors({
      primary: style.getPropertyValue("--primary").trim() || "#0071E3",
      border: style.getPropertyValue("--glass-border").trim() || "#e5e7eb",
    })
  }, [])

  // Reverse so oldest is first
  const sorted = [...history].reverse()

  const chartData = {
    labels: sorted.map((d) => {
      const date = new Date(d.date + "T00:00:00")
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }),
    datasets: [
      {
        label: "Score",
        data: sorted.map((d) => d.score),
        borderColor: colors.primary,
        backgroundColor: colors.primary,
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.3,
      },
      {
        label: "Average",
        data: sorted.map(() => average),
        borderColor: `${colors.primary}40`,
        borderWidth: 1.5,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          title: (items: { dataIndex: number }[]) => sorted[items[0].dataIndex]?.bankName ?? "",
          label: (item: { raw: unknown; dataIndex: number }) => {
            return ` ${sorted[item.dataIndex]?.score}%`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: "var(--muted-foreground)", font: { size: 11 } },
        border: { color: colors.border },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: `${colors.border}60` },
        ticks: {
          color: "var(--muted-foreground)",
          font: { size: 11 },
          callback: (v: string | number) => `${v}%`,
        },
        border: { display: false },
      },
    },
  } as const

  if (sorted.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quiz Performance</h2>
        <p className="text-sm text-muted-foreground py-8 text-center">
          Complete quizzes to see your score trend
        </p>
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Quiz Performance</h2>
        <span className="text-sm font-medium" style={{ color: colors.primary }}>
          Avg: {average}%
        </span>
      </div>
      <div className="h-48">
        <Line data={chartData} options={options} />
      </div>
    </div>
  )
}
