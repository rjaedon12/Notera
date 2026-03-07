// ============================================================================
// WHITEBOARD TYPES
// ============================================================================

export type ToolType =
  | "select"
  | "pen"
  | "highlighter"
  | "eraser"
  | "laser"
  | "rect"
  | "circle"
  | "triangle"
  | "line"
  | "arrow"
  | "diamond"
  | "text"
  | "sticky"
  | "image"
  | "connector"
  | "equation"
  | "pan"

export type BackgroundType =
  | "plain"
  | "plain-dark"
  | "dots"
  | "grid"
  | "lined"
  | "isometric"
  | "crosshatch"

export type DashStyle = "solid" | "dashed" | "dotted"

export interface WBUser {
  id: string
  username: string
  passwordHash: string
  email?: string
  joinDate: string
  lastActive: string
  banned: boolean
  isAdmin: boolean
}

export interface WBBoard {
  id: string
  ownerId: string
  title: string
  isPublic: boolean
  flagged: boolean
  frames: WBFrame[]
  activeFrameId: string
  background: BackgroundType
  customBgColor: string
  createdAt: string
  updatedAt: string
  canvasJSON: string // fabric.js canvas serialized JSON
  thumbnail?: string // base64 PNG thumbnail for dashboard preview
}

export interface WBFrame {
  id: string
  name: string
  viewportTransform: number[]
  canvasJSON: string
}

export interface Announcement {
  text: string
  color: string
  enabled: boolean
}

export interface WBStore {
  users: Record<string, WBUser>
  boards: Record<string, WBBoard>
  currentUserId: string | null
  announcement: Announcement
}

export interface StyleState {
  strokeColor: string
  fillColor: string
  fillOpacity: number
  strokeWidth: number
  dashStyle: DashStyle
  fontSize: number
  fontFamily: string
  textAlign: string
  fontBold: boolean
  fontItalic: boolean
  fontUnderline: boolean
}

export const DEFAULT_STYLE: StyleState = {
  strokeColor: "#3b82f6",
  fillColor: "transparent",
  fillOpacity: 1,
  strokeWidth: 3,
  dashStyle: "solid",
  fontSize: 20,
  fontFamily: "Inter, system-ui, sans-serif",
  textAlign: "left",
  fontBold: false,
  fontItalic: false,
  fontUnderline: false,
}

export const COLORS = [
  "#ffffff", "#000000", "#3b82f6", "#ef4444", "#22c55e",
  "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
  "#14b8a6", "#6366f1", "#84cc16", "#a855f7",
]

export const STICKY_COLORS = [
  "#fef08a", "#fbcfe8", "#bfdbfe", "#bbf7d0", "#e9d5ff", "#fed7aa",
]

export const BACKGROUND_OPTIONS: { key: BackgroundType; label: string; description: string }[] = [
  { key: "plain", label: "Plain", description: "White background" },
  { key: "plain-dark", label: "Plain Dark", description: "Dark background" },
  { key: "dots", label: "Dots", description: "Dot pattern" },
  { key: "grid", label: "Grid", description: "Grid lines" },
  { key: "lined", label: "Lined", description: "Ruled lines" },
  { key: "isometric", label: "Isometric", description: "60° grid" },
  { key: "crosshatch", label: "Crosshatch", description: "Cross pattern" },
]

export const KEYBOARD_SHORTCUTS = [
  { key: "V", action: "Select tool" },
  { key: "P", action: "Pen tool" },
  { key: "H", action: "Highlighter" },
  { key: "E", action: "Eraser" },
  { key: "L", action: "Laser pointer" },
  { key: "R", action: "Rectangle" },
  { key: "C", action: "Circle / Ellipse" },
  { key: "T", action: "Text tool" },
  { key: "S", action: "Sticky note" },
  { key: "N", action: "Line" },
  { key: "A", action: "Arrow" },
  { key: "D", action: "Diamond" },
  { key: "Q", action: "Equation" },
  { key: "Space + Drag", action: "Pan canvas" },
  { key: "Ctrl+Z", action: "Undo" },
  { key: "Ctrl+Y", action: "Redo" },
  { key: "Ctrl+D", action: "Duplicate" },
  { key: "Ctrl+A", action: "Select all" },
  { key: "Delete", action: "Delete selected" },
  { key: "Ctrl+G", action: "Group" },
  { key: "Ctrl+Shift+G", action: "Ungroup" },
  { key: "?", action: "Show shortcuts" },
  { key: "Scroll Wheel", action: "Zoom in/out" },
]
