"use client"

import { useMemo } from "react"
import katex from "katex"

interface LatexRendererProps {
  content: string
  className?: string
}

/**
 * Renders text with inline ($...$) and display ($$...$$) LaTeX,
 * plus basic Markdown bold (**...**) and italic (*...*).
 */
export function LatexRenderer({ content, className }: LatexRendererProps) {
  const html = useMemo(() => renderLatexAndMarkdown(content), [content])

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function renderLatexAndMarkdown(text: string): string {
  // 1. Handle display math: $$...$$
  let result = text.replace(/\$\$([\s\S]*?)\$\$/g, (_match, tex) => {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode: true,
        throwOnError: false,
        trust: true,
      })
    } catch {
      return `<code>${tex}</code>`
    }
  })

  // 2. Handle inline math: $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_match, tex) => {
    try {
      return katex.renderToString(tex.trim(), {
        displayMode: false,
        throwOnError: false,
        trust: true,
      })
    } catch {
      return `<code>${tex}</code>`
    }
  })

  // 3. Bold: **text**
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")

  // 4. Italic: *text*
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")

  // 5. Line breaks
  result = result.replace(/\n/g, "<br />")

  return result
}
