"use client"

import { Card } from "@/components/ui/card"
import { ChevronDown, Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { LatexRenderer } from "./LatexRenderer"

interface WorkedExampleProps {
  title: string
  content: string
  steps: string[]
}

export function WorkedExample({ title, content, steps }: WorkedExampleProps) {
  const [revealedSteps, setRevealedSteps] = useState(0)
  const [showAll, setShowAll] = useState(false)

  const visibleSteps = showAll ? steps.length : revealedSteps

  const revealNext = () => {
    if (revealedSteps < steps.length) {
      setRevealedSteps((v) => v + 1)
    }
  }

  const toggleAll = () => {
    if (showAll) {
      setShowAll(false)
      setRevealedSteps(0)
    } else {
      setShowAll(true)
      setRevealedSteps(steps.length)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div style={{ borderLeft: "4px solid #f59e0b" }} className="px-1">
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-md flex items-center justify-center text-[10px] font-bold"
              style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}
            >
              Ex
            </div>
            <h3 className="text-base font-semibold font-heading">{title}</h3>
          </div>

          {/* Problem statement */}
          <div className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            <LatexRenderer content={content} />
          </div>

          {/* Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                Solution Steps
              </span>
              <button
                onClick={toggleAll}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-colors hover:bg-[var(--glass-fill)]"
                style={{ color: "var(--accent-color)" }}
              >
                {showAll ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showAll ? "Hide all" : "Show all"}
              </button>
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {steps.slice(0, visibleSteps).map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div
                      className="flex gap-3 rounded-xl p-3 text-sm"
                      style={{
                        background: "var(--muted)",
                      }}
                    >
                      <span
                        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "rgba(245, 158, 11, 0.15)",
                          color: "#f59e0b",
                        }}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 pt-0.5">
                        <LatexRenderer content={step} />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Reveal next step button */}
            {!showAll && revealedSteps < steps.length && (
              <button
                onClick={revealNext}
                className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all w-full justify-center"
                style={{
                  background: "rgba(245, 158, 11, 0.08)",
                  color: "#f59e0b",
                  border: "1px solid rgba(245, 158, 11, 0.2)",
                }}
              >
                <ChevronDown className="h-4 w-4" />
                Show step {revealedSteps + 1} of {steps.length}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
