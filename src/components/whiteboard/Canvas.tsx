"use client"

import { useRef, useEffect, useCallback } from "react"
import type { WhiteboardElement, Camera, BackgroundType, ToolType, StrokeStyle } from "@/lib/whiteboard/types"

interface CanvasProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onPointerDown: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerMove: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLCanvasElement>) => void
  tool: ToolType
  camera: Camera
  onCursorMove?: (x: number, y: number) => void
}

export function Canvas({
  canvasRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  tool,
  camera,
  onCursorMove,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)

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
      default: return "crosshair"
    }
  }

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
    </div>
  )
}
