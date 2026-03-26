"use client"

import { Calculator } from "lucide-react"
import { cn } from "@/lib/utils"

interface DesmosToggleButtonProps {
  isOpen: boolean
  onClick: () => void
}

const MATH_SUBJECTS = ["Geometry", "Physics", "Calculus", "Number Theory"]

/**
 * Floating action button to toggle the Desmos graphing calculator panel.
 * Only renders when the study guide subject is math/physics related.
 */
export function DesmosToggleButton({ isOpen, onClick }: DesmosToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-40 flex items-center justify-center",
        "w-12 h-12 rounded-full shadow-lg",
        "transition-all duration-300 hover:scale-105 active:scale-95",
        "bottom-6",
        isOpen ? "right-[436px] md:right-[436px]" : "right-6",
        // On mobile, always stay at right-6 since panel is full-screen overlay
        "max-md:!right-6",
      )}
      style={{
        background: isOpen
          ? "linear-gradient(135deg, #10b981, #059669)"
          : "linear-gradient(135deg, #1D4ED8, #60A5FA)",
        boxShadow: isOpen
          ? "0 4px 20px rgba(16, 185, 129, 0.4)"
          : "0 4px 20px rgba(29, 78, 216, 0.4)",
      }}
      title={isOpen ? "Close Calculator" : "Open Graphing Calculator"}
      aria-label={isOpen ? "Close graphing calculator" : "Open graphing calculator"}
    >
      <Calculator className="h-5 w-5 text-white" />
      {/* Active indicator ring */}
      {isOpen && (
        <span
          className="absolute inset-0 rounded-full animate-ping"
          style={{
            border: "2px solid rgba(16, 185, 129, 0.4)",
            animationDuration: "2s",
          }}
        />
      )}
    </button>
  )
}

/** Helper to check if a subject should show the Desmos calculator */
export function shouldShowDesmos(subject: string): boolean {
  return MATH_SUBJECTS.some(
    (s) => subject.toLowerCase().includes(s.toLowerCase())
  )
}
