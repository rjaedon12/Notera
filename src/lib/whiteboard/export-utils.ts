import type { WhiteboardElement, Camera } from "./types"
import { getSvgPathFromPoints, getHighlighterPath, getShapePath } from "./stroke-engine"

/**
 * Render whiteboard elements to an SVG string.
 */
function renderElementsToSvg(
  elements: WhiteboardElement[],
  width: number,
  height: number,
  bgColor: string = "#ffffff"
): string {
  const svgParts: string[] = []

  svgParts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
  )
  svgParts.push(`<rect width="${width}" height="${height}" fill="${bgColor}"/>`)

  // Compute bounding box of all elements
  let minX = Infinity, minY = Infinity
  for (const el of elements) {
    if (el.points.length > 0) {
      for (const p of el.points) {
        minX = Math.min(minX, p.x)
        minY = Math.min(minY, p.y)
      }
    } else {
      minX = Math.min(minX, el.x)
      minY = Math.min(minY, el.y)
    }
  }
  if (!isFinite(minX)) minX = 0
  if (!isFinite(minY)) minY = 0

  const offsetX = -minX + 40
  const offsetY = -minY + 40

  svgParts.push(`<g transform="translate(${offsetX}, ${offsetY})">`)

  for (const el of elements) {
    const opacity = el.style.opacity
    const color = el.style.color
    const strokeWidth = el.style.size

    if (el.type === "pen") {
      const pathData = getSvgPathFromPoints(el.points, { size: strokeWidth })
      svgParts.push(`<path d="${pathData}" fill="${color}" opacity="${opacity}" stroke="none"/>`)
    } else if (el.type === "highlighter") {
      const pathData = getHighlighterPath(el.points, strokeWidth)
      svgParts.push(`<path d="${pathData}" fill="${color}" opacity="${opacity * 0.4}" stroke="none"/>`)
    } else if (["rectangle", "circle", "line", "arrow"].includes(el.type)) {
      const pathData = getShapePath(el.type as "rectangle" | "circle" | "line" | "arrow", el.x, el.y, el.width, el.height)
      svgParts.push(`<path d="${pathData}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" opacity="${opacity}"/>`)
    } else if (el.type === "text" && el.content) {
      svgParts.push(`<text x="${el.x}" y="${el.y + 20}" font-family="Inter, sans-serif" font-size="18" fill="${color}" opacity="${opacity}">${escapeXml(el.content)}</text>`)
    } else if (el.type === "sticky" && el.content) {
      const stickyColor = el.stickyColor || "#fff3bf"
      svgParts.push(`<rect x="${el.x}" y="${el.y}" width="${el.width || 200}" height="${el.height || 200}" rx="8" fill="${stickyColor}" stroke="#00000015"/>`)
      svgParts.push(`<text x="${el.x + 16}" y="${el.y + 32}" font-family="Inter, sans-serif" font-size="14" fill="#1a1a1a">${escapeXml(el.content)}</text>`)
    }
  }

  svgParts.push("</g></svg>")
  return svgParts.join("\n")
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/**
 * Export the whiteboard as a PNG data URL.
 */
export async function exportAsPng(
  elements: WhiteboardElement[],
  camera: Camera,
  bgColor: string = "#ffffff"
): Promise<string> {
  const width = 1920
  const height = 1080
  const svgString = renderElementsToSvg(elements, width, height, bgColor)

  const blob = new Blob([svgString], { type: "image/svg+xml" })
  const url = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = width * 2 // 2x for retina
      canvas.height = height * 2
      const ctx = canvas.getContext("2d")!
      ctx.scale(2, 2)
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/png"))
    }
    img.onerror = reject
    img.src = url
  })
}

/**
 * Export the whiteboard as a PDF using jsPDF.
 */
export async function exportAsPdf(
  elements: WhiteboardElement[],
  camera: Camera,
  bgColor: string = "#ffffff",
  title: string = "Whiteboard"
): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const pngDataUrl = await exportAsPng(elements, camera, bgColor)

  const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [1920, 1080] })
  pdf.addImage(pngDataUrl, "PNG", 0, 0, 1920, 1080)
  pdf.save(`${title}.pdf`)
}

/**
 * Generate a low-res thumbnail for the board dashboard.
 */
export async function generateThumbnail(
  elements: WhiteboardElement[],
  bgColor: string = "#ffffff"
): Promise<string> {
  const width = 400
  const height = 225
  const svgString = renderElementsToSvg(elements, width, height, bgColor)

  const blob = new Blob([svgString], { type: "image/svg+xml" })
  const url = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, width, height)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL("image/png", 0.7))
    }
    img.onerror = reject
    img.src = url
  })
}
