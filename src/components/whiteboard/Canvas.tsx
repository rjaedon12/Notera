"use client"

import { useRef, useEffect, useCallback } from "react"
import type { WhiteboardElement, Camera, ToolType } from "@/lib/whiteboard/types"
import { SelectionOverlay } from "./SelectionOverlay"

const LIGHT_CANVAS_TEXT_COLOR = "#1a1a1a"
const DARK_CANVAS_TEXT_COLOR = "#ffffff"

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  canvasCallbackRef?: (node: HTMLCanvasElement | null) => void
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onDoubleClick?: (e: React.MouseEvent<HTMLCanvasElement>) => void
  tool: ToolType
  camera: Camera
  onCursorMove?: (x: number, y: number) => void
  elements?: WhiteboardElement[]
  isDarkTheme?: boolean
  editingTextId?: string | null
  onTextChange?: (elementId: string, content: string) => void
  onTextBlur?: () => void
  // Selection overlay
  selectedElementId?: string | null
  onResizeStart?: () => void
  onResize?: (id: string, x: number, y: number, w: number, h: number) => void
  onUpdateColor?: (id: string, color: string) => void
  onDeleteSelected?: () => void
}

export function Canvas({
  canvasRef,
  canvasCallbackRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDoubleClick,
  tool,
  camera,
  onCursorMove,
  elements = [],
  isDarkTheme = false,
  editingTextId,
  onTextChange,
  onTextBlur,
  selectedElementId,
  onResizeStart,
  onResize,
  onUpdateColor,
  onDeleteSelected,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Resize canvas to fill container
  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return
      canvas.style.width = "100%"
      canvas.style.height = "100%"
    }
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [canvasRef])

  // Auto-focus textarea when editing starts
  useEffect(() => {
    if (editingTextId && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [editingTextId])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Report cursor position to collaboration layer
      if (onCursorMove) {
        const canvas = canvasRef.current
        if (canvas) {
          const rect = canvas.getBoundingClientRect()
          const x = (e.clientX - rect.left) / camera.zoom - camera.x / camera.zoom
          const y = (e.clientY - rect.top) / camera.zoom - camera.y / camera.zoom
          onCursorMove(x, y)
        }
      }
      onPointerMove(e)
    },
    [onPointerMove, onCursorMove, canvasRef, camera]
  )

  const getCursor = () => {
    switch (tool) {
      case "pan": return "grab"
      case "eraser": return "crosshair"
      case "text": return "text"
      case "select": return "default"
      case "image": return "copy"
      default: return "crosshair"
    }
  }

  // Merge the stable canvasRef with the callback ref from the hook
  const mergedRef = useCallback(
    (node: HTMLCanvasElement | null) => {
      // Update the forwarded ref object
      (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = node
      // Notify the hook that the canvas is mounted/unmounted
      canvasCallbackRef?.(node)
    },
    [canvasRef, canvasCallbackRef]
  )

  // Find the element being edited for text overlay positioning
  const editingElement = editingTextId
    ? elements.find((el) => el.id === editingTextId)
    : null

  // Find the selected element for the resize/color overlay (only in select mode)
  const selectedEl =
    selectedElementId && tool === "select" && !editingTextId
      ? (elements.find((el) => el.id === selectedElementId) ?? null)
      : null

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-visible">
      <canvas
        ref={mergedRef}
        className="absolute inset-0 touch-none"
        style={{ cursor: getCursor() }}
        onPointerDown={onPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={onDoubleClick}
        onPointerLeave={() => onCursorMove?.(NaN, NaN)}
      />

      {/* Text editing overlay for sticky notes and text elements */}
      {editingElement && onTextChange && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <textarea
            ref={textareaRef}
            value={editingElement.content || ""}
            onChange={(e) => onTextChange(editingElement.id, e.target.value)}
            onBlur={() => onTextBlur?.()}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                onTextBlur?.()
              }
              e.stopPropagation()
            }}
            className={`pointer-events-auto absolute resize-none ${
              editingElement.type === "sticky"
                ? "border-none outline-none bg-transparent"
                : "border border-dashed border-blue-400 outline-none bg-white/90 dark:bg-zinc-900/90 rounded"
            }`}
            style={{
              left: editingElement.x * camera.zoom + camera.x,
              top: editingElement.y * camera.zoom + camera.y,
              width: (editingElement.width || 200) * camera.zoom,
              height: (editingElement.height || 200) * camera.zoom,
              fontSize: editingElement.type === "sticky"
                ? `${14 * camera.zoom}px`
                : `${18 * camera.zoom}px`,
              fontFamily: "Inter, sans-serif",
              color: editingElement.type === "sticky"
                ? resolveStickyEditorColor(editingElement.stickyColor)
                : resolveCanvasEditorColor(editingElement.style.color, isDarkTheme),
              padding: editingElement.type === "sticky"
                ? `${16 * camera.zoom}px`
                : `${2 * camera.zoom}px`,
              lineHeight: 1.5,
              zIndex: 50,
              caretColor: editingElement.type === "sticky"
                ? resolveStickyEditorColor(editingElement.stickyColor)
                : resolveCanvasEditorColor(editingElement.style.color, isDarkTheme),
              // Text area background: transparent for sticky (canvas-rendered bg), slight bg for text
              background: editingElement.type === "sticky" ? "transparent" : undefined,
              boxSizing: "border-box",
              overflowWrap: "break-word",
              wordBreak: "break-word",
              overflow: "hidden",
            }}
            placeholder={editingElement.type === "sticky" ? "Type here..." : "Type..."}
            autoFocus
          />
        </div>
      )}

      {/* Selection overlay — resize handles, color picker, delete button */}
      {selectedEl && onResize && (
        <SelectionOverlay
          element={selectedEl}
          camera={camera}
          onResizeStart={onResizeStart ?? (() => {})}
          onResize={onResize}
          onUpdateColor={onUpdateColor ?? (() => {})}
          onDelete={onDeleteSelected ?? (() => {})}
        />
      )}
    </div>
  )
}

function resolveCanvasEditorColor(color: string | undefined, isDarkTheme: boolean) {
  if (!color) {
    return isDarkTheme ? DARK_CANVAS_TEXT_COLOR : LIGHT_CANVAS_TEXT_COLOR
  }

  return color
}

function resolveStickyEditorColor(stickyColor?: string) {
  return isColorDarkHex(stickyColor ?? "#fff3bf") ? DARK_CANVAS_TEXT_COLOR : LIGHT_CANVAS_TEXT_COLOR
}

function normalizeHexColor(color: string) {
  const normalized = color.trim().toLowerCase()

  if (!normalized.startsWith("#")) {
    return normalized
  }

  if (normalized.length === 4) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
  }

  return normalized
}

function isColorDarkHex(hex: string) {
  const normalized = normalizeHexColor(hex)
  if (!normalized.startsWith("#") || normalized.length !== 7) {
    return false
  }

  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}
