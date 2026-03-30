"use client"

import { useEffect, useRef, useState } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js"
import { Bar } from "react-chartjs-2"

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface ReviewForecastProps {
  forecast: { date: string; count: number }[]
}

export function ReviewForecast({ forecast }: ReviewForecastProps) {
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

  const total = forecast.reduce((s, d) => s + d.count, 0)

  const chartData = {
    labels: forecast.map((d, i) => {
      if (i === 0) return "Today"
      const date = new Date(d.date + "T00:00:00")
      return date.toLocaleDateString("en-US", { weekday: "short" })
    }),
    datasets: [
      {
        data: forecast.map((d) => d.count),
        backgroundColor: `${colors.primary}60`,
        hoverBackgroundColor: colors.primary,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (item: { raw: unknown }) => ` ${item.raw} cards due`,
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
        beginAtZero: true,
        grid: { color: `${colors.border}60` },
        ticks: {
          color: "var(--muted-foreground)",
          font: { size: 11 },
          stepSize: 1,
        },
        border: { display: false },
      },
    },
  } as const

  return (
    <div ref={containerRef}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Review Forecast</h2>
        <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          {total} cards in the next 7 days
        </span>
      </div>
      <div className="h-40">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
