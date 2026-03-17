"use client"

import { cn } from "@/lib/utils"
import type { GuideLesson, LessonProgress } from "@/types/studyguide"
import { CheckCircle2, Circle, ChevronRight } from "lucide-react"

interface LessonNavProps {
  lessons: GuideLesson[]
  activeLessonId: string
  lessonProgress: Record<string, LessonProgress>
  problemCounts: Record<string, { total: number; correct: number }>
  onSelect: (lessonId: string) => void
}

export function LessonNav({
  lessons,
  activeLessonId,
  lessonProgress,
  problemCounts,
  onSelect,
}: LessonNavProps) {
  return (
    <nav className="space-y-1">
      {lessons.map((lesson) => {
        const isActive = lesson.id === activeLessonId
        const progress = lessonProgress[lesson.id]
        const pCount = problemCounts[lesson.id]
        const allCorrect = pCount && pCount.total > 0 && pCount.correct === pCount.total
        const isComplete = progress?.isComplete || allCorrect

        return (
          <button
            key={lesson.id}
            onClick={() => onSelect(lesson.id)}
            className={cn(
              "relative flex items-start gap-3 w-full text-left rounded-xl px-3 py-2.5 transition-all text-sm",
              isActive
                ? "font-medium"
                : "hover:bg-[var(--glass-fill)]"
            )}
            style={isActive ? {
              background: "rgba(255,255,255,0.10)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12), 0 1px 3px rgba(0,0,0,0.10)",
            } : {}}
          >
            {isActive && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                style={{ background: "var(--accent-color)" }}
              />
            )}
            {/* Completion indicator */}
            {isComplete ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#10b981" }} />
            ) : (
              <Circle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            )}
            <div className="flex-1 min-w-0">
              <span
                className="text-xs font-semibold block"
                style={{ color: isActive ? "var(--accent-color)" : "var(--muted-foreground)" }}
              >
                {lesson.title}
              </span>
              <span
                className="text-[13px] block mt-0.5 truncate"
                style={{ color: "var(--foreground)" }}
              >
                {lesson.subtitle}
              </span>
              {pCount && pCount.total > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div
                    className="h-1 flex-1 rounded-full overflow-hidden"
                    style={{ background: "var(--muted)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(pCount.correct / pCount.total) * 100}%`,
                        background: pCount.correct === pCount.total ? "#10b981" : "var(--accent-color)",
                      }}
                    />
                  </div>
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--muted-foreground)" }}>
                    {pCount.correct}/{pCount.total}
                  </span>
                </div>
              )}
            </div>
            {isActive && (
              <ChevronRight className="h-3.5 w-3.5 mt-1 shrink-0" style={{ color: "var(--accent-color)" }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
