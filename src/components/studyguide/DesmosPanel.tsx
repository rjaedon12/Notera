"use client"

import { useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { X, LineChart, Loader2, AlertCircle } from "lucide-react"
import { useDesmos } from "@/hooks/useDesmos"

interface DesmosPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function DesmosPanel({ isOpen, onClose }: DesmosPanelProps) {
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
      // Small delay so the animation finishes
      const timer = setTimeout(() => resize(), 320)
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

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: isOpen ? 420 : 0, opacity: isOpen ? 1 : 0 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="shrink-0 border-l overflow-hidden hidden md:flex flex-col h-full"
      style={{
        borderColor: "var(--glass-border)",
        background: "var(--popover)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
          <h3 className="text-sm font-semibold font-heading">Graphing Calculator</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--glass-fill)] transition-colors"
          aria-label="Close calculator"
        >
          <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
        </button>
      </div>

      {/* Calculator container */}
      <div className="flex-1 relative min-h-0">
        {/* Loading state */}
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
            style={{ background: "var(--popover)" }}
          >
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent-color)" }} />
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              Loading calculator…
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
                style={{ color: "var(--accent-color)" }}
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
          style={{ minHeight: "400px" }}
        />
      </div>
    </motion.div>
  )
}

/**
 * Mobile-friendly full-screen overlay version of the Desmos panel
 */
export function DesmosMobileOverlay({ isOpen, onClose }: DesmosPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { isLoaded, error, resize } = useDesmos(containerRef, { enabled: isOpen })

  useEffect(() => {
    if (isOpen && isLoaded) {
      const timer = setTimeout(() => resize(), 320)
      return () => clearTimeout(timer)
    }
  }, [isOpen, isLoaded, resize])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-50 md:hidden flex flex-col"
      style={{ background: "var(--popover)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: "var(--glass-border)" }}
      >
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
          <h3 className="text-sm font-semibold font-heading">Graphing Calculator</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-[var(--glass-fill)] transition-colors"
          aria-label="Close calculator"
        >
          <X className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
        </button>
      </div>

      {/* Calculator */}
      <div className="flex-1 relative">
        {!isLoaded && !error && (
          <div className="absolute inset-0 flex items-center justify-center"
            style={{ background: "var(--popover)" }}>
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--accent-color)" }} />
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </motion.div>
  )
}
