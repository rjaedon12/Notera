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
  // Build compact meta string: "Teacher: X  ·  Class: Y  ·  Date: Z"
  // Build info boxes data
  const infoBoxes: { label: string; value: string }[] = []
  if (config.className) infoBoxes.push({ label: "CLASSROOM", value: config.className })
  if (config.date) infoBoxes.push({ label: "DUE DATE", value: config.date })
  if (config.teacherName) infoBoxes.push({ label: "TEACHER", value: config.teacherName })

  return (
    <div
      id="homework-sheet-content"
      className="bg-white text-gray-900 px-14 py-12"
      style={{
        width: "612px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      }}
    >
      <div className="max-w-[488px] mx-auto">
        {/* Title */}
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {config.title || "Homework Worksheet"}
        </h1>

        {/* Info boxes — three equal-width rounded rects */}
        {infoBoxes.length > 0 && (
          <div className="grid mt-4 gap-2" style={{ gridTemplateColumns: `repeat(${infoBoxes.length}, 1fr)` }}>
            {infoBoxes.map((box) => (
              <div key={box.label} className="rounded-md px-3 py-2.5" style={{ background: "#f3f3f0" }}>
                <p className="text-[6.5px] text-gray-400 uppercase tracking-[0.06em] mb-1">{box.label}</p>
                <p className="text-[9.5px] text-gray-900">{box.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Divider — coral / terracotta accent */}
        <hr className="mt-4 mb-5 border-0" style={{ height: "1.2px", background: "#C4675A" }} />

        {/* Instructions */}
        {config.instructions && (
          <div className="mb-5">
            <p className="text-[7px] text-gray-400 uppercase tracking-[0.08em] mb-2">INSTRUCTIONS</p>
            <p className="text-[9.5px] text-gray-900 leading-relaxed">
              {config.instructions}
            </p>
          </div>
        )}

        {/* Word bank — minimal rule-based design */}
        {config.includeWordBank && questions.length > 0 && (
          <div className="border-t border-b border-gray-200 py-3 mb-5">
            <p className="text-[7.5px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-2">
              Word Bank
            </p>
            <p className="text-[9.5px] text-gray-900 leading-relaxed">
              {[...new Set(questions.map((q) => q.answer))]
                .sort()
                .join("     \u00b7     ")}
            </p>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-6 pt-1">
          {questions.length === 0 ? (
            <p className="text-sm text-gray-300 text-center py-10">
              No questions generated yet. Select sets and question types.
            </p>
          ) : (
            questions.map((q, i) => (
              <div key={q.id} className="homework-question">
                {q.type === "matching" && q.matchPairs ? (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-900">
                      <span className="font-bold">{i + 1}.</span>{" "}
                      <span>Matching</span>
                    </p>
                    <p className="text-[9.5px] text-gray-400 pl-5">
                      <MathText text={q.prompt} />
                    </p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pl-5 pt-2">
                      {/* Column headers */}
                      <p className="text-[7.5px] font-semibold text-gray-400 uppercase tracking-[0.1em] pb-1 border-b border-gray-100">
                        Term
                      </p>
                      <p className="text-[7.5px] font-semibold text-gray-400 uppercase tracking-[0.1em] pb-1 border-b border-gray-100">
                        Definition
                      </p>
                      {q.matchPairs.map((pair, pi) => (
                        <div key={pi} className="contents">
                          <p className="text-[9.5px] text-gray-900">
                            {pi + 1}.{" "}
                            <MathText text={pair.term} />
                          </p>
                          <p className="text-[9.5px] text-gray-900">
                            {String.fromCharCode(65 + pi)}.{" "}
                            <MathText text={pair.definition} />
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : q.type === "multiple-choice" && q.choices ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-900">
                      {i + 1}. <MathText text={q.prompt} />
                    </p>
                    <div className="pl-6 space-y-1">
                      {q.choices.map((c, ci) => (
                        <p key={ci} className="text-[9px] text-gray-900">
                          {String.fromCharCode(97 + ci)}.{" "}
                          <MathText text={c} />
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[10px] font-bold text-gray-900">
                      {i + 1}. <MathText text={q.prompt} />
                    </p>
                    <div className="border-b border-gray-200 ml-6 mr-0 mt-3" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Answer key */}
        {config.includeAnswerKey && questions.length > 0 && (
          <div className="pt-10 mt-10 border-t border-gray-200">
            <h2 className="text-sm font-bold tracking-tight text-gray-900 mb-4">
              Answer Key
            </h2>
            <div className="space-y-1.5">
              {questions.map((q, i) => (
                <p key={q.id} className="text-[9.5px] text-gray-900">
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
