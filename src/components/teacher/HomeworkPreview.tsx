"use client"

import { X, FileText } from "lucide-react"
import { motion } from "framer-motion"
import { LatexRenderer } from "@/components/studyguide/LatexRenderer"
import type { HomeworkConfig, GeneratedQuestion } from "@/types/homework"

interface HomeworkPreviewProps {
  config: HomeworkConfig
  questions: GeneratedQuestion[]
  onClose: () => void
}

/**
 * Render text that may contain LaTeX math ($...$, $$...$$).
 * If no LaTeX delimiters are detected, returns plain text in a span.
 * Otherwise, uses the LatexRenderer component for proper math display.
 */
function MathText({ text, className }: { text: string; className?: string }) {
  const hasLatex = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/.test(text)
  if (!hasLatex) {
    return <span className={className}>{text}</span>
  }
  return <LatexRenderer content={text} className={className} />
}

export function HomeworkPreview({ config, questions, onClose }: HomeworkPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-bold text-gray-900">Preview</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Preview content — mimics PDF layout */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-gray-900">
          <div className="max-w-lg mx-auto space-y-4">
            {/* Title */}
            <h1 className="text-xl font-bold text-gray-900">
              {config.title || "Homework Worksheet"}
            </h1>

            {/* Meta */}
            <div className="text-xs text-gray-500 space-y-0.5">
              {config.teacherName && <p>Teacher: {config.teacherName}</p>}
              {config.className && <p>Class: {config.className}</p>}
              {config.date && <p>Date: {config.date}</p>}
            </div>

            {/* Name field */}
            {config.includeNameField && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-gray-700">Name:</span>
                <div className="flex-1 border-b border-gray-300" />
              </div>
            )}

            {/* Divider */}
            <hr className="border-gray-300" />

            {/* Instructions */}
            {config.instructions && (
              <p className="text-xs italic text-gray-500">{config.instructions}</p>
            )}

            {/* Word bank */}
            {config.includeWordBank && questions.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-bold text-gray-700 mb-1">Word Bank</p>
                <p className="text-xs text-gray-600">
                  {[...new Set(questions.map((q) => q.answer))].sort().join("    •    ")}
                </p>
              </div>
            )}

            {/* Questions */}
            <div className="space-y-4 pt-2">
              {questions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">
                  No questions generated yet. Select sets and question types.
                </p>
              ) : (
                questions.map((q, i) => (
                  <div key={q.id} className="space-y-1">
                    {q.type === "matching" && q.matchPairs ? (
                      <>
                        <p className="text-sm font-bold">
                          {i + 1}. Matching
                        </p>
                        <p className="text-xs text-gray-500">
                          <MathText text={q.prompt} />
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pl-4 pt-1">
                          <p className="text-xs font-bold text-gray-600">Term</p>
                          <p className="text-xs font-bold text-gray-600">Definition</p>
                          {q.matchPairs.map((pair, pi) => (
                            <div key={pi} className="contents">
                              <p className="text-xs text-gray-700">
                                ___ <MathText text={pair.term} />
                              </p>
                              <p className="text-xs text-gray-700">
                                {String.fromCharCode(65 + pi)}. <MathText text={pair.definition} />
                              </p>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : q.type === "multiple-choice" && q.choices ? (
                      <>
                        <p className="text-sm font-bold">
                          {i + 1}. <MathText text={q.prompt} />
                        </p>
                        <div className="pl-4 space-y-0.5">
                          {q.choices.map((c, ci) => (
                            <p key={ci} className="text-xs text-gray-700">
                              {String.fromCharCode(97 + ci)}) <MathText text={c} />
                            </p>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-bold">
                          {i + 1}. <MathText text={q.prompt} />
                        </p>
                        <div className="border-b border-gray-300 ml-4 mt-2" />
                      </>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Answer key preview */}
            {config.includeAnswerKey && questions.length > 0 && (
              <div className="pt-6 mt-6 border-t-2 border-gray-300">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Answer Key</h2>
                <div className="space-y-1">
                  {questions.map((q, i) => (
                    <p key={q.id} className="text-xs text-gray-600">
                      {i + 1}. <MathText text={q.answer} />
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
