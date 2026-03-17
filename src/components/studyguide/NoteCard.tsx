"use client"

import { Card } from "@/components/ui/card"
import { LatexRenderer } from "./LatexRenderer"
import { Info } from "lucide-react"

interface NoteCardProps {
  title?: string
  content: string
}

export function NoteCard({ title, content }: NoteCardProps) {
  return (
    <Card>
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0" style={{ color: "var(--accent-color)" }} />
          {title && (
            <h3 className="text-sm font-semibold font-heading" style={{ color: "var(--accent-color)" }}>
              {title}
            </h3>
          )}
        </div>
        <div className="text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
          <LatexRenderer content={content} />
        </div>
      </div>
    </Card>
  )
}
