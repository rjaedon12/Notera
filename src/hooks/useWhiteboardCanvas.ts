"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import type {
  ToolType,
  Point,
  Camera,
  StrokeStyle,
  WhiteboardElement,
  BackgroundType,
} from "@/lib/whiteboard/types"
import { MIN_ZOOM, MAX_ZOOM, DEFAULT_ZOOM } from "@/lib/whiteboard/types"
import { getSvgPathFromPoints, getHighlighterPath, isPointNearStroke, isPointInShape } from "@/lib/whiteboard/stroke-engine"
import { v4 as uuid } from "uuid"

interface UseWhiteboardCanvasOptions {
  initialElements?: WhiteboardElement[]
  userId: string
  onElementsChange?: (elements: WhiteboardElement[]) => void
}

export function useWhiteboardCanvas({
  initialElements = [],
  userId,
  onElementsChange,
}: UseWhiteboardCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [elements, setElements] = useState<WhiteboardElement[]>(initialElements)
  const [tool, setTool] = useState<ToolType>("pen")
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0, zoom: DEFAULT_ZOOM })
  const [style, setStyle] = useState<StrokeStyle>({ color: "#1a1a1a", size: 4, opacity: 1 })
  const [background, setBackground] = useState<BackgroundType>("plain")
  const [bgColor, setBgColor] = useState("#ffffff")
  const [isDrawing, setIsDrawing] = useState(false)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
  const [editingTextId, setEditingTextId] = useState<string | null>(null)

  // Undo/redo stacks
  const undoStack = useRef<WhiteboardElement[][]>([])
  const redoStack = useRef<WhiteboardElement[][]>([])
  const currentStroke = useRef<Point[]>([])
  const isPanning = useRef(false)
  const lastPanPoint = useRef<Point>({ x: 0, y: 0 })
  const shapeStart = useRef<Point>({ x: 0, y: 0 })

  // Sync elements ref for callbacks
  const elementsRef = useRef(elements)
  elementsRef.current = elements

  // ─── Coordinate Transforms ──────────────────────────────

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number): Point => {
      const canvas = canvasRef.current
      if (!canvas) return { x: screenX, y: screenY }
      const rect = canvas.getBoundingClientRect()
      return {
        x: (screenX - rect.left) / camera.zoom - camera.x / camera.zoom,
        y: (screenY - rect.top) / camera.zoom - camera.y / camera.zoom,
      }
    },
    [camera]
  )

  // ─── History ────────────────────────────────────────────

  const pushHistory = useCallback(() => {
    undoStack.current.push([...elementsRef.current])
    if (undoStack.current.length > 50) undoStack.current.shift()
    redoStack.current = []
  }, [])

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return
    redoStack.current.push([...elementsRef.current])
    const prev = undoStack.current.pop()!
    setElements(prev)
    onElementsChange?.(prev)
  }, [onElementsChange])

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return
    undoStack.current.push([...elementsRef.current])
    const next = redoStack.current.pop()!
    setElements(next)
    onElementsChange?.(next)
  }, [onElementsChange])

  // ─── Update elements helper ─────────────────────────────

  const updateElements = useCallback(
    (newElements: WhiteboardElement[]) => {
      setElements(newElements)
      onElementsChange?.(newElements)
    },
    [onElementsChange]
  )

  // ─── Pointer Handlers ──────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.setPointerCapture(e.pointerId)

      const point = screenToCanvas(e.clientX, e.clientY)
      const pressure = e.pressure || 0.5

      // Space+click or middle mouse = always pan
      if (tool === "pan" || e.button === 1) {
        isPanning.current = true
        lastPanPoint.current = { x: e.clientX, y: e.clientY }
        return
      }

      if (tool === "select") {
        // Hit-test elements in reverse order (top to bottom)
        let found = false
        for (let i = elementsRef.current.length - 1; i >= 0; i--) {
          const el = elementsRef.current[i]
          if (el.type === "pen" || el.type === "highlighter") {
            if (isPointNearStroke(point, el.points, 12 / camera.zoom)) {
              setSelectedElementId(el.id)
              found = true
              break
            }
          } else {
            if (isPointInShape(point, el.x, el.y, el.width, el.height, 8 / camera.zoom)) {
              setSelectedElementId(el.id)
              found = true
              break
            }
          }
        }
        if (!found) setSelectedElementId(null)
        return
      }

      if (tool === "eraser") {
        pushHistory()
        const filtered = elementsRef.current.filter((el) => {
          if (el.type === "pen" || el.type === "highlighter") {
            return !isPointNearStroke(point, el.points, 12 / camera.zoom)
          }
          return !isPointInShape(point, el.x, el.y, el.width, el.height, 8 / camera.zoom)
        })
        updateElements(filtered)
        setIsDrawing(true)
        return
      }

      if (tool === "text") {
        pushHistory()
        const newText: WhiteboardElement = {
          id: uuid(),
          type: "text",
          points: [],
          style: { ...style },
          x: point.x,
          y: point.y,
          width: 200,
          height: 30,
          rotation: 0,
          content: "",
          createdBy: userId,
          createdAt: Date.now(),
        }
        updateElements([...elementsRef.current, newText])
        setEditingTextId(newText.id)
        return
      }

      if (tool === "sticky") {
        pushHistory()
        const newSticky: WhiteboardElement = {
          id: uuid(),
          type: "sticky",
          points: [],
          style: { ...style },
          x: point.x - 100,
          y: point.y - 100,
          width: 200,
          height: 200,
          rotation: 0,
          content: "",
          stickyColor: "#fff3bf",
          createdBy: userId,
          createdAt: Date.now(),
        }
        updateElements([...elementsRef.current, newSticky])
        setEditingTextId(newSticky.id)
        return
      }

      // Drawing tools (pen, highlighter, shapes)
      pushHistory()
      setIsDrawing(true)
      currentStroke.current = [{ ...point, pressure }]
      shapeStart.current = point

      if (tool === "pen" || tool === "highlighter") {
        const pathData =
          tool === "highlighter"
            ? getHighlighterPath([{ ...point, pressure }], style.size)
            : getSvgPathFromPoints([{ ...point, pressure }], { size: style.size })

        const newEl: WhiteboardElement = {
          id: uuid(),
          type: tool,
          points: [{ ...point, pressure }],
          style: {
            ...style,
            opacity: tool === "highlighter" ? 0.4 : style.opacity,
          },
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          rotation: 0,
          pathData,
          createdBy: userId,
          createdAt: Date.now(),
        }
        updateElements([...elementsRef.current, newEl])
      }
    },
    [tool, camera.zoom, style, screenToCanvas, pushHistory, updateElements, userId]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (isPanning.current) {
        const dx = e.clientX - lastPanPoint.current.x
        const dy = e.clientY - lastPanPoint.current.y
        lastPanPoint.current = { x: e.clientX, y: e.clientY }
        setCamera((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
        return
      }

      if (!isDrawing) return

      const point = screenToCanvas(e.clientX, e.clientY)
      const pressure = e.pressure || 0.5

      if (tool === "eraser") {
        const filtered = elementsRef.current.filter((el) => {
          if (el.type === "pen" || el.type === "highlighter") {
            return !isPointNearStroke(point, el.points, 12 / camera.zoom)
          }
          return !isPointInShape(point, el.x, el.y, el.width, el.height, 8 / camera.zoom)
        })
        updateElements(filtered)
        return
      }

      if (tool === "pen" || tool === "highlighter") {
        currentStroke.current.push({ ...point, pressure })
        const updated = [...elementsRef.current]
        const last = updated[updated.length - 1]
        if (last && (last.type === "pen" || last.type === "highlighter")) {
          last.points = [...currentStroke.current]
          last.pathData =
            tool === "highlighter"
              ? getHighlighterPath(last.points, style.size)
              : getSvgPathFromPoints(last.points, { size: style.size })
        }
        updateElements(updated)
        return
      }

      // Shape tools
      if (["rectangle", "circle", "line", "arrow"].includes(tool)) {
        const dx = point.x - shapeStart.current.x
        const dy = point.y - shapeStart.current.y

        const updated = [...elementsRef.current]
        const last = updated[updated.length - 1]
        if (last && last.type === tool) {
          last.width = dx
          last.height = dy
          updateElements(updated)
        } else {
          const newShape: WhiteboardElement = {
            id: uuid(),
            type: tool as ToolType,
            points: [],
            style: { ...style },
            x: shapeStart.current.x,
            y: shapeStart.current.y,
            width: dx,
            height: dy,
            rotation: 0,
            createdBy: userId,
            createdAt: Date.now(),
          }
          updateElements([...elementsRef.current, newShape])
        }
      }
    },
    [isDrawing, tool, camera.zoom, style, screenToCanvas, updateElements, userId]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (canvas) canvas.releasePointerCapture(e.pointerId)

      isPanning.current = false
      setIsDrawing(false)
      currentStroke.current = []
    },
    []
  )

  // ─── Wheel → Zoom ──────────────────────────────────────

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        // Pinch zoom
        const delta = -e.deltaY * 0.005
        setCamera((prev) => {
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * (1 + delta)))
          // Zoom toward cursor
          const rect = canvasRef.current?.getBoundingClientRect()
          if (!rect) return { ...prev, zoom: newZoom }
          const cx = e.clientX - rect.left
          const cy = e.clientY - rect.top
          const scale = newZoom / prev.zoom
          return {
            x: cx - (cx - prev.x) * scale,
            y: cy - (cy - prev.y) * scale,
            zoom: newZoom,
          }
        })
      } else {
        // Pan
        setCamera((prev) => ({
          ...prev,
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }))
      }
    },
    []
  )

  // Attach wheel listener (need passive: false for preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener("wheel", handleWheel, { passive: false })
    return () => canvas.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  // ─── Keyboard Shortcuts ─────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return

      const key = e.key.toLowerCase()
      const mod = e.metaKey || e.ctrlKey

      if (mod && key === "z" && !e.shiftKey) { e.preventDefault(); undo() }
      if (mod && key === "z" && e.shiftKey) { e.preventDefault(); redo() }
      if (mod && key === "y") { e.preventDefault(); redo() }

      if (!mod && !e.shiftKey) {
        switch (key) {
          case "v": setTool("select"); break
          case "p": setTool("pen"); break
          case "h": setTool("highlighter"); break
          case "e": setTool("eraser"); break
          case "r": setTool("rectangle"); break
          case "c": setTool("circle"); break
          case "l": setTool("line"); break
          case "a": setTool("arrow"); break
          case "t": setTool("text"); break
          case "s": setTool("sticky"); break
          case "delete":
          case "backspace":
            if (selectedElementId) {
              pushHistory()
              updateElements(elementsRef.current.filter((el) => el.id !== selectedElementId))
              setSelectedElementId(null)
            }
            break
        }
      }

      // Zoom shortcuts
      if (mod && (key === "=" || key === "+")) {
        e.preventDefault()
        setCamera((prev) => ({ ...prev, zoom: Math.min(MAX_ZOOM, prev.zoom * 1.2) }))
      }
      if (mod && key === "-") {
        e.preventDefault()
        setCamera((prev) => ({ ...prev, zoom: Math.max(MIN_ZOOM, prev.zoom / 1.2) }))
      }
      if (mod && key === "0") {
        e.preventDefault()
        setCamera({ x: 0, y: 0, zoom: 1 })
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [undo, redo, selectedElementId, pushHistory, updateElements])

  // ─── Canvas Rendering ───────────────────────────────────

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = bgColor
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Draw background pattern
    ctx.save()
    ctx.translate(camera.x, camera.y)
    ctx.scale(camera.zoom, camera.zoom)
    drawBackground(ctx, background, bgColor, rect.width / camera.zoom, rect.height / camera.zoom, camera)
    ctx.restore()

    // Draw elements
    ctx.save()
    ctx.translate(camera.x, camera.y)
    ctx.scale(camera.zoom, camera.zoom)

    for (const el of elementsRef.current) {
      ctx.save()
      ctx.globalAlpha = el.style.opacity

      if ((el.type === "pen" || el.type === "highlighter") && el.pathData) {
        const path = new Path2D(el.pathData)
        ctx.fillStyle = el.style.color
        ctx.fill(path)
      } else if (el.type === "rectangle") {
        ctx.strokeStyle = el.style.color
        ctx.lineWidth = el.style.size
        ctx.strokeRect(el.x, el.y, el.width, el.height)
      } else if (el.type === "circle") {
        ctx.strokeStyle = el.style.color
        ctx.lineWidth = el.style.size
        ctx.beginPath()
        ctx.ellipse(
          el.x + el.width / 2,
          el.y + el.height / 2,
          Math.abs(el.width) / 2,
          Math.abs(el.height) / 2,
          0, 0, Math.PI * 2
        )
        ctx.stroke()
      } else if (el.type === "line" || el.type === "arrow") {
        ctx.strokeStyle = el.style.color
        ctx.lineWidth = el.style.size
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(el.x, el.y)
        ctx.lineTo(el.x + el.width, el.y + el.height)
        ctx.stroke()

        if (el.type === "arrow") {
          const angle = Math.atan2(el.height, el.width)
          const headLen = 16
          ctx.beginPath()
          ctx.moveTo(el.x + el.width, el.y + el.height)
          ctx.lineTo(
            el.x + el.width - headLen * Math.cos(angle - Math.PI / 6),
            el.y + el.height - headLen * Math.sin(angle - Math.PI / 6)
          )
          ctx.moveTo(el.x + el.width, el.y + el.height)
          ctx.lineTo(
            el.x + el.width - headLen * Math.cos(angle + Math.PI / 6),
            el.y + el.height - headLen * Math.sin(angle + Math.PI / 6)
          )
          ctx.stroke()
        }
      } else if (el.type === "text" && el.content) {
        ctx.fillStyle = el.style.color
        ctx.font = "18px Inter, sans-serif"
        ctx.fillText(el.content, el.x, el.y + 20)
      } else if (el.type === "sticky") {
        // Sticky background
        ctx.fillStyle = el.stickyColor || "#fff3bf"
        const w = el.width || 200
        const h = el.height || 200
        ctx.beginPath()
        ctx.roundRect(el.x, el.y, w, h, 8)
        ctx.fill()
        ctx.strokeStyle = "rgba(0,0,0,0.08)"
        ctx.lineWidth = 1
        ctx.stroke()

        // Sticky text
        if (el.content) {
          ctx.fillStyle = "#1a1a1a"
          ctx.font = "14px Inter, sans-serif"
          const lines = wrapText(ctx, el.content, w - 32)
          lines.forEach((line, i) => {
            ctx.fillText(line, el.x + 16, el.y + 28 + i * 20)
          })
        }
      }

      // Selection highlight
      if (el.id === selectedElementId) {
        ctx.strokeStyle = "#1971c2"
        ctx.lineWidth = 2 / camera.zoom
        ctx.setLineDash([6 / camera.zoom, 4 / camera.zoom])
        if (el.type === "pen" || el.type === "highlighter") {
          // Draw bounding box of stroke points
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
          for (const p of el.points) {
            minX = Math.min(minX, p.x)
            minY = Math.min(minY, p.y)
            maxX = Math.max(maxX, p.x)
            maxY = Math.max(maxY, p.y)
          }
          ctx.strokeRect(minX - 4, minY - 4, maxX - minX + 8, maxY - minY + 8)
        } else {
          ctx.strokeRect(el.x - 4, el.y - 4, (el.width || 200) + 8, (el.height || 200) + 8)
        }
        ctx.setLineDash([])
      }

      ctx.restore()
    }

    ctx.restore()
  }, [camera, bgColor, background, selectedElementId])

  // Render loop
  useEffect(() => {
    let frameId: number
    const loop = () => {
      render()
      frameId = requestAnimationFrame(loop)
    }
    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [render])

  // ─── Add elements programmatically ──────────────────────

  const addText = useCallback(
    (x: number, y: number, content: string) => {
      pushHistory()
      const el: WhiteboardElement = {
        id: uuid(),
        type: "text",
        points: [],
        style: { ...style },
        x, y, width: 200, height: 30, rotation: 0,
        content,
        createdBy: userId,
        createdAt: Date.now(),
      }
      updateElements([...elementsRef.current, el])
    },
    [style, userId, pushHistory, updateElements]
  )

  const addSticky = useCallback(
    (x: number, y: number, color: string = "#fff3bf") => {
      pushHistory()
      const el: WhiteboardElement = {
        id: uuid(),
        type: "sticky",
        points: [],
        style: { ...style },
        x, y, width: 200, height: 200, rotation: 0,
        content: "",
        stickyColor: color,
        createdBy: userId,
        createdAt: Date.now(),
      }
      updateElements([...elementsRef.current, el])
      setEditingTextId(el.id)
    },
    [style, userId, pushHistory, updateElements]
  )

  const deleteSelected = useCallback(() => {
    if (!selectedElementId) return
    pushHistory()
    updateElements(elementsRef.current.filter((el) => el.id !== selectedElementId))
    setSelectedElementId(null)
  }, [selectedElementId, pushHistory, updateElements])

  const clearAll = useCallback(() => {
    pushHistory()
    updateElements([])
  }, [pushHistory, updateElements])

  const zoomIn = useCallback(() => {
    setCamera((prev) => ({ ...prev, zoom: Math.min(MAX_ZOOM, prev.zoom * 1.25) }))
  }, [])

  const zoomOut = useCallback(() => {
    setCamera((prev) => ({ ...prev, zoom: Math.max(MIN_ZOOM, prev.zoom / 1.25) }))
  }, [])

  const resetZoom = useCallback(() => {
    setCamera({ x: 0, y: 0, zoom: 1 })
  }, [])

  const updateTextContent = useCallback(
    (elementId: string, content: string) => {
      const updated = elementsRef.current.map((el) =>
        el.id === elementId ? { ...el, content } : el
      )
      updateElements(updated)
    },
    [updateElements]
  )

  return {
    canvasRef,
    elements,
    setElements: updateElements,
    tool,
    setTool,
    camera,
    setCamera,
    style,
    setStyle,
    background,
    setBackground,
    bgColor,
    setBgColor,
    isDrawing,
    selectedElementId,
    setSelectedElementId,
    editingTextId,
    setEditingTextId,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    undo,
    redo,
    addText,
    addSticky,
    deleteSelected,
    clearAll,
    zoomIn,
    zoomOut,
    resetZoom,
    updateTextContent,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  }
}

// ─── Helpers ──────────────────────────────────────────────

function drawBackground(
  ctx: CanvasRenderingContext2D,
  type: BackgroundType,
  bgColor: string,
  width: number,
  height: number,
  camera: Camera
) {
  if (type === "plain") return

  const isDark = isColorDark(bgColor)
  const dotColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"
  const spacing = 24

  // Calculate visible area in canvas space
  const startX = Math.floor(-camera.x / camera.zoom / spacing) * spacing - spacing
  const startY = Math.floor(-camera.y / camera.zoom / spacing) * spacing - spacing
  const endX = startX + width + spacing * 2
  const endY = startY + height + spacing * 2

  ctx.fillStyle = dotColor
  ctx.strokeStyle = dotColor

  if (type === "dots") {
    for (let x = startX; x < endX; x += spacing) {
      for (let y = startY; y < endY; y += spacing) {
        ctx.beginPath()
        ctx.arc(x, y, 1.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  } else if (type === "grid") {
    ctx.lineWidth = 0.5
    for (let x = startX; x < endX; x += spacing) {
      ctx.beginPath()
      ctx.moveTo(x, startY)
      ctx.lineTo(x, endY)
      ctx.stroke()
    }
    for (let y = startY; y < endY; y += spacing) {
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }
  } else if (type === "lined") {
    ctx.lineWidth = 0.5
    for (let y = startY; y < endY; y += spacing) {
      ctx.beginPath()
      ctx.moveTo(startX, y)
      ctx.lineTo(endX, y)
      ctx.stroke()
    }
  }
}

function isColorDark(hex: string): boolean {
  const c = hex.replace("#", "")
  const r = parseInt(c.substring(0, 2), 16)
  const g = parseInt(c.substring(2, 4), 16)
  const b = parseInt(c.substring(4, 6), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)
  return lines.slice(0, 8) // Max 8 lines for sticky
}
