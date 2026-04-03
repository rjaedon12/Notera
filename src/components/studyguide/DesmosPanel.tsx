"use client"

import { useRef, useEffect } from "react"
import { X, LineChart, Loader2, AlertCircle } from "lucide-react"
import { useDesmos } from "@/hooks/useDesmos"

interface DesmosPanelProps {
  isOpen: boolean
  onClose: () => void
  /** When true, renders as a flex column filling its parent instead of a fixed overlay */
  inline?: boolean
}

export function DesmosPanel({ isOpen, onClose, inline = false }: DesmosPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isLoaded, error, resize } = useDesmos(
    containerRef,
    {
      enabled: isOpen,
      expressions: true,
      keypad: true,
      settingsMenu: false,
      zoomButtons: true,
      expressionsTopbar: true,
      border: false,
    }
  )

  // Resize calculator when panel opens
  useEffect(() => {
    if (isOpen && isLoaded) {
      const timer = setTimeout(() => resize(), 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isLoaded, resize])

  // Handle window resize
  useEffect(() => {
    if (!isOpen || !isLoaded) return
    const handler = () => resize()
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [isOpen, isLoaded, resize])

  // Inline mode: ResizeObserver to handle smooth panel width transitions
  useEffect(() => {
    if (!inline || !isLoaded || !containerRef.current) return
    const el = containerRef.current
    const observer = new ResizeObserver(() => resize())
    observer.observe(el)
    return () => observer.disconnect()
  }, [inline, isLoaded, resize])

  // Overlay mode: return null when not open
  if (!inline && !isOpen) return null

  const panelContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E8E8ED] shrink-0">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4" style={{ color: "#0071E3" }} />
          <h3 className={inline ? "text-sm font-medium text-[#1D1D1F]" : "text-sm font-semibold font-heading"}>
            Graphing Calculator
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--glass-fill)] transition-colors"
          aria-label="Close calculator"
        >
          <X className="h-4 w-4" style={{ color: "#0071E3" }} />
        </button>
      </div>

      {/* Calculator container */}
      <div className="flex-1 relative min-h-0">
        {/* Loading state */}
        {isOpen && !isLoaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
            style={{ background: "var(--popover)" }}
          >
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#0071E3" }} />
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Loading calculator\u2026
            </p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 px-6"
            style={{ background: "var(--popover)" }}
          >
            <AlertCircle className="h-6 w-6 text-red-400" />
            <p className="text-xs text-center text-red-400 max-w-xs">{error}</p>
            {error.includes("API key") && (
              <a
                href="https://www.desmos.com/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs underline hover:no-underline"
                style={{ color: "#0071E3" }}
              >
                Get a free Desmos API key
              </a>
            )}
          </div>
        )}

        {/* Desmos mounts here */}
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{ minHeight: "300px" }}
        />
      </div>
    </>
  )

  // Inline panel mode: fills parent container
  if (inline) {
    return (
      <div className="flex flex-col h-full w-full" style={{ background: "var(--popover)" }}>
        {panelContent}
      </div>
    )
  }

  // Overlay mode (original behavior)
  return (
    <div
      className="fixed z-50 flex flex-col border border-[#E8E8ED] shadow-lg overflow-hidden"
      style={{
        bottom: "1.5rem",
        right: "1.5rem",
        width: "360px",
        height: "420px",
        borderRadius: "12px",
        background: "var(--popover)",
      }}
    >
      {panelContent}
    </div>
  )
}
