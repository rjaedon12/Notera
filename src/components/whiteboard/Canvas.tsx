"use client"

import { useRef, useEffect, useCallback, useState } from "react"
import type { WhiteboardElement, Camera, BackgroundType, ToolType, StrokeStyle } from "@/lib/whiteboard/types"

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void
  tool: ToolType
  camera: Camera
  onCursorMove?: (x: number, y: number) => void
  elements?: WhiteboardElement[]
  editingTextId?: string | null
  onTextChange?: (elementId: string, content: string) => void
  onTextBlur?: () => void
}

export function Canvas({
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  tool,
  camera,
  onCursorMove,
  elements = [],
  editingTextId,
  onTextChange,
  onTextBlur,
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

  // Find the element being edited for text overlay positioning
  const editingElement = editingTextId
    ? elements.find((el) => el.id === editingTextId)
    : null

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 touch-none"
        style={{ cursor: getCursor() }}
        onPointerDown={onPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={onPointerUp}
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
            className="pointer-events-auto absolute border-none outline-none resize-none bg-transparent"
            style={{
              left: editingElement.x * camera.zoom + camera.x,
              top: editingElement.y * camera.zoom + camera.y,
              width: (editingElement.width || 200) * camera.zoom,
              height: (editingElement.height || 200) * camera.zoom,
              fontSize: editingElement.type === "sticky"
                ? `${14 * camera.zoom}px`
                : `${18 * camera.zoom}px`,
              fontFamily: "Inter, sans-serif",
              color: editingElement.type === "sticky" ? "#1a1a1a" : editingElement.style.color,
              padding: editingElement.type === "sticky"
                ? `${16 * camera.zoom}px`
                : `${2 * camera.zoom}px`,
              lineHeight: 1.5,
              zIndex: 50,
              caretColor: editingElement.type === "sticky" ? "#1a1a1a" : editingElement.style.color,
              // Make text area transparent over the canvas-rendered element
              background: editingElement.type === "sticky" ? "transparent" : "transparent",
            }}
            placeholder={editingElement.type === "sticky" ? "Type here..." : "Type..."}
            autoFocus
          />
        </div>
      )}
    </div>
  )
}
