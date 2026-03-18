import getStroke from "perfect-freehand"
import type { Point } from "./types"

/**
 * Generate SVG path data from a set of points using perfect-freehand
 * for smooth, pressure-sensitive strokes.
 */
export function getSvgPathFromPoints(
  points: Point[],
  options: {
    size?: number
    thinning?: number
    smoothing?: number
    streamline?: number
    simulatePressure?: boolean
  } = {}
): string {
  const {
    size = 4,
    thinning = 0.5,
    smoothing = 0.5,
    streamline = 0.5,
    simulatePressure = true,
  } = options

  const inputPoints = points.map((p) => [p.x, p.y, p.pressure ?? 0.5])
  const stroke = getStroke(inputPoints, {
    size,
    thinning,
    smoothing,
    streamline,
    simulatePressure,
    last: true,
  })

  if (stroke.length === 0) return ""

  return getSvgPath(stroke)
}

/**
 * Generate SVG path data for a highlighter stroke (wider, semi-transparent).
 */
export function getHighlighterPath(
  points: Point[],
  size: number = 20
): string {
  return getSvgPathFromPoints(points, {
    size,
    thinning: 0,
    smoothing: 0.7,
    streamline: 0.6,
    simulatePressure: false,
  })
}

/**
 * Turn an array of [x, y] points into a smooth SVG path string.
 * Uses quadratic bezier curves for smoothness.
 */
function getSvgPath(points: number[][]): string {
  if (points.length < 2) return ""

  const d: string[] = []
  d.push(`M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`)

  for (let i = 1; i < points.length - 1; i++) {
    const cp = points[i]
    const next = points[i + 1]
    const mx = (cp[0] + next[0]) / 2
    const my = (cp[1] + next[1]) / 2
    d.push(`Q ${cp[0].toFixed(2)} ${cp[1].toFixed(2)} ${mx.toFixed(2)} ${my.toFixed(2)}`)
  }

  // Close with last point
  const last = points[points.length - 1]
  d.push(`L ${last[0].toFixed(2)} ${last[1].toFixed(2)}`)
  d.push("Z")

  return d.join(" ")
}

/**
 * Generate an SVG path for a simple shape outline.
 */
export function getShapePath(
  type: "rectangle" | "circle" | "line" | "arrow",
  x: number,
  y: number,
  width: number,
  height: number
): string {
  switch (type) {
    case "rectangle":
      return `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z`
    case "circle": {
      const cx = x + width / 2
      const cy = y + height / 2
      const rx = Math.abs(width) / 2
      const ry = Math.abs(height) / 2
      return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
    }
    case "line":
      return `M ${x} ${y} L ${x + width} ${y + height}`
    case "arrow": {
      const endX = x + width
      const endY = y + height
      const angle = Math.atan2(height, width)
      const headLen = 16
      const a1 = angle - Math.PI / 6
      const a2 = angle + Math.PI / 6
      return [
        `M ${x} ${y} L ${endX} ${endY}`,
        `M ${endX} ${endY} L ${endX - headLen * Math.cos(a1)} ${endY - headLen * Math.sin(a1)}`,
        `M ${endX} ${endY} L ${endX - headLen * Math.cos(a2)} ${endY - headLen * Math.sin(a2)}`,
      ].join(" ")
    }
    default:
      return ""
  }
}

/**
 * Check if a point is inside or near a stroke (for eraser hit testing).
 */
export function isPointNearStroke(
  point: Point,
  strokePoints: Point[],
  threshold: number = 10
): boolean {
  for (const sp of strokePoints) {
    const dx = point.x - sp.x
    const dy = point.y - sp.y
    if (dx * dx + dy * dy < threshold * threshold) return true
  }
  return false
}

/**
 * Check if a point is inside a shape bounding box.
 */
export function isPointInShape(
  point: Point,
  x: number,
  y: number,
  width: number,
  height: number,
  padding: number = 4
): boolean {
  const minX = Math.min(x, x + width) - padding
  const maxX = Math.max(x, x + width) + padding
  const minY = Math.min(y, y + height) - padding
  const maxY = Math.max(y, y + height) + padding
  return point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY
}
