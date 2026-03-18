"use client"

import { COLORS, HIGHLIGHTER_COLORS, STROKE_SIZES } from "@/lib/whiteboard/types"
import type { StrokeStyle } from "@/lib/whiteboard/types"

interface ColorPickerProps {
  style: StrokeStyle
  setStyle: (style: StrokeStyle) => void
  isHighlighter?: boolean
}

export function ColorPicker({ style, setStyle, isHighlighter }: ColorPickerProps) {
  const colors = isHighlighter ? HIGHLIGHTER_COLORS : COLORS

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-lg shadow-black/5 dark:shadow-black/30">
      {/* Color swatches */}
      <div className="flex items-center gap-1.5">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => setStyle({ ...style, color })}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
              style.color === color
                ? "border-blue-500 scale-110 ring-2 ring-blue-200 dark:ring-blue-500/30"
                : "border-zinc-200 dark:border-zinc-600"
            }`}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />

      {/* Size selector */}
      <div className="flex items-center gap-1.5">
        {STROKE_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => setStyle({ ...style, size })}
            className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all ${
              style.size === size
                ? "bg-blue-50 dark:bg-blue-500/15 ring-1 ring-blue-200 dark:ring-blue-500/30"
                : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
            title={`Size ${size}`}
          >
            <div
              className="rounded-full bg-zinc-800 dark:bg-zinc-200"
              style={{
                width: Math.min(size + 2, 16),
                height: Math.min(size + 2, 16),
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
