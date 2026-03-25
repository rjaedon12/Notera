"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Highlighter,
  StickyNote,
  RotateCcw,
  Menu,
  X,
  Trophy,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getStudyGuideById } from "@/data/studyguides/chapter10-circles"
import { useGuideProgress, useGuideHighlights, useGuideNotes } from "@/hooks/useStudyGuide"
import { GuideSectionRenderer } from "@/components/studyguide/GuideSectionRenderer"
import { LessonNav } from "@/components/studyguide/LessonNav"
import { GuideProgressBar } from "@/components/studyguide/GuideProgressBar"
import { HighlightsPanel } from "@/components/studyguide/AnnotationTools"
import { DesmosPanel, DesmosMobileOverlay } from "@/components/studyguide/DesmosPanel"
import { DesmosToggleButton, shouldShowDesmos } from "@/components/studyguide/DesmosToggleButton"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"

type SidePanel = "none" | "highlights" | "stats"

export default function StudyGuideReaderPage() {
  const params = useParams()
  const router = useRouter()
  const guideId = params.guideId as string
  const guide = getStudyGuideById(guideId)

  const {
    progress,
    markSectionViewed,
    submitAnswer,
    getProblemProgress,
    getStats,
    resetProgress,
  } = useGuideProgress(guideId)

  const { highlights, addHighlight, removeHighlight } = useGuideHighlights(guideId)
  const { notes, addNote, updateNote, deleteNote } = useGuideNotes(guideId)

  const [activeLessonId, setActiveLessonId] = useState<string>(
    progress.lastAccessedLessonId ?? guide?.lessons[0]?.id ?? ""
  )
  const [sidePanel, setSidePanel] = useState<SidePanel>("none")
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [desmosOpen, setDesmosOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const activeLesson = guide?.lessons.find((l) => l.id === activeLessonId)
  const showDesmos = guide ? shouldShowDesmos(guide.subject) : false

  // Mark sections as viewed when scrolling
  useEffect(() => {
    if (activeLesson) {
      activeLesson.sections.forEach((s) => {
        markSectionViewed(activeLessonId, s.id)
      })
    }
  }, [activeLessonId, activeLesson, markSectionViewed])

  // Problem counts per lesson
  const problemCounts = useMemo(() => {
    if (!guide) return {}
    const counts: Record<string, { total: number; correct: number }> = {}
    for (const lesson of guide.lessons) {
      const problems = lesson.sections.filter((s) => s.type === "practice" && s.problem)
      const correct = problems.filter(
        (s) => s.problem && progress.problems[s.problem.id]?.isCorrect
      ).length
      counts[lesson.id] = { total: problems.length, correct }
    }
    return counts
  }, [guide, progress.problems])

  const totalProblems = useMemo(
    () => Object.values(problemCounts).reduce((a, c) => a + c.total, 0),
    [problemCounts]
  )
  const totalCorrect = useMemo(
    () => Object.values(problemCounts).reduce((a, c) => a + c.correct, 0),
    [problemCounts]
  )

  const handleLessonSelect = useCallback((lessonId: string) => {
    setActiveLessonId(lessonId)
    setMobileNavOpen(false)
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  // Navigate to next/prev lesson
  const lessonIndex = guide?.lessons.findIndex((l) => l.id === activeLessonId) ?? 0
  const hasPrev = lessonIndex > 0
  const hasNext = guide ? lessonIndex < guide.lessons.length - 1 : false
  const goPrev = () => guide && hasPrev && handleLessonSelect(guide.lessons[lessonIndex - 1].id)
  const goNext = () => guide && hasNext && handleLessonSelect(guide.lessons[lessonIndex + 1].id)

  if (!guide) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <BookOpen className="h-12 w-12 opacity-30" style={{ color: "var(--muted-foreground)" }} />
        <p className="text-lg font-medium">Study guide not found</p>
        <Link href="/studyguides">
          <Button variant="outline">Back to Study Guides</Button>
        </Link>
      </div>
    )
  }

  const stats = getStats()
  const allComplete = totalProblems > 0 && totalCorrect === totalProblems

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* ====== LEFT SIDEBAR — Lesson Navigation ====== */}
      <aside
        className={cn(
          "hidden lg:flex flex-col w-64 shrink-0 border-r overflow-y-auto",
        )}
        style={{
          borderColor: "var(--glass-border)",
          background: "var(--sidebar-bg)",
          backdropFilter: "saturate(180%) blur(48px)",
        }}
      >
        <div className="p-4 space-y-4">
          {/* Back link */}
          <Link
            href="/studyguides"
            className="flex items-center gap-2 text-xs font-medium hover:opacity-80 transition-opacity"
            style={{ color: "var(--muted-foreground)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Guides
          </Link>

          {/* Guide title */}
          <div>
            <h2 className="text-sm font-bold font-heading">{guide.title}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              {guide.subject}
            </p>
          </div>

          {/* Overall progress */}
          <GuideProgressBar correct={totalCorrect} total={totalProblems} label="Overall Progress" />

          {/* Lesson links */}
          <LessonNav
            lessons={guide.lessons}
            activeLessonId={activeLessonId}
            lessonProgress={progress.lessonProgress}
            problemCounts={problemCounts}
            onSelect={handleLessonSelect}
          />
        </div>
      </aside>

      {/* ====== MOBILE NAV OVERLAY ====== */}
      <AnimatePresence>
        {mobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, x: -280 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 lg:hidden flex"
          >
            <div
              className="w-72 h-full overflow-y-auto p-4 space-y-4"
              style={{
                background: "var(--popover)",
                borderRight: "1px solid var(--glass-border)",
                backdropFilter: "blur(40px)",
              }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold font-heading">{guide.title}</h2>
                <button onClick={() => setMobileNavOpen(false)}>
                  <X className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                </button>
              </div>
              <GuideProgressBar correct={totalCorrect} total={totalProblems} label="Progress" />
              <LessonNav
                lessons={guide.lessons}
                activeLessonId={activeLessonId}
                lessonProgress={progress.lessonProgress}
                problemCounts={problemCounts}
                onSelect={handleLessonSelect}
              />
            </div>
            <div className="flex-1 bg-black/30" onClick={() => setMobileNavOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ====== MAIN CONTENT ====== */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
          style={{ borderColor: "var(--glass-border)" }}
        >
          {/* Mobile hamburger */}
          <button
            className="lg:hidden p-1.5 rounded-lg hover:bg-[var(--glass-fill)]"
            onClick={() => setMobileNavOpen(true)}
          >
            <Menu className="h-5 w-5" style={{ color: "var(--foreground)" }} />
          </button>

          {/* Lesson title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold font-heading truncate">
              {activeLesson?.title}: {activeLesson?.subtitle}
            </h1>
          </div>

          {/* Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSidePanel((p) => (p === "highlights" ? "none" : "highlights"))}
              className={cn(
                "p-2 rounded-lg transition-colors",
                sidePanel === "highlights" ? "bg-[var(--glass-fill)]" : "hover:bg-[var(--glass-fill)]"
              )}
              title="Highlights"
            >
              <Highlighter className="h-4 w-4" style={{ color: sidePanel === "highlights" ? "var(--accent-color)" : "var(--muted-foreground)" }} />
            </button>
            <button
              onClick={() => setSidePanel((p) => (p === "stats" ? "none" : "stats"))}
              className={cn(
                "p-2 rounded-lg transition-colors",
                sidePanel === "stats" ? "bg-[var(--glass-fill)]" : "hover:bg-[var(--glass-fill)]"
              )}
              title="Statistics"
            >
              <BarChart3 className="h-4 w-4" style={{ color: sidePanel === "stats" ? "var(--accent-color)" : "var(--muted-foreground)" }} />
            </button>
          </div>
        </div>

        {/* Scrollable content + optional right panel */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Content */}
          <div ref={contentRef} className="flex-1 overflow-y-auto">
            <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
              {/* Completion banner */}
              {allComplete && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 rounded-2xl p-4"
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.2)",
                  }}
                >
                  <Trophy className="h-6 w-6" style={{ color: "#10b981" }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#10b981" }}>All problems completed!</p>
                    <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      You've answered all {totalProblems} practice problems correctly. Great work!
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Sections */}
              {activeLesson?.sections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div key={section.id}>
                    <GuideSectionRenderer
                      section={section}
                      problemProgress={section.problem ? getProblemProgress(section.problem.id) : null}
                      highlights={highlights.filter((h) => h.sectionId === section.id)}
                      notes={notes.filter((n) => n.sectionId === section.id)}
                      onSubmitAnswer={submitAnswer}
                      onHighlight={(text, color) => addHighlight(section.id, text, color)}
                      onRemoveHighlight={removeHighlight}
                      onAddNote={addNote}
                      onUpdateNote={updateNote}
                      onDeleteNote={deleteNote}
                    />
                  </div>
                ))}

              {/* Navigation footer */}
              <div className="flex items-center justify-between pt-4 pb-8">
                <button
                  onClick={goPrev}
                  disabled={!hasPrev}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all",
                    hasPrev ? "hover:bg-[var(--glass-fill)]" : "opacity-30 cursor-not-allowed"
                  )}
                  style={{ color: "var(--foreground)" }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-xs tabular-nums" style={{ color: "var(--muted-foreground)" }}>
                  {lessonIndex + 1} / {guide.lessons.length}
                </span>
                <button
                  onClick={goNext}
                  disabled={!hasNext}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all",
                    hasNext ? "hover:bg-[var(--glass-fill)]" : "opacity-30 cursor-not-allowed"
                  )}
                  style={{ color: "var(--foreground)" }}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ====== RIGHT SIDE PANEL ====== */}
          <AnimatePresence>
            {sidePanel !== "none" && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 280, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-l overflow-y-auto shrink-0 hidden md:block"
                style={{ borderColor: "var(--glass-border)" }}
              >
                <div className="p-4 space-y-4">
                  {sidePanel === "highlights" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Highlighter className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
                        <h3 className="text-sm font-semibold font-heading">Highlights</h3>
                      </div>
                      <HighlightsPanel highlights={highlights} onRemove={removeHighlight} />
                    </>
                  )}

                  {sidePanel === "stats" && (
                    <>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
                        <h3 className="text-sm font-semibold font-heading">Progress</h3>
                      </div>

                      <div className="space-y-4">
                        <GuideProgressBar
                          correct={totalCorrect}
                          total={totalProblems}
                          label="Overall"
                        />

                        {guide.lessons.map((lesson) => {
                          const pc = problemCounts[lesson.id]
                          return pc && pc.total > 0 ? (
                            <GuideProgressBar
                              key={lesson.id}
                              correct={pc.correct}
                              total={pc.total}
                              label={`${lesson.title}`}
                              size="sm"
                            />
                          ) : null
                        })}

                        {/* Stats grid */}
                        <div className="grid grid-cols-2 gap-3 pt-2">
                          <div
                            className="rounded-xl p-3 text-center"
                            style={{ background: "var(--muted)" }}
                          >
                            <span className="text-lg font-bold block" style={{ color: "var(--foreground)" }}>
                              {stats.total}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                              Attempted
                            </span>
                          </div>
                          <div
                            className="rounded-xl p-3 text-center"
                            style={{ background: "var(--muted)" }}
                          >
                            <span className="text-lg font-bold block" style={{ color: stats.accuracy >= 80 ? "#10b981" : stats.accuracy >= 50 ? "#f59e0b" : "var(--foreground)" }}>
                              {stats.accuracy}%
                            </span>
                            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
                              Accuracy
                            </span>
                          </div>
                        </div>

                        {/* Reset */}
                        <button
                          onClick={() => {
                            if (confirm("Reset all progress for this guide? This cannot be undone.")) {
                              resetProgress()
                            }
                          }}
                          className="flex items-center gap-1.5 text-xs font-medium text-destructive hover:underline mx-auto pt-2"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset progress
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* ====== DESMOS CALCULATOR PANEL (desktop) ====== */}
          <AnimatePresence>
            {showDesmos && desmosOpen && (
              <DesmosPanel isOpen={desmosOpen} onClose={() => setDesmosOpen(false)} />
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ====== DESMOS TOGGLE BUTTON ====== */}
      {showDesmos && (
        <DesmosToggleButton
          isOpen={desmosOpen}
          onClick={() => setDesmosOpen((p) => !p)}
        />
      )}

      {/* ====== DESMOS MOBILE OVERLAY ====== */}
      <AnimatePresence>
        {showDesmos && desmosOpen && (
          <DesmosMobileOverlay isOpen={desmosOpen} onClose={() => setDesmosOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
