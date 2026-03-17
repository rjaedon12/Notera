"use client"

import { Card } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import { LatexRenderer } from "./LatexRenderer"

interface DefinitionCardProps {
  title: string
  content: string
}

export function DefinitionCard({ title, content }: DefinitionCardProps) {
  return (
    <Card className="overflow-hidden">
      <div
        className="px-1 py-0"
        style={{ borderLeft: "4px solid var(--primary)" }}
      >
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 shrink-0" style={{ color: "var(--primary)" }} />
            <span
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--primary)" }}
            >
              Definition
            </span>
          </div>
          <h3 className="text-base font-semibold font-heading">{title}</h3>
          <div className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
            <LatexRenderer content={content} />
          </div>
        </div>
      </div>
    </Card>
  )
}
