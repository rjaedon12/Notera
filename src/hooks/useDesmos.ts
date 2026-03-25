"use client"

import { useEffect, useRef, useState, useCallback } from "react"

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (
        el: HTMLElement,
        options?: Record<string, unknown>
      ) => DesmosCalculator
    }
  }
}

interface DesmosCalculator {
  destroy: () => void
  resize: () => void
  setExpression: (expr: { id: string; latex: string; color?: string }) => void
  removeExpression: (expr: { id: string }) => void
  getExpressions: () => { id: string; latex: string }[]
  setBlank: () => void
}

interface UseDesmosOptions {
  expressions?: boolean
  keypad?: boolean
  settingsMenu?: boolean
  zoomButtons?: boolean
  expressionsTopbar?: boolean
  border?: boolean
}

const DESMOS_SCRIPT_ID = "desmos-api-script"

function loadDesmosScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Desmos) {
      resolve()
      return
    }

    const existing = document.getElementById(DESMOS_SCRIPT_ID)
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () => reject(new Error("Failed to load Desmos API")))
      return
    }

    const apiKey = process.env.NEXT_PUBLIC_DESMOS_API_KEY
    if (!apiKey) {
      reject(new Error("NEXT_PUBLIC_DESMOS_API_KEY is not set"))
      return
    }

    const script = document.createElement("script")
    script.id = DESMOS_SCRIPT_ID
    script.src = `https://www.desmos.com/api/v1.10/calculator.js?apiKey=${apiKey}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Desmos API"))
    document.head.appendChild(script)
  })
}

export function useDesmos(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseDesmosOptions = {}
) {
  const calculatorRef = useRef<DesmosCalculator | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    expressions = true,
    keypad = true,
    settingsMenu = false,
    zoomButtons = true,
    expressionsTopbar = true,
    border = false,
  } = options

  useEffect(() => {
    let cancelled = false

    async function init() {
      try {
        await loadDesmosScript()
        if (cancelled || !containerRef.current || !window.Desmos) return

        // Destroy previous instance if it exists
        if (calculatorRef.current) {
          calculatorRef.current.destroy()
        }

        const calc = window.Desmos.GraphingCalculator(containerRef.current, {
          expressions,
          keypad,
          settingsMenu,
          zoomButtons,
          expressionsTopbar,
          border,
          fontSize: 14,
        })

        calculatorRef.current = calc
        if (!cancelled) setIsLoaded(true)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to initialize Desmos")
        }
      }
    }

    init()

    return () => {
      cancelled = true
      if (calculatorRef.current) {
        calculatorRef.current.destroy()
        calculatorRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef])

  const resize = useCallback(() => {
    calculatorRef.current?.resize()
  }, [])

  const setExpression = useCallback(
    (id: string, latex: string, color?: string) => {
      calculatorRef.current?.setExpression({ id, latex, color })
    },
    []
  )

  const clearAll = useCallback(() => {
    calculatorRef.current?.setBlank()
  }, [])

  return {
    calculator: calculatorRef,
    isLoaded,
    error,
    resize,
    setExpression,
    clearAll,
  }
}
