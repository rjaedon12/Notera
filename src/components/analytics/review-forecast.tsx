"use client"

import { useEffect, useRef, useState, useCallback } from "react"
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
  const [colors, setColors] = useState({
    primary: "#0071E3",
    border: "#e5e7eb",
    mutedFg: "#6b7280",
    bg: "#ffffff",
  })

  const resolveColors = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const style = getComputedStyle(el)
    setColors({
      primary: style.getPropertyValue("--primary").trim() || "#0071E3",
      border: style.getPropertyValue("--glass-border").trim() || "#e5e7eb",
      mutedFg: style.getPropertyValue("--muted-foreground").trim() || "#6b7280",
      bg: style.getPropertyValue("--glass-fill").trim() || "#ffffff",
    })
  }, [])

  useEffect(() => {
    resolveColors()
    // Re-resolve when theme changes
    const observer = new MutationObserver(resolveColors)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme", "style"] })
    return () => observer.disconnect()
  }, [resolveColors])

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
        backgroundColor: forecast.map((_, i) =>
          i === 0 ? colors.primary : `${colors.primary}50`
        ),
        hoverBackgroundColor: colors.primary,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 40,
        borderWidth: 0,
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
          label: (item: { raw: unknown }) => ` ${item.raw} cards due`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: colors.mutedFg, font: { size: 11 } },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: `${colors.border}40`, drawBorder: false },
        ticks: {
          color: colors.mutedFg,
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
      <div className="h-44">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  )
}
