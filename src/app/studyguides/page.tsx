"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Circle, ArrowRight, Sparkles, Target, CheckCircle2 } from "lucide-react"
import { studyGuides } from "@/data/studyguides/chapter10-circles"
import { useGuideProgress } from "@/hooks/useStudyGuide"
import { GuideProgressBar } from "@/components/studyguide/GuideProgressBar"

export default function StudyGuidesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 font-heading">
          <BookOpen className="h-8 w-8" style={{ color: "var(--primary)" }} />
          Study Guides
        </h1>
        <p className="mt-2 text-sm" style={{ color: "var(--muted-foreground)" }}>
          Interactive, theorem-based lessons with diagrams, worked examples, and practice problems.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Sparkles, label: "Step-by-step examples", desc: "Reveal solutions one step at a time" },
          { icon: Target, label: "Practice problems", desc: "Check answers with instant feedback" },
          { icon: CheckCircle2, label: "Progress tracking", desc: "All progress saved locally" },
        ].map((f) => (
          <div
            key={f.label}
            className="flex items-start gap-3 rounded-xl p-4"
            style={{ background: "var(--muted)" }}
          >
            <f.icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "var(--accent-color)" }} />
            <div>
              <span className="text-sm font-semibold block">{f.label}</span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{f.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Guide cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
        {studyGuides.map((guide) => (
          <GuideCard key={guide.id} guideId={guide.id} />
        ))}
      </div>

      {/* Empty state teaser */}
      {studyGuides.length <= 1 && (
        <div
          className="text-center py-12 rounded-2xl"
          style={{ background: "var(--muted)", border: "1px dashed var(--glass-border)" }}
        >
          <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" style={{ color: "var(--muted-foreground)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
            More study guides coming soon
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)", opacity: 0.7 }}>
            Check back for new subjects and chapters.
          </p>
        </div>
      )}
    </div>
  )
}

function GuideCard({ guideId }: { guideId: string }) {
  const guide = studyGuides.find((g) => g.id === guideId)!
  const { getStats } = useGuideProgress(guideId)
  const stats = getStats()

  const totalProblems = guide.lessons.reduce(
    (acc, l) => acc + l.sections.filter((s) => s.type === "practice").length,
    0
  )

  return (
    <Link href={`/studyguides/${guide.id}`}>
      <Card className="h-full cursor-pointer group">
        <CardContent className="p-6 space-y-4">
          {/* Top row */}
          <div className="flex items-start gap-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "color-mix(in srgb, var(--accent-color) 12%, transparent)" }}
            >
              <Circle className="h-5 w-5" style={{ color: "var(--accent-color)" }} />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--accent-color)" }}>
                {guide.subject}
              </span>
              <h3 className="text-lg font-semibold font-heading leading-snug mt-0.5">
                {guide.title}
              </h3>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm line-clamp-2" style={{ color: "var(--muted-foreground)" }}>
            {guide.description}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
            <span>{guide.lessons.length} lessons</span>
            <span>·</span>
            <span>{totalProblems} problems</span>
            {stats.total > 0 && (
              <>
                <span>·</span>
                <span style={{ color: "#10b981" }}>{stats.correct}/{stats.total} correct</span>
              </>
            )}
          </div>

          {/* Progress bar if started */}
          {stats.total > 0 && (
            <GuideProgressBar correct={stats.correct} total={totalProblems} size="sm" />
          )}

          {/* Lessons list */}
          <div className="space-y-1.5 pt-1">
            {guide.lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="flex items-center gap-2 text-xs py-1"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: "var(--accent-color)", opacity: 0.5 }}
                />
                <span style={{ color: "var(--foreground)" }}>
                  {lesson.title}: {lesson.subtitle}
                </span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2 text-sm font-medium pt-1" style={{ color: "var(--accent-color)" }}>
            {stats.total > 0 ? "Continue studying" : "Start studying"}
            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
