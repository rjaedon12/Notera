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
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl shadow-lg"
      style={{
        background: "var(--popover)",
        border: "1px solid var(--glass-border)",
      }}
    >
      {/* Color swatches */}
      <div className="flex items-center gap-1.5">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => setStyle({ ...style, color })}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
              style.color === color
                ? "scale-110 ring-2"
                : ""
            }`}
            style={{
              backgroundColor: color,
              borderColor: style.color === color ? "var(--primary)" : "var(--glass-border)",
              ...(style.color === color ? { boxShadow: "0 0 0 2px color-mix(in srgb, var(--primary) 30%, transparent)" } : {}),
            }}
            title={color}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-6" style={{ background: "var(--glass-border)" }} />

      {/* Size selector */}
      <div className="flex items-center gap-1.5">
        {STROKE_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => setStyle({ ...style, size })}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-all"
            style={{
              background: style.size === size ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "transparent",
              ...(style.size === size ? { boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 30%, transparent)" } : {}),
            }}
            title={`Size ${size}`}
          >
            <div
              className="rounded-full"
              style={{
                width: Math.min(size + 2, 16),
                height: Math.min(size + 2, 16),
                background: "var(--foreground)",
              }}
            />
          </button>
        ))}
      </div>
    </div>
  )
}
