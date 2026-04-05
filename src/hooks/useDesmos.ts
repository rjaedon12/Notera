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
  updateSettings?: (options: Record<string, unknown>) => void
  setExpression: (expr: { id: string; latex: string; color?: string }) => void
  removeExpression: (expr: { id: string }) => void
  getExpressions: () => { id: string; latex: string }[]
  setBlank: () => void
}

interface UseDesmosOptions {
  /** Set to false to defer initialization until the container is visible */
  enabled?: boolean
  expressions?: boolean
  keypad?: boolean
  settingsMenu?: boolean
  zoomButtons?: boolean
  expressionsTopbar?: boolean
  border?: boolean
}

const DESMOS_SCRIPT_ID = "desmos-api-script"
let desmosScriptPromise: Promise<void> | null = null

function readIsDarkTheme(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false
  }

  const root = document.documentElement
  if (root.classList.contains("dark")) {
    return true
  }
  if (root.classList.contains("light")) {
    return false
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function loadDesmosScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Desmos can only load in the browser"))
  }

  if (window.Desmos) {
    return Promise.resolve()
  }

  const apiKey = process.env.NEXT_PUBLIC_DESMOS_API_KEY?.trim()
  if (!apiKey) {
    return Promise.reject(
      new Error(
        "Desmos API key not configured. Add NEXT_PUBLIC_DESMOS_API_KEY to your environment variables. Get a free key at desmos.com/api"
      )
    )
  }

  if (desmosScriptPromise) {
    return desmosScriptPromise
  }

  desmosScriptPromise = new Promise((resolve, reject) => {
    let script = document.getElementById(DESMOS_SCRIPT_ID) as HTMLScriptElement | null

    if (script?.dataset.desmosStatus === "error") {
      script.remove()
      script = null
    }

    if (script?.dataset.desmosStatus === "ready" && window.Desmos) {
      resolve()
      return
    }

    if (!script) {
      script = document.createElement("script")
      script.id = DESMOS_SCRIPT_ID
      script.src = `https://www.desmos.com/api/v1.10/calculator.js?apiKey=${apiKey}`
      script.async = true
      script.dataset.desmosStatus = "loading"
      document.head.appendChild(script)
    }

    const cleanup = () => {
      script?.removeEventListener("load", handleLoad)
      script?.removeEventListener("error", handleError)
    }

    const handleLoad = () => {
      cleanup()

      if (window.Desmos) {
        if (script) {
          script.dataset.desmosStatus = "ready"
        }
        resolve()
        return
      }

      if (script) {
        script.dataset.desmosStatus = "error"
        script.remove()
      }
      desmosScriptPromise = null
      reject(new Error("Failed to initialize Desmos"))
    }

    const handleError = () => {
      cleanup()

      if (script) {
        script.dataset.desmosStatus = "error"
        script.remove()
      }
      desmosScriptPromise = null
      reject(new Error("Failed to load Desmos API"))
    }

    script.addEventListener("load", handleLoad, { once: true })
    script.addEventListener("error", handleError, { once: true })

    if (script.dataset.desmosStatus === "ready" && window.Desmos) {
      handleLoad()
    }
  })

  return desmosScriptPromise
}

export function useDesmos(
  containerRef: React.RefObject<HTMLDivElement | null>,
  options: UseDesmosOptions = {}
) {
  const calculatorRef = useRef<DesmosCalculator | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDarkTheme, setIsDarkTheme] = useState<boolean>(() => readIsDarkTheme())

  const {
    enabled = true,
    expressions = true,
    keypad = true,
    settingsMenu = false,
    zoomButtons = true,
    expressionsTopbar = true,
    border = false,
  } = options

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return
    }

    const syncTheme = () => {
      setIsDarkTheme(readIsDarkTheme())
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    })

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncTheme)
    } else {
      mediaQuery.addListener(syncTheme)
    }

    return () => {
      observer.disconnect()
      if (typeof mediaQuery.removeEventListener === "function") {
        mediaQuery.removeEventListener("change", syncTheme)
      } else {
        mediaQuery.removeListener(syncTheme)
      }
    }
  }, [])

  useEffect(() => {
    // Don't initialize until enabled (panel is visible)
    if (!enabled) {
      // Destroy any existing instance when disabled
      if (calculatorRef.current) {
        calculatorRef.current.destroy()
        calculatorRef.current = null
      }
      setIsLoaded(false)
      setError(null)
      return
    }

    let cancelled = false
    setError(null)
    setIsLoaded(false)

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
          invertedColors: isDarkTheme,
        })

        calculatorRef.current = calc
        if (!cancelled) {
          setError(null)
          setIsLoaded(true)
        }
      } catch (err) {
        if (!cancelled) {
          setIsLoaded(false)
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
  }, [border, enabled, expressions, expressionsTopbar, keypad, settingsMenu, zoomButtons])

  useEffect(() => {
    if (!enabled || !isLoaded) {
      return
    }

    calculatorRef.current?.updateSettings?.({ invertedColors: isDarkTheme })
    calculatorRef.current?.resize()
  }, [enabled, isDarkTheme, isLoaded])

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
