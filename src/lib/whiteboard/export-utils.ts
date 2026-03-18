// ============================================================================
// WHITEBOARD EXPORT UTILITIES
// ============================================================================

import type { WBBoard } from "./types"

/**
 * Export canvas as PNG data URL
 */
export function exportCanvasPNG(canvasEl: HTMLCanvasElement, title: string): void {
  const dataUrl = canvasEl.toDataURL("image/png", 1.0)
  downloadDataUrl(dataUrl, `${sanitizeFilename(title)}.png`)
}

/**
 * Export canvas as SVG (fabric.js toSVG)
 */
export function exportCanvasSVG(svgString: string, title: string): void {
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, `${sanitizeFilename(title)}.svg`)
  URL.revokeObjectURL(url)
}

/**
 * Export canvas as PDF using jsPDF
 */
export async function exportCanvasPDF(canvasEl: HTMLCanvasElement, title: string): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const imgData = canvasEl.toDataURL("image/png", 1.0)
  const w = canvasEl.width
  const h = canvasEl.height
  const orientation = w > h ? "landscape" : "portrait"
  const pdf = new jsPDF({ orientation, unit: "px", format: [w, h] })
  pdf.addImage(imgData, "PNG", 0, 0, w, h)
  pdf.save(`${sanitizeFilename(title)}.pdf`)
}

/**
 * Export board state as JSON
 */
export function exportBoardJSON(board: WBBoard): void {
  const data = JSON.stringify(board, null, 2)
  const blob = new Blob([data], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  downloadDataUrl(url, `${sanitizeFilename(board.title)}.json`)
  URL.revokeObjectURL(url)
}

/**
 * Import board from JSON file
 */
export function importBoardJSON(file: File): Promise<WBBoard> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as WBBoard
        if (!data.id || !data.title || data.canvasJSON === undefined) {
          reject(new Error("Invalid board file"))
          return
        }
        resolve(data)
      } catch {
        reject(new Error("Failed to parse board file"))
      }
    }
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsText(file)
  })
}

function downloadDataUrl(url: string, filename: string): void {
  const link = document.createElement("a")
  link.download = filename
  link.href = url
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\- ]/gi, "").replace(/\s+/g, "_") || "whiteboard"
}
