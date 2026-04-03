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
  if (isOpen) return null

  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-40 flex items-center gap-2 justify-center",
        "px-4 py-2.5 rounded-xl shadow-lg",
        "transition-all duration-200 hover:scale-105 active:scale-95",
        "bottom-6 right-6",
      )}
      style={{
        background: "linear-gradient(135deg, #1D4ED8, #60A5FA)",
        boxShadow: "-4px 0 20px rgba(29, 78, 216, 0.4)",
      }}
      title="Open Graphing Calculator"
      aria-label="Open graphing calculator"
    >
      <Calculator className="h-5 w-5 text-white" />
      <span className="text-white text-sm font-medium hidden sm:inline">
        Calculator
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
