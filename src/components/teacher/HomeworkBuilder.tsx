"use client"

import { useState, useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import {
  FileText,
  Download,
  Eye,
  Settings2,
  Layers,
  Shuffle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

import { SetSelector } from "./SetSelector"
import { QuestionFormatPicker } from "./QuestionFormatPicker"
import { HomeworkPreview } from "./HomeworkPreview"
import { PDFRenderer } from "./PDFRenderer"

import type { HomeworkConfig, QuestionType, SetForHomework, FlashcardForHomework } from "@/types/homework"
import { generateQuestions } from "@/lib/pdf-generator"

export function HomeworkBuilder() {
  const { data: session } = useSession()

  // ── Config state ────────────────
  const [config, setConfig] = useState<HomeworkConfig>({
    title: "",
    teacherName: session?.user?.name || "",
    className: "",
    date: new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    instructions: "Answer all questions to the best of your ability.",
    includeAnswerKey: true,
    includeNameField: true,
    includeWordBank: false,
    questionTypes: ["term-to-definition"],
    questionsPerSet: 10,
    shuffleQuestions: true,
    selectedSetIds: [],
  })

  const [showPreview, setShowPreview] = useState(false)
  const [selectedSets, setSelectedSets] = useState<SetForHomework[]>([])

  // ── Gather all cards from selected sets ──
  const allCards = useMemo<FlashcardForHomework[]>(() => {
    return selectedSets.flatMap((s) => s.cards || [])
  }, [selectedSets])

  // ── Generate questions based on current config ──
  const questions = useMemo(() => {
    if (allCards.length === 0 || config.questionTypes.length === 0) return []
    return generateQuestions(allCards, config)
  }, [allCards, config])

  // ── Handlers ────────────────────
  const updateConfig = useCallback(
    <K extends keyof HomeworkConfig>(key: K, value: HomeworkConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const handleSetToggle = useCallback(
    (set: SetForHomework, selected: boolean) => {
      if (selected) {
        setSelectedSets((prev) => [...prev, set])
        setConfig((prev) => ({
          ...prev,
          selectedSetIds: [...prev.selectedSetIds, set.id],
        }))
      } else {
        setSelectedSets((prev) => prev.filter((s) => s.id !== set.id))
        setConfig((prev) => ({
          ...prev,
          selectedSetIds: prev.selectedSetIds.filter((id) => id !== set.id),
        }))
      }
    },
    []
  )

  const handleTypeToggle = useCallback(
    (type: QuestionType, enabled: boolean) => {
      setConfig((prev) => ({
        ...prev,
        questionTypes: enabled
          ? [...prev.questionTypes, type]
          : prev.questionTypes.filter((t) => t !== type),
      }))
    },
    []
  )

  const totalCards = allCards.length
  const canGenerate =
    config.selectedSetIds.length > 0 &&
    config.questionTypes.length > 0 &&
    config.title.trim().length > 0

  return (
    <div className="space-y-6">
      {/* ── 1. WORKSHEET INFO ── */}
      <section
        className="rounded-2xl border p-6 space-y-4"
        style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Settings2 className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
          <h2 className="text-sm font-bold font-heading">Worksheet Info</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
              Title *
            </label>
            <input
              type="text"
              placeholder="Chapter 5 Vocabulary Quiz"
              value={config.title}
              onChange={(e) => updateConfig("title", e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-transparent border outline-none focus:ring-2 focus:ring-[var(--accent-color)]/30 text-foreground"
              style={{ borderColor: "var(--glass-border)" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
              Teacher Name
            </label>
            <input
              type="text"
              placeholder="Mr. Smith"
              value={config.teacherName}
              onChange={(e) => updateConfig("teacherName", e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-transparent border outline-none focus:ring-2 focus:ring-[var(--accent-color)]/30 text-foreground"
              style={{ borderColor: "var(--glass-border)" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
              Class
            </label>
            <input
              type="text"
              placeholder="AP Biology Period 3"
              value={config.className}
              onChange={(e) => updateConfig("className", e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-transparent border outline-none focus:ring-2 focus:ring-[var(--accent-color)]/30 text-foreground"
              style={{ borderColor: "var(--glass-border)" }}
            />
          </div>
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
              Date
            </label>
            <input
              type="text"
              value={config.date}
              onChange={(e) => updateConfig("date", e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm bg-transparent border outline-none focus:ring-2 focus:ring-[var(--accent-color)]/30 text-foreground"
              style={{ borderColor: "var(--glass-border)" }}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: "var(--muted-foreground)" }}>
            Instructions
          </label>
          <textarea
            placeholder="Answer all questions to the best of your ability."
            value={config.instructions}
            onChange={(e) => updateConfig("instructions", e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl text-sm bg-transparent border outline-none focus:ring-2 focus:ring-[var(--accent-color)]/30 text-foreground resize-none"
            style={{ borderColor: "var(--glass-border)" }}
          />
        </div>
      </section>

      {/* ── 2. SELECT STUDY SETS ── */}
      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Layers className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
          <h2 className="text-sm font-bold font-heading">Select Study Sets</h2>
          {totalCards > 0 && (
            <span
              className="ml-auto text-xs px-2 py-0.5 rounded-full"
              style={{ background: "color-mix(in srgb, var(--accent-color) 12%, transparent)", color: "var(--accent-color)" }}
            >
              {selectedSets.length} set{selectedSets.length !== 1 ? "s" : ""} · {totalCards} cards
            </span>
          )}
        </div>
        <SetSelector
          selectedSetIds={config.selectedSetIds}
          onToggle={handleSetToggle}
        />
      </section>

      {/* ── 3. QUESTION FORMAT ── */}
      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
      >
        <QuestionFormatPicker
          selectedTypes={config.questionTypes}
          onToggleType={handleTypeToggle}
          questionsPerSet={config.questionsPerSet}
          onQuestionsPerSetChange={(n: number) => updateConfig("questionsPerSet", n)}
          shuffleQuestions={config.shuffleQuestions}
          onShuffleChange={(v: boolean) => updateConfig("shuffleQuestions", v)}
        />
      </section>

      {/* ── 4. OPTIONS ── */}
      <section
        className="rounded-2xl border p-6"
        style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
          <h2 className="text-sm font-bold font-heading">Options</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          {[
            { key: "includeAnswerKey" as const, label: "Include answer key" },
            { key: "includeNameField" as const, label: "Student name field" },
            { key: "includeWordBank" as const, label: "Include word bank" },
          ].map((opt) => (
            <label key={opt.key} className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config[opt.key]}
                onChange={(e) => updateConfig(opt.key, e.target.checked)}
                className="accent-[var(--accent-color)] w-4 h-4 rounded"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* ── ACTION BUTTONS ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowPreview(true)}
          disabled={!canGenerate}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
            canGenerate
              ? "hover:opacity-90"
              : "opacity-40 cursor-not-allowed"
          )}
          style={{
            background: "var(--glass-fill)",
            border: "1px solid var(--glass-border)",
            color: "var(--foreground)",
          }}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>

        <PDFRenderer
          config={config}
          questions={questions}
          disabled={!canGenerate}
        />

        {!canGenerate && (
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {config.title.trim().length === 0
              ? "Add a title to continue"
              : config.selectedSetIds.length === 0
              ? "Select at least one study set"
              : "Select at least one question type"}
          </p>
        )}
      </div>

      {/* ── PREVIEW MODAL ── */}
      {showPreview && (
        <HomeworkPreview
          config={config}
          questions={questions}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
