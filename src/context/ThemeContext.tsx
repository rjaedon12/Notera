"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { applyTheme, getSavedTheme, type ThemeId } from "@/lib/theme"

interface ColorThemeContextType {
  colorTheme: ThemeId
  setColorTheme: (id: ThemeId) => void
}

const ColorThemeContext = createContext<ColorThemeContextType | undefined>(undefined)

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] = useState<ThemeId>("midnight-indigo")

  // Read persisted theme on mount (the inline head script already applied the CSS vars,
  // so this just syncs React state).
  useEffect(() => {
    setColorThemeState(getSavedTheme())
  }, [])

  const setColorTheme = useCallback((id: ThemeId) => {
    applyTheme(id)
    setColorThemeState(id)
  }, [])

  return (
    <ColorThemeContext.Provider value={{ colorTheme, setColorTheme }}>
      {children}
    </ColorThemeContext.Provider>
  )
}

export function useColorTheme(): ColorThemeContextType {
  const ctx = useContext(ColorThemeContext)
  if (!ctx) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider")
  }
  return ctx
}
