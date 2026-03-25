"use client"

import { LatexRenderer } from "@/components/studyguide/LatexRenderer"
import type { HomeworkConfig, GeneratedQuestion } from "@/types/homework"

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

interface HomeworkSheetContentProps {
  config: HomeworkConfig
  questions: GeneratedQuestion[]
}

/**
 * Pure, stateless homework-sheet layout shared by the live preview modal
 * **and** the html2canvas → PDF pipeline.
 *
 * Styling rules
 * ─────────────
 * • Uses only Tailwind utility classes so the same CSS that the preview
 *   renders is the same CSS that html2canvas captures.
 * • A companion `@media print` block (in homework-print.css) lets the
 *   browser's "Print → PDF" command produce reasonable output too.
 * • The root `<div>` has the id `homework-sheet-content` so the PDF
 *   renderer can grab it with `document.getElementById`.
 */
export function HomeworkSheetContent({
  config,
  questions,
}: HomeworkSheetContentProps) {
  return (
    <div
      id="homework-sheet-content"
      className="bg-white text-gray-900 p-8"
      style={{
        width: "612px", // US Letter width in CSS px (≈ 8.5 in @ 72 dpi)
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
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
              {[...new Set(questions.map((q) => q.answer))]
                .sort()
                .join("    •    ")}
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
              <div key={q.id} className="space-y-1 homework-question">
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
                      <p className="text-xs font-bold text-gray-600">
                        Definition
                      </p>
                      {q.matchPairs.map((pair, pi) => (
                        <div key={pi} className="contents">
                          <p className="text-xs text-gray-700">
                            ___ <MathText text={pair.term} />
                          </p>
                          <p className="text-xs text-gray-700">
                            {String.fromCharCode(65 + pi)}.{" "}
                            <MathText text={pair.definition} />
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

        {/* Answer key */}
        {config.includeAnswerKey && questions.length > 0 && (
          <div className="pt-6 mt-6 border-t-2 border-gray-300">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              Answer Key
            </h2>
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
  )
}
