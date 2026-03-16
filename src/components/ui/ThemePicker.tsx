"use client"

import { THEMES, getThemeIds, type ThemeId } from "@/lib/theme"
import { useColorTheme } from "@/context/ThemeContext"
import { useTheme } from "@/components/theme-provider"
import { Check } from "lucide-react"

export function ThemePicker() {
  const { colorTheme, setColorTheme } = useColorTheme()
  const { resolvedTheme } = useTheme()
  const themeIds = getThemeIds()

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {themeIds.map((id) => {
        const t = THEMES[id]
        const variant = resolvedTheme === 'dark' ? t.dark : t.light
        const isActive = id === colorTheme

        return (
          <button
            key={id}
            onClick={() => setColorTheme(id)}
            title={t.label}
            className="group relative flex flex-col items-center gap-1 rounded-lg p-1.5 transition-all hover:bg-[var(--glass-fill)]"
            style={{
              outline: isActive ? `2px solid ${variant['--accent-color']}` : '2px solid transparent',
              outlineOffset: '1px',
            }}
          >
            {/* 3-color swatch strip */}
            <div className="flex w-full h-5 rounded-md overflow-hidden border border-[var(--glass-border)]">
              <div className="flex-1" style={{ background: variant['--bg-base'] }} />
              <div className="flex-1" style={{ background: variant['--accent-color'] }} />
              <div className="flex-1" style={{ background: variant['--text-primary'] }} />
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
                style={{ background: variant['--accent-color'] }}
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
