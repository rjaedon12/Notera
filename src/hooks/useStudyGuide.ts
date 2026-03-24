"use client"

import { useState, useEffect, useCallback } from "react"
import type {
  GuideProgress,
  GuideProblemProgress,
  GuideHighlight,
  HighlightColor,
  GuideNote,
} from "@/types/studyguide"

const STORAGE_PREFIX = "notera_guide_"

// ---------------------------------------------------------------------------
// Core localStorage helpers
// ---------------------------------------------------------------------------

function getStoredProgress(guideId: string): GuideProgress {
  if (typeof window === "undefined") return defaultProgress(guideId)
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${guideId}`)
    if (raw) return JSON.parse(raw) as GuideProgress
  } catch { /* ignore corrupt data */ }
  return defaultProgress(guideId)
}

function setStoredProgress(guideId: string, progress: GuideProgress) {
  if (typeof window === "undefined") return
  localStorage.setItem(`${STORAGE_PREFIX}${guideId}`, JSON.stringify(progress))
}

function defaultProgress(guideId: string): GuideProgress {
  return {
    guideId,
    lessonProgress: {},
    problems: {},
    highlights: [],
    lastAccessedLessonId: null,
    lastAccessedAt: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Notes stored separately (can get large)
// ---------------------------------------------------------------------------

function getStoredNotes(guideId: string): GuideNote[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${guideId}_notes`)
    if (raw) return JSON.parse(raw) as GuideNote[]
  } catch { /* ignore */ }
  return []
}

function setStoredNotes(guideId: string, notes: GuideNote[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(`${STORAGE_PREFIX}${guideId}_notes`, JSON.stringify(notes))
}

// ---------------------------------------------------------------------------
// Hook: useGuideProgress
// ---------------------------------------------------------------------------

export function useGuideProgress(guideId: string) {
  const [progress, setProgress] = useState<GuideProgress>(() =>
    getStoredProgress(guideId)
  )

  // Rehydrate on mount (SSR safety)
  useEffect(() => {
    setProgress(getStoredProgress(guideId))
  }, [guideId])

  // Persist on every change
  useEffect(() => {
    setStoredProgress(guideId, progress)
  }, [guideId, progress])

  /** Mark a section as viewed */
  const markSectionViewed = useCallback((lessonId: string, sectionId: string) => {
    setProgress((prev) => {
      const lp = prev.lessonProgress[lessonId] ?? {
        lessonId,
        sectionsViewed: [],
        isComplete: false,
      }
      if (lp.sectionsViewed.includes(sectionId)) return prev
      return {
        ...prev,
        lessonProgress: {
          ...prev.lessonProgress,
          [lessonId]: {
            ...lp,
            sectionsViewed: [...lp.sectionsViewed, sectionId],
          },
        },
        lastAccessedLessonId: lessonId,
        lastAccessedAt: new Date().toISOString(),
      }
    })
  }, [])

  /** Mark a lesson complete */
  const markLessonComplete = useCallback((lessonId: string) => {
    setProgress((prev) => ({
      ...prev,
      lessonProgress: {
        ...prev.lessonProgress,
        [lessonId]: {
          ...(prev.lessonProgress[lessonId] ?? { lessonId, sectionsViewed: [] }),
          isComplete: true,
        },
      },
    }))
  }, [])

  /** Submit an answer to a practice problem */
  const submitAnswer = useCallback(
    (problemId: string, selectedChoiceId: string, isCorrect: boolean) => {
      setProgress((prev) => {
        const existing = prev.problems[problemId]
        const updated: GuideProblemProgress = {
          problemId,
          isCorrect: existing?.isCorrect || isCorrect, // once correct, stays correct
          attempts: (existing?.attempts ?? 0) + 1,
          lastAttemptAt: new Date().toISOString(),
          selectedChoiceId,
        }
        return {
          ...prev,
          problems: { ...prev.problems, [problemId]: updated },
        }
      })
    },
    []
  )

  /** Get problem progress */
  const getProblemProgress = useCallback(
    (problemId: string): GuideProblemProgress | null => {
      return progress.problems[problemId] ?? null
    },
    [progress.problems]
  )

  /** Overall stats */
  const getStats = useCallback(() => {
    const problemEntries = Object.values(progress.problems)
    const total = problemEntries.length
    const correct = problemEntries.filter((p) => p.isCorrect).length
    const lessonEntries = Object.values(progress.lessonProgress)
    const completedLessons = lessonEntries.filter((l) => l.isComplete).length
    return { total, correct, completedLessons, accuracy: total > 0 ? Math.round((correct / total) * 100) : 0 }
  }, [progress])

  /** Reset all progress for this guide */
  const resetProgress = useCallback(() => {
    setProgress(defaultProgress(guideId))
  }, [guideId])

  return {
    progress,
    markSectionViewed,
    markLessonComplete,
    submitAnswer,
    getProblemProgress,
    getStats,
    resetProgress,
  }
}

// ---------------------------------------------------------------------------
// Hook: useGuideHighlights
// ---------------------------------------------------------------------------

export function useGuideHighlights(guideId: string) {
  const [highlights, setHighlights] = useState<GuideHighlight[]>([])

  useEffect(() => {
    const stored = getStoredProgress(guideId)
    setHighlights(stored.highlights)
  }, [guideId])

  const persist = useCallback(
    (updated: GuideHighlight[]) => {
      const stored = getStoredProgress(guideId)
      setStoredProgress(guideId, { ...stored, highlights: updated })
      setHighlights(updated)
    },
    [guideId]
  )

  const addHighlight = useCallback(
    (sectionId: string, text: string, color: HighlightColor, note?: string) => {
      const hl: GuideHighlight = {
        id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sectionId,
        text,
        color,
        note,
        createdAt: new Date().toISOString(),
      }
      const updated = [...highlights, hl]
      persist(updated)
      return hl
    },
    [highlights, persist]
  )

  const removeHighlight = useCallback(
    (id: string) => {
      persist(highlights.filter((h) => h.id !== id))
    },
    [highlights, persist]
  )

  const getHighlightsForSection = useCallback(
    (sectionId: string) => highlights.filter((h) => h.sectionId === sectionId),
    [highlights]
  )

  return { highlights, addHighlight, removeHighlight, getHighlightsForSection }
}

// ---------------------------------------------------------------------------
// Hook: useGuideNotes
// ---------------------------------------------------------------------------

export function useGuideNotes(guideId: string) {
  const [notes, setNotes] = useState<GuideNote[]>([])

  useEffect(() => {
    setNotes(getStoredNotes(guideId))
  }, [guideId])

  const persist = useCallback(
    (updated: GuideNote[]) => {
      setStoredNotes(guideId, updated)
      setNotes(updated)
    },
    [guideId]
  )

  const addNote = useCallback(
    (sectionId: string, text: string) => {
      const note: GuideNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        sectionId,
        text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      persist([...notes, note])
      return note
    },
    [notes, persist]
  )

  const updateNote = useCallback(
    (noteId: string, text: string) => {
      persist(
        notes.map((n) =>
          n.id === noteId ? { ...n, text, updatedAt: new Date().toISOString() } : n
        )
      )
    },
    [notes, persist]
  )

  const deleteNote = useCallback(
    (noteId: string) => {
      persist(notes.filter((n) => n.id !== noteId))
    },
    [notes, persist]
  )

  const getNotesForSection = useCallback(
    (sectionId: string) => notes.filter((n) => n.sectionId === sectionId),
    [notes]
  )

  return { notes, addNote, updateNote, deleteNote, getNotesForSection }
}
