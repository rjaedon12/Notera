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
import { getSvgPathFromPoints, getHighlighterPath, isPointNearStroke, erasePointsFromStroke, isPointInShape } from "@/lib/whiteboard/stroke-engine"
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
  // Callback ref: called synchronously when <canvas> mounts/unmounts
  const canvasCallbackRef = useCallback((node: HTMLCanvasElement | null) => {
    (canvasRef as React.MutableRefObject<HTMLCanvasElement | null>).current = node
    setCanvasReady(!!node)
  }, [])
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
  const activeShapeId = useRef<string | null>(null)
  const [canvasReady, setCanvasReady] = useState(false)

  // Select/move drag state
  const isDragging = useRef(false)
  const dragStartCanvas = useRef<Point>({ x: 0, y: 0 })
  const dragOriginalPos = useRef<{ x: number; y: number; points: Point[] }>({ x: 0, y: 0, points: [] })

  // Image cache for rendering
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map())

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

  // ─── Image upload helper ────────────────────────────────

  const addImage = useCallback(
    (dataUrl: string, x: number, y: number, width: number, height: number) => {
      pushHistory()
      const el: WhiteboardElement = {
        id: uuid(),
        type: "image",
        points: [],
        style: { ...style },
        x,
        y,
        width,
        height,
        rotation: 0,
        imageSrc: dataUrl,
        createdBy: userId,
        createdAt: Date.now(),
      }
      updateElements([...elementsRef.current, el])
    },
    [style, userId, pushHistory, updateElements]
  )

  // ─── Pointer Handlers ──────────────────────────────────

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      // Only capture pointer for tools that need drag tracking.
      // Skip for text/sticky/image so native focus & input handling works.
      const skipCapture = tool === "text" || tool === "sticky" || tool === "image"
      if (!skipCapture) {
        canvas.setPointerCapture(e.pointerId)
      }

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
          let hit = false
          if (el.type === "pen" || el.type === "highlighter") {
            hit = isPointNearStroke(point, el.points, 12 / camera.zoom)
          } else {
            hit = isPointInShape(point, el.x, el.y, el.width, el.height, 8 / camera.zoom)
          }
          if (hit) {
            setSelectedElementId(el.id)
            found = true
            // Begin drag
            isDragging.current = true
            dragStartCanvas.current = point
            dragOriginalPos.current = {
              x: el.x,
              y: el.y,
              points: el.points.map(p => ({ ...p })),
            }
            pushHistory()
            break
          }
        }
        if (!found) {
          setSelectedElementId(null)
          isDragging.current = false
        }
        return
      }

      if (tool === "eraser") {
        pushHistory()
        // Precise eraser: split strokes, remove shapes only on direct hit
        const eraserRadius = (style.size + 4) / camera.zoom
        const newElements: WhiteboardElement[] = []
        for (const el of elementsRef.current) {
          if (el.type === "pen" || el.type === "highlighter") {
            if (isPointNearStroke(point, el.points, eraserRadius)) {
              // Split the stroke at the erased points
              const segments = erasePointsFromStroke(point, el.points, eraserRadius)
              for (const seg of segments) {
                const pathData = el.type === "highlighter"
                  ? getHighlighterPath(seg, el.style.size)
                  : getSvgPathFromPoints(seg, { size: el.style.size })
                newElements.push({
                  ...el,
                  id: uuid(),
                  points: seg,
                  pathData,
                })
              }
            } else {
              newElements.push(el)
            }
          } else {
            // For shapes/text/sticky/images: only remove if directly hit
            if (isPointInShape(point, el.x, el.y, el.width, el.height, 4 / camera.zoom)) {
              // Skip - erased
            } else {
              newElements.push(el)
            }
          }
        }
        updateElements(newElements)
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

      if (tool === "image") {
        // Trigger file upload dialog
        const input = document.createElement("input")
        input.type = "file"
        input.accept = "image/*"
        input.onchange = (ev) => {
          const file = (ev.target as HTMLInputElement).files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = (loadEv) => {
            const dataUrl = loadEv.target?.result as string
            const img = new Image()
            img.onload = () => {
              // Scale to fit max 400px wide/tall
              let w = img.width
              let h = img.height
              const maxDim = 400
              if (w > maxDim || h > maxDim) {
                const scale = maxDim / Math.max(w, h)
                w = w * scale
                h = h * scale
              }
              addImage(dataUrl, point.x - w / 2, point.y - h / 2, w, h)
            }
            img.src = dataUrl
          }
          reader.readAsDataURL(file)
        }
        input.click()
        return
      }

      // Drawing tools (pen, highlighter, shapes)
      pushHistory()
      setIsDrawing(true)
      currentStroke.current = [{ ...point, pressure }]
      shapeStart.current = point
      activeShapeId.current = null

      // Create shape element immediately (like pen/highlighter) so each new
      // shape gets its own element and doesn't overwrite previous ones.
      if (["rectangle", "circle", "line", "arrow"].includes(tool)) {
        const newShapeId = uuid()
        activeShapeId.current = newShapeId
        const newShape: WhiteboardElement = {
          id: newShapeId,
          type: tool as ToolType,
          points: [],
          style: { ...style },
          x: point.x,
          y: point.y,
          width: 0,
          height: 0,
          rotation: 0,
          createdBy: userId,
          createdAt: Date.now(),
        }
        updateElements([...elementsRef.current, newShape])
      }

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
    [tool, camera.zoom, style, screenToCanvas, pushHistory, updateElements, userId, addImage]
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

      // Select + drag to move
      if (tool === "select" && isDragging.current && selectedElementId) {
        const point = screenToCanvas(e.clientX, e.clientY)
        const dx = point.x - dragStartCanvas.current.x
        const dy = point.y - dragStartCanvas.current.y

        const updated = elementsRef.current.map((el) => {
          if (el.id !== selectedElementId) return el
          if (el.type === "pen" || el.type === "highlighter") {
            // Move all points
            const movedPoints = dragOriginalPos.current.points.map(p => ({
              ...p,
              x: p.x + dx,
              y: p.y + dy,
            }))
            const pathData = el.type === "highlighter"
              ? getHighlighterPath(movedPoints, el.style.size)
              : getSvgPathFromPoints(movedPoints, { size: el.style.size })
            return {
              ...el,
              x: dragOriginalPos.current.x + dx,
              y: dragOriginalPos.current.y + dy,
              points: movedPoints,
              pathData,
            }
          } else {
            return {
              ...el,
              x: dragOriginalPos.current.x + dx,
              y: dragOriginalPos.current.y + dy,
            }
          }
        })
        updateElements(updated)
        return
      }

      if (!isDrawing) return

      const point = screenToCanvas(e.clientX, e.clientY)
      const pressure = e.pressure || 0.5

      if (tool === "eraser") {
        // Precise eraser on move: split strokes, remove shapes on direct hit only
        const eraserRadius = (style.size + 4) / camera.zoom
        const newElements: WhiteboardElement[] = []
        for (const el of elementsRef.current) {
          if (el.type === "pen" || el.type === "highlighter") {
            if (isPointNearStroke(point, el.points, eraserRadius)) {
              const segments = erasePointsFromStroke(point, el.points, eraserRadius)
              for (const seg of segments) {
                const pathData = el.type === "highlighter"
                  ? getHighlighterPath(seg, el.style.size)
                  : getSvgPathFromPoints(seg, { size: el.style.size })
                newElements.push({
                  ...el,
                  id: uuid(),
                  points: seg,
                  pathData,
                })
              }
            } else {
              newElements.push(el)
            }
          } else {
            if (isPointInShape(point, el.x, el.y, el.width, el.height, 4 / camera.zoom)) {
              // Skip - erased
            } else {
              newElements.push(el)
            }
          }
        }
        updateElements(newElements)
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

      // Shape tools — find by tracked activeShapeId (immutable update)
      if (["rectangle", "circle", "line", "arrow"].includes(tool) && activeShapeId.current) {
        const dx = point.x - shapeStart.current.x
        const dy = point.y - shapeStart.current.y
        const sid = activeShapeId.current

        const updated = elementsRef.current.map((el) =>
          el.id === sid ? { ...el, width: dx, height: dy } : el
        )
        updateElements(updated)
      }
    },
    [isDrawing, tool, camera.zoom, style, screenToCanvas, updateElements, userId, selectedElementId]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (canvas) canvas.releasePointerCapture(e.pointerId)

      isPanning.current = false
      isDragging.current = false
      setIsDrawing(false)
      currentStroke.current = []
      activeShapeId.current = null
    },
    []
  )

  // ─── Double-click to re-edit text/sticky elements ─────────

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const point = screenToCanvas(e.clientX, e.clientY)
      // Hit-test in reverse (top-most first)
      for (let i = elementsRef.current.length - 1; i >= 0; i--) {
        const el = elementsRef.current[i]
        if (el.type === "text" || el.type === "sticky") {
          if (isPointInShape(point, el.x, el.y, el.width || 200, el.height || 200, 8 / camera.zoom)) {
            setEditingTextId(el.id)
            setSelectedElementId(el.id)
            return
          }
        }
      }
    },
    [screenToCanvas, camera.zoom]
  )

  // ─── Wheel → Zoom (supports trackpad pinch + scroll pan) ─

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault()

      if (e.ctrlKey || e.metaKey) {
        // Pinch-to-zoom on trackpad (or Ctrl+scroll)
        const delta = -e.deltaY * 0.01
        setCamera((prev) => {
          const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * (1 + delta)))
          // Zoom toward cursor position
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
        // Two-finger pan on trackpad — damped to prevent overshooting
        const dampening = 0.6
        const maxDelta = 50
        const dx = Math.max(-maxDelta, Math.min(maxDelta, e.deltaX)) * dampening
        const dy = Math.max(-maxDelta, Math.min(maxDelta, e.deltaY)) * dampening
        setCamera((prev) => ({
          ...prev,
          x: prev.x - dx,
          y: prev.y - dy,
        }))
      }
    },
    []
  )

  // ─── Touch gesture zoom (for mobile/tablet pinch) ───────

  const lastTouchDistance = useRef<number | null>(null)
  const lastTouchCenter = useRef<Point | null>(null)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      lastTouchDistance.current = dist
      lastTouchCenter.current = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      }
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      e.preventDefault()
      const t1 = e.touches[0]
      const t2 = e.touches[1]
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
      const center = {
        x: (t1.clientX + t2.clientX) / 2,
        y: (t1.clientY + t2.clientY) / 2,
      }

      const scaleFactor = dist / lastTouchDistance.current

      setCamera((prev) => {
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev.zoom * scaleFactor))
        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return { ...prev, zoom: newZoom }
        const cx = center.x - rect.left
        const cy = center.y - rect.top
        const scale = newZoom / prev.zoom

        // Also pan with the center movement
        const panDx = lastTouchCenter.current ? center.x - lastTouchCenter.current.x : 0
        const panDy = lastTouchCenter.current ? center.y - lastTouchCenter.current.y : 0

        return {
          x: cx - (cx - prev.x) * scale + panDx,
          y: cy - (cy - prev.y) * scale + panDy,
          zoom: newZoom,
        }
      })

      lastTouchDistance.current = dist
      lastTouchCenter.current = center
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      lastTouchDistance.current = null
      lastTouchCenter.current = null
    }
  }, [])

  // Attach wheel + touch listeners (need passive: false for preventDefault)
  // canvasReady in deps ensures this re-runs when the <canvas> element actually mounts
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.addEventListener("wheel", handleWheel, { passive: false })
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false })
    return () => {
      canvas.removeEventListener("wheel", handleWheel)
      canvas.removeEventListener("touchstart", handleTouchStart)
      canvas.removeEventListener("touchmove", handleTouchMove)
      canvas.removeEventListener("touchend", handleTouchEnd)
    }
  }, [handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd, canvasReady])

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
          case "i": setTool("image"); break
          case "escape":
            setSelectedElementId(null)
            setEditingTextId(null)
            break
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
      } else if (el.type === "text") {
        if (el.content) {
          // Only draw canvas text when NOT actively editing this element
          // (the overlay textarea handles display during editing)
          if (el.id !== editingTextId) {
            ctx.fillStyle = el.style.color
            ctx.font = "18px Inter, sans-serif"
            ctx.fillText(el.content, el.x, el.y + 20)
          }
        } else if (el.id !== editingTextId) {
          // Placeholder for empty text elements
          ctx.fillStyle = "rgba(0,0,0,0.25)"
          ctx.font = "18px Inter, sans-serif"
          ctx.fillText("Type...", el.x, el.y + 20)
          // Dashed bounding box so user sees where to double-click
          ctx.strokeStyle = "rgba(0,0,0,0.15)"
          ctx.lineWidth = 1
          ctx.setLineDash([4, 3])
          ctx.strokeRect(el.x - 2, el.y - 2, (el.width || 200) + 4, (el.height || 30) + 4)
          ctx.setLineDash([])
        }
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

        // Sticky text — skip canvas rendering while textarea overlay is active
        if (el.content && el.id !== editingTextId) {
          ctx.fillStyle = "#1a1a1a"
          ctx.font = "14px Inter, sans-serif"
          const lines = wrapText(ctx, el.content, w - 32)
          lines.forEach((line: string, i: number) => {
            ctx.fillText(line, el.x + 16, el.y + 28 + i * 20)
          })
        }

        // Show placeholder when empty and not editing
        if (!el.content && el.id !== editingTextId) {
          ctx.fillStyle = "rgba(0,0,0,0.25)"
          ctx.font = "14px Inter, sans-serif"
          ctx.fillText("Click to type...", el.x + 16, el.y + 28)
        }
      } else if (el.type === "image" && el.imageSrc) {
        // Draw image element
        let img = imageCache.current.get(el.imageSrc)
        if (!img) {
          img = new Image()
          img.src = el.imageSrc
          imageCache.current.set(el.imageSrc, img)
        }
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, el.x, el.y, el.width, el.height)
        } else {
          // Placeholder while loading
          ctx.fillStyle = "rgba(0,0,0,0.05)"
          ctx.fillRect(el.x, el.y, el.width, el.height)
          ctx.strokeStyle = "rgba(0,0,0,0.15)"
          ctx.lineWidth = 1
          ctx.strokeRect(el.x, el.y, el.width, el.height)
          ctx.fillStyle = "rgba(0,0,0,0.3)"
          ctx.font = "14px Inter, sans-serif"
          ctx.textAlign = "center"
          ctx.fillText("Loading...", el.x + el.width / 2, el.y + el.height / 2)
          ctx.textAlign = "start"
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
  }, [camera, bgColor, background, selectedElementId, editingTextId])

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
    canvasCallbackRef,
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
    handleDoubleClick,
    undo,
    redo,
    addText,
    addSticky,
    addImage,
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
    // If a single word exceeds maxWidth, break it character-by-character
    if (ctx.measureText(word).width > maxWidth) {
      for (const char of word) {
        const testChar = currentLine ? `${currentLine}${char}` : char
        if (ctx.measureText(testChar).width > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = char
        } else {
          currentLine = testChar
        }
      }
      continue
    }
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
