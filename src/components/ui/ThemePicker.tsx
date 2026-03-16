"use client"

import { THEMES, type ThemeId } from "@/lib/theme"
import { useColorTheme } from "@/context/ThemeContext"
import { Check } from "lucide-react"

const themeIds = Object.keys(THEMES) as ThemeId[]

export function ThemePicker() {
  const { colorTheme, setColorTheme } = useColorTheme()

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {themeIds.map((id) => {
        const t = THEMES[id]
        const isActive = id === colorTheme

        return (
          <button
            key={id}
            onClick={() => setColorTheme(id)}
            title={t.label}
            className="group relative flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all hover:bg-[var(--glass-fill)]"
            style={{
              outline: isActive ? `2px solid ${t['--accent']}` : '2px solid transparent',
              outlineOffset: '1px',
            }}
          >
            {/* 3-color swatch strip */}
            <div className="flex w-full h-5 rounded-md overflow-hidden border border-[var(--glass-border)]">
              <div className="flex-1" style={{ background: t['--bg-base'] }} />
              <div className="flex-1" style={{ background: t['--accent'] }} />
              <div className="flex-1" style={{ background: t['--text-primary'] }} />
            </div>

            {/* Label */}
            <span
              className="text-[9px] leading-tight text-center font-medium truncate w-full"
              style={{ color: 'var(--muted-foreground)' }}
            >
              {t.label}
            </span>

            {/* Active checkmark */}
            {isActive && (
              <div
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center"
                style={{ background: t['--accent'] }}
              >
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
