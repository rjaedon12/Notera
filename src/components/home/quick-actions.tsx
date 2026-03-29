"use client"

import Link from "next/link"
import { BookOpen, PenLine, Compass, Brain, PenTool } from "lucide-react"

const ACTIONS = [
  { label: "Daily Review", href: "/daily-review", icon: Brain },
  { label: "Create Set", href: "/create", icon: PenLine },
  { label: "Browse Subjects", href: "/discover", icon: Compass },
  { label: "Take a Quiz", href: "/quizzes", icon: BookOpen },
  { label: "Whiteboard", href: "/whiteboard", icon: PenTool },
] as const

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2 justify-center py-4 animate-fade-in">
      {ACTIONS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all
            hover:scale-[1.03] active:scale-[0.97]"
          style={{
            background: "var(--glass-fill)",
            border: "1px solid var(--glass-border)",
            color: "var(--foreground)",
          }}
        >
          <Icon className="h-4 w-4" style={{ color: "var(--primary)" }} />
          {label}
        </Link>
      ))}
    </div>
  )
}
