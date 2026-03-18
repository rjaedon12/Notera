// ─── Whiteboard Types ────────────────────────────────────

export type ToolType =
  | "select"
  | "pen"
  | "highlighter"
  | "eraser"
  | "rectangle"
  | "circle"
  | "line"
  | "arrow"
  | "text"
  | "sticky"
  | "pan"

export type BackgroundType = "plain" | "dots" | "grid" | "lined"

export interface Point {
  x: number
  y: number
  pressure?: number
}

export interface Camera {
  x: number
  y: number
  zoom: number
}

export interface StrokeStyle {
  color: string
  size: number
  opacity: number
}

export interface WhiteboardElement {
  id: string
  type: ToolType
  points: Point[]
  style: StrokeStyle
  // For shapes, text, sticky
  x: number
  y: number
  width: number
  height: number
  rotation: number
  // Text content (for text & sticky)
  content?: string
  // Sticky note color
  stickyColor?: string
  // Computed SVG path data (cached for rendering)
  pathData?: string
  // Creation metadata
  createdBy: string
  createdAt: number
}

export interface BoardMeta {
  id: string
  title: string
  thumbnail: string | null
  background: BackgroundType
  bgColor: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  ownerId: string
  ownerName: string | null
  memberCount: number
}

// ─── Liveblocks Types ────────────────────────────────────

export interface Presence {
  cursor: Point | null
  selectedTool: ToolType
  userName: string
  userColor: string
  userId: string
}

export interface Storage {
  elements: WhiteboardElement[]
  background: BackgroundType
  bgColor: string
}

// ─── Constants ───────────────────────────────────────────

export const COLORS = [
  "#1a1a1a", "#e03131", "#f08c00", "#2b8a3e",
  "#1971c2", "#6741d9", "#c2255c", "#ffffff",
  "#868e96", "#ff6b6b", "#ffd43b", "#51cf66",
  "#339af0", "#9775fa", "#f783ac", "#ced4da",
] as const

export const HIGHLIGHTER_COLORS = [
  "#fff3bf", "#d3f9d8", "#d0ebff", "#e5dbff",
  "#ffe0e6", "#ffc9c9", "#b2f2bb", "#a5d8ff",
] as const

export const STICKY_COLORS = [
  "#fff3bf", // yellow
  "#d3f9d8", // green
  "#d0ebff", // blue
  "#e5dbff", // purple
  "#ffe8cc", // orange
  "#ffc9c9", // red/pink
] as const

export const STROKE_SIZES = [2, 4, 8, 14, 20] as const

export const USER_COLORS = [
  "#e03131", "#1971c2", "#2b8a3e", "#f08c00",
  "#6741d9", "#c2255c", "#0c8599", "#e8590c",
] as const

export const MIN_ZOOM = 0.1
export const MAX_ZOOM = 10
export const DEFAULT_ZOOM = 1

export const TOOLS_CONFIG: Record<ToolType, { label: string; shortcut: string }> = {
  select: { label: "Select", shortcut: "V" },
  pen: { label: "Pen", shortcut: "P" },
  highlighter: { label: "Highlighter", shortcut: "H" },
  eraser: { label: "Eraser", shortcut: "E" },
  rectangle: { label: "Rectangle", shortcut: "R" },
  circle: { label: "Circle", shortcut: "C" },
  line: { label: "Line", shortcut: "L" },
  arrow: { label: "Arrow", shortcut: "A" },
  text: { label: "Text", shortcut: "T" },
  sticky: { label: "Sticky Note", shortcut: "S" },
  pan: { label: "Pan", shortcut: "Space" },
}
