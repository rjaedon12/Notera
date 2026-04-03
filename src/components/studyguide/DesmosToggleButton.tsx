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
 * Positioned on the right side for easy access during quizzes.
 */
export function DesmosToggleButton({ isOpen, onClick }: DesmosToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-40 flex items-center gap-2 justify-center",
        "px-4 py-2.5 rounded-l-xl shadow-lg",
        "transition-all duration-300 hover:scale-105 active:scale-95",
        // Position on the right edge, vertically centered
        "top-1/2 -translate-y-1/2 right-0",
        isOpen && "translate-x-[420px] md:translate-x-[420px]",
        // On mobile, stay visible
        "max-md:!translate-x-0",
      )}
      style={{
        background: isOpen
          ? "linear-gradient(135deg, #10b981, #059669)"
          : "linear-gradient(135deg, #1D4ED8, #60A5FA)",
        boxShadow: isOpen
          ? "-4px 0 20px rgba(16, 185, 129, 0.4)"
          : "-4px 0 20px rgba(29, 78, 216, 0.4)",
      }}
      title={isOpen ? "Close Calculator" : "Open Graphing Calculator"}
      aria-label={isOpen ? "Close graphing calculator" : "Open graphing calculator"}
    >
      <Calculator className="h-5 w-5 text-white" />
      <span className="text-white text-sm font-medium hidden sm:inline">
        {isOpen ? "Close" : "Calculator"}
      </span>
    </button>
  )
}

/** Helper to check if a subject should show the Desmos calculator */
export function shouldShowDesmos(subject: string): boolean {
  return MATH_SUBJECTS.some(
    (s) => subject.toLowerCase().includes(s.toLowerCase())
  )
}
