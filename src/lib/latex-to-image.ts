/**
 * LaTeX-to-image rendering utility for PDF embedding.
 *
 * Uses KaTeX to render LaTeX strings to SVG, then rasterizes to PNG
 * via an offscreen canvas so jsPDF can embed them with addImage().
 *
 * Includes a module-level cache keyed by LaTeX string to avoid
 * re-rendering duplicate equations across a worksheet.
 */

import katex from "katex"

// ─── Types ───────────────────────────────────────────────

export interface RenderedEquation {
  /** PNG data-URL (base64) */
  dataUrl: string
  /** Natural width in PDF points */
  width: number
  /** Natural height in PDF points */
  height: number
}

export type ProgressCallback = (rendered: number, total: number) => void

// ─── Module-level cache ──────────────────────────────────

export const equationCache = new Map<string, RenderedEquation>()

export function clearEquationCache() {
  equationCache.clear()
}

// ─── LaTeX detection helpers ─────────────────────────────

/** Regex that matches $...$ (inline) or $$...$$ (display) delimiters */
const LATEX_PATTERN = /\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/

/** Check whether a string contains any LaTeX math delimiters */
export function containsLatex(text: string): boolean {
  return LATEX_PATTERN.test(text)
}

/**
 * Split text into segments of plain text and LaTeX.
 * Returns an array of { type, content } objects.
 */
export interface TextSegment {
  type: "text" | "latex"
  content: string
  displayMode: boolean
}

export function splitLatexSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  // Match $$...$$ first (greedy for display), then $...$
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Plain text before this match
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
        displayMode: false,
      })
    }
    const raw = match[1]
    const isDisplay = raw.startsWith("$$")
    const inner = isDisplay
      ? raw.slice(2, -2).trim()
      : raw.slice(1, -1).trim()

    segments.push({
      type: "latex",
      content: inner,
      displayMode: isDisplay,
    })
    lastIndex = regex.lastIndex
  }

  // Trailing plain text
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
      displayMode: false,
    })
  }

  return segments
}

// ─── Core rendering ──────────────────────────────────────

/**
 * Render a single LaTeX string to a PNG data-URL with measured dimensions.
 * Uses KaTeX → HTML → offscreen DOM → canvas → PNG.
 *
 * The scale factor controls rasterization quality (2× for Retina-quality PDFs).
 */
export async function renderLatexToImage(
  latex: string,
  displayMode: boolean = false,
  scale: number = 3,
): Promise<RenderedEquation> {
  const cacheKey = `${displayMode ? "D" : "I"}:${latex}`
  const cached = equationCache.get(cacheKey)
  if (cached) return cached

  // 1. Render to HTML string via KaTeX
  const html = katex.renderToString(latex, {
    displayMode,
    throwOnError: false,
    output: "html", // HTML output mode (more compatible than mathml)
    trust: true,
  })

  // 2. Create an offscreen container to measure the rendered equation
  const container = document.createElement("div")
  container.innerHTML = html
  container.style.cssText = [
    "position: absolute",
    "left: -9999px",
    "top: -9999px",
    "visibility: hidden",
    // Use a known font size so we can convert to pt later
    "font-size: 16px",
    "line-height: 1.2",
    "padding: 4px 2px",
    // Ensure KaTeX CSS is inherited
    "font-family: KaTeX_Main, 'Times New Roman', serif",
  ].join(";")
  document.body.appendChild(container)

  // We need KaTeX CSS to be loaded for proper measurement
  await ensureKatexCss()

  // Force layout
  await new Promise((r) => requestAnimationFrame(r))

  const rect = container.getBoundingClientRect()
  const pxWidth = Math.ceil(rect.width) + 4
  const pxHeight = Math.ceil(rect.height) + 4

  // 3. Draw to canvas
  const canvas = document.createElement("canvas")
  canvas.width = pxWidth * scale
  canvas.height = pxHeight * scale
  const ctx = canvas.getContext("2d")!
  ctx.scale(scale, scale)

  // Use foreignObject in SVG to render the HTML onto canvas
  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${pxWidth}" height="${pxHeight}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-size:16px;line-height:1.2;padding:4px 2px;font-family:KaTeX_Main,'Times New Roman',serif;">
          ${html}
        </div>
      </foreignObject>
    </svg>
  `

  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" })
  const svgUrl = URL.createObjectURL(svgBlob)

  const result = await new Promise<RenderedEquation>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(svgUrl)

      // Convert px to pt (1px ≈ 0.75pt at 96dpi)
      const ptWidth = pxWidth * 0.75
      const ptHeight = pxHeight * 0.75

      const eq: RenderedEquation = {
        dataUrl: canvas.toDataURL("image/png"),
        width: ptWidth,
        height: ptHeight,
      }
      equationCache.set(cacheKey, eq)
      resolve(eq)
    }
    img.onerror = () => {
      URL.revokeObjectURL(svgUrl)
      // Fallback: use a simpler canvas text rendering
      reject(new Error(`SVG rendering failed for: ${latex}`))
    }
    img.src = svgUrl
  })

  document.body.removeChild(container)
  return result
}

/**
 * Fallback renderer that draws LaTeX as styled plain text
 * (used when SVG foreignObject fails, e.g., due to CORS on fonts).
 */
export async function renderLatexFallback(
  latex: string,
  displayMode: boolean = false,
): Promise<RenderedEquation> {
  const cacheKey = `FB:${displayMode ? "D" : "I"}:${latex}`
  const cached = equationCache.get(cacheKey)
  if (cached) return cached

  const scale = 3
  const fontSize = displayMode ? 18 : 14
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  // Measure
  ctx.font = `italic ${fontSize}px "Times New Roman", serif`
  const metrics = ctx.measureText(latex)
  const pxWidth = Math.ceil(metrics.width) + 12
  const pxHeight = Math.ceil(fontSize * 1.5) + 8

  canvas.width = pxWidth * scale
  canvas.height = pxHeight * scale
  ctx.scale(scale, scale)

  // Draw
  ctx.font = `italic ${fontSize}px "Times New Roman", serif`
  ctx.fillStyle = "#1a1a1a"
  ctx.textBaseline = "middle"
  ctx.fillText(latex, 6, pxHeight / 2)

  const eq: RenderedEquation = {
    dataUrl: canvas.toDataURL("image/png"),
    width: pxWidth * 0.75,
    height: pxHeight * 0.75,
  }
  equationCache.set(cacheKey, eq)
  return eq
}

/**
 * Batch-render all unique LaTeX strings found in questions,
 * with a progress callback for UI feedback.
 */
export async function preRenderAllLatex(
  texts: string[],
  onProgress?: ProgressCallback,
): Promise<void> {
  // Collect all unique LaTeX expressions
  const uniqueLatex = new Map<string, boolean>() // key → displayMode
  for (const text of texts) {
    if (!containsLatex(text)) continue
    const segments = splitLatexSegments(text)
    for (const seg of segments) {
      if (seg.type === "latex") {
        const key = `${seg.displayMode ? "D" : "I"}:${seg.content}`
        if (!equationCache.has(key)) {
          uniqueLatex.set(seg.content, seg.displayMode)
        }
      }
    }
  }

  const total = uniqueLatex.size
  if (total === 0) return

  let rendered = 0
  for (const [latex, displayMode] of uniqueLatex) {
    try {
      await renderLatexToImage(latex, displayMode)
    } catch {
      // Try fallback renderer
      try {
        await renderLatexFallback(latex, displayMode)
      } catch {
        console.warn(`Failed to render LaTeX: ${latex}`)
      }
    }
    rendered++
    onProgress?.(rendered, total)
  }
}

// ─── KaTeX CSS loader ────────────────────────────────────

let katexCssLoaded = false

async function ensureKatexCss(): Promise<void> {
  if (katexCssLoaded) return
  if (typeof document === "undefined") return

  // Check if already present
  const existing = document.querySelector('link[href*="katex"]')
  if (existing) {
    katexCssLoaded = true
    return
  }

  // Dynamically inject the KaTeX stylesheet
  return new Promise((resolve) => {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://cdn.jsdelivr.net/npm/katex@0.16.35/dist/katex.min.css"
    link.crossOrigin = "anonymous"
    link.onload = () => {
      katexCssLoaded = true
      resolve()
    }
    link.onerror = () => {
      // Proceed even if CSS fails to load
      katexCssLoaded = true
      resolve()
    }
    document.head.appendChild(link)
  })
}
