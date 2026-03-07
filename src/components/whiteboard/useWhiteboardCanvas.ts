"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useRef, useEffect, useCallback, useState, type RefObject } from "react"
import type { BackgroundType, ToolType, StyleState, DashStyle } from "@/lib/whiteboard/types"
import { STICKY_COLORS } from "@/lib/whiteboard/types"

let fabricModule: any = null

async function getFabric(): Promise<any> {
  if (fabricModule) return fabricModule
  fabricModule = await import("fabric")
  return fabricModule
}

function getFabricSync(): any {
  if (!fabricModule) throw new Error("fabric not loaded yet")
  return fabricModule
}

function hexToRgba(hex: string, alpha: number): string {
  if (!hex || hex.length < 7) return `rgba(0,0,0,${alpha})`
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function getDashArray(dashStyle: DashStyle, width: number): number[] | undefined {
  if (dashStyle === "dashed") return [width * 3, width * 2]
  if (dashStyle === "dotted") return [width, width * 2]
  return undefined
}

function drawCanvasBackground(
  canvas: HTMLCanvasElement, bg: BackgroundType, customColor: string,
  vpt: number[], isDark: boolean,
) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const w = canvas.width, h = canvas.height
  let bgColor = isDark ? "#1a1a2e" : "#ffffff"
  if (bg === "plain-dark") bgColor = "#1a1a2e"
  if (bg === "plain") bgColor = isDark ? "#1a1a2e" : "#ffffff"
  if (customColor && customColor !== "#ffffff" && customColor !== "transparent") bgColor = customColor
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, w, h)
  if (bg === "plain" || bg === "plain-dark") return
  const zoom = vpt[0] || 1, panX = vpt[4] || 0, panY = vpt[5] || 0
  const dotColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"
  const lineColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"
  ctx.save()
  if (bg === "dots") {
    const sp = 25, sz = sp * zoom
    const offX = (panX % sz + sz) % sz, offY = (panY % sz + sz) % sz
    ctx.fillStyle = dotColor
    for (let x = offX; x < w; x += sz) for (let y = offY; y < h; y += sz) {
      ctx.beginPath(); ctx.arc(x, y, Math.max(1, 1.5 * zoom), 0, Math.PI * 2); ctx.fill()
    }
  } else if (bg === "grid") {
    const sp = 30, sz = sp * zoom
    const offX = (panX % sz + sz) % sz, offY = (panY % sz + sz) % sz
    ctx.strokeStyle = lineColor; ctx.lineWidth = 1; ctx.beginPath()
    for (let x = offX; x < w; x += sz) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
    for (let y = offY; y < h; y += sz) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
    ctx.stroke()
  } else if (bg === "lined") {
    const sp = 30, sz = sp * zoom
    const offY = (panY % sz + sz) % sz
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.1)"
    ctx.lineWidth = 1; ctx.beginPath()
    for (let y = offY; y < h; y += sz) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
    ctx.stroke()
  } else if (bg === "isometric") {
    const sp = 30, sz = sp * zoom; ctx.strokeStyle = lineColor; ctx.lineWidth = 0.5
    const offY = (panY % sz + sz) % sz, offX = (panX % sz + sz) % sz
    ctx.beginPath()
    for (let y = offY - h; y < h * 2; y += sz) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
    ctx.stroke(); ctx.beginPath()
    const dx2 = Math.cos(Math.PI / 3) * h * 2, dy2 = Math.sin(Math.PI / 3) * h * 2
    for (let x = offX - w; x < w * 2; x += sz) {
      ctx.moveTo(x, 0); ctx.lineTo(x + dx2, dy2); ctx.moveTo(x, 0); ctx.lineTo(x - dx2, dy2)
    }
    ctx.stroke()
  } else if (bg === "crosshatch") {
    const sp = 20, sz = sp * zoom
    const offX = (panX % sz + sz) % sz, offY = (panY % sz + sz) % sz
    ctx.strokeStyle = lineColor; ctx.lineWidth = 0.5; ctx.beginPath()
    for (let x = offX; x < w; x += sz) { ctx.moveTo(x, 0); ctx.lineTo(x, h) }
    for (let y = offY; y < h; y += sz) { ctx.moveTo(0, y); ctx.lineTo(w, y) }
    for (let x = offX - h; x < w + h; x += sz * 2) {
      ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.moveTo(x, 0); ctx.lineTo(x - h, h)
    }
    ctx.stroke()
  }
  ctx.restore()
}

// ============================================================================

interface UseWhiteboardCanvasOptions {
  canvasContainerRef: RefObject<HTMLDivElement | null>
  tool: ToolType
  style: StyleState
  background: BackgroundType
  customBgColor: string
  isDark: boolean
  onObjectSelected: (obj: any) => void
  onCanvasReady: (canvas: any) => void
  onModified: () => void
}

export function useWhiteboardCanvas({
  canvasContainerRef, tool, style, background, customBgColor, isDark,
  onObjectSelected, onCanvasReady, onModified,
}: UseWhiteboardCanvasOptions) {
  const canvasRef = useRef<any>(null)
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const laserPointsRef = useRef<{ x: number; y: number; time: number }[]>([])
  const laserIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isPanningRef = useRef(false)
  const lastPanPointRef = useRef<{ x: number; y: number } | null>(null)
  const spaceDownRef = useRef(false)
  const undoStackRef = useRef<string[]>([])
  const redoStackRef = useRef<string[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const pushState = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    undoStackRef.current.push(JSON.stringify(c.toJSON()))
    if (undoStackRef.current.length > 120) undoStackRef.current.shift()
    redoStackRef.current = []; setCanUndo(true); setCanRedo(false)
  }, [])

  const undo = useCallback(() => {
    const c = canvasRef.current; if (!c || undoStackRef.current.length === 0) return
    redoStackRef.current.push(JSON.stringify(c.toJSON()))
    const prev = undoStackRef.current.pop()!
    c.loadFromJSON(prev).then(() => {
      c.renderAll(); setCanUndo(undoStackRef.current.length > 0); setCanRedo(true); onModified()
    })
  }, [onModified])

  const redo = useCallback(() => {
    const c = canvasRef.current; if (!c || redoStackRef.current.length === 0) return
    undoStackRef.current.push(JSON.stringify(c.toJSON()))
    const next = redoStackRef.current.pop()!
    c.loadFromJSON(next).then(() => {
      c.renderAll(); setCanUndo(true); setCanRedo(redoStackRef.current.length > 0); onModified()
    })
  }, [onModified])

  const drawBg = useCallback(() => {
    const bg2 = bgCanvasRef.current, c = canvasRef.current; if (!bg2 || !c) return
    drawCanvasBackground(bg2, background, customBgColor, c.viewportTransform || [1, 0, 0, 1, 0, 0], isDark)
  }, [background, customBgColor, isDark])

  // Init
  useEffect(() => {
    let mounted = true
    const container = canvasContainerRef.current; if (!container) return
    async function init() {
      const fabric = await getFabric(); if (!mounted || !container) return
      const bgEl = document.createElement("canvas")
      bgEl.className = "absolute inset-0 w-full h-full"; bgEl.style.zIndex = "0"
      container.insertBefore(bgEl, container.firstChild); bgCanvasRef.current = bgEl
      const el = document.createElement("canvas"); el.id = "wb-main-canvas"; el.style.zIndex = "1"
      container.appendChild(el)
      const rect = container.getBoundingClientRect()
      const w = Math.round(rect.width), h = Math.round(rect.height)
      bgEl.width = w; bgEl.height = h
      const canvas = new fabric.Canvas(el, {
        width: w, height: h, backgroundColor: "transparent",
        selection: true, preserveObjectStacking: true, stopContextMenu: true, fireRightClick: true,
      })
      canvasRef.current = canvas
      canvas.on("selection:created", (e: any) => onObjectSelected(e.selected?.[0] || null))
      canvas.on("selection:updated", (e: any) => onObjectSelected(e.selected?.[0] || null))
      canvas.on("selection:cleared", () => onObjectSelected(null))
      canvas.on("object:modified", () => { pushState(); onModified() })
      canvas.on("after:render", () => {
        drawCanvasBackground(bgEl, background, customBgColor, canvas.viewportTransform || [1, 0, 0, 1, 0, 0], isDark)
      })
      canvas.on("mouse:wheel", (opt: any) => {
        const e = opt.e as WheelEvent
        // Trackpad pan: if no ctrl key, treat as pan
        if (!e.ctrlKey && !e.metaKey) {
          const vpt = canvas.viewportTransform!
          vpt[4] -= e.deltaX
          vpt[5] -= e.deltaY
          canvas.requestRenderAll()
          e.preventDefault()
          e.stopPropagation()
          return
        }
        // Ctrl + wheel = zoom (pinch-to-zoom on trackpad)
        const delta = e.deltaY
        let zoom = canvas.getZoom()
        zoom *= 0.999 ** delta; zoom = Math.min(Math.max(zoom, 0.1), 30)
        canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), zoom)
        e.preventDefault(); e.stopPropagation()
      })
      onCanvasReady(canvas)
      const ro = new ResizeObserver(() => {
        if (!container) return
        const r = container.getBoundingClientRect()
        canvas.setDimensions({ width: Math.round(r.width), height: Math.round(r.height) })
        bgEl.width = Math.round(r.width); bgEl.height = Math.round(r.height)
        canvas.renderAll()
      })
      ro.observe(container)
      return () => ro.disconnect()
    }
    init()
    return () => {
      mounted = false
      canvasRef.current?.dispose(); canvasRef.current = null
      bgCanvasRef.current?.remove(); bgCanvasRef.current = null
      if (container) {
        container.querySelector("#wb-main-canvas")?.remove()
        container.querySelector(".canvas-container")?.remove()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { drawBg(); canvasRef.current?.renderAll() }, [background, customBgColor, isDark, drawBg])

  // Tool mode
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    c.isDrawingMode = false; c.selection = false
    c.defaultCursor = "crosshair"; c.hoverCursor = "crosshair"
    c.forEachObject((obj: any) => { obj.selectable = tool === "select"; obj.evented = tool === "select" })
    if (tool === "select") {
      c.selection = true; c.defaultCursor = "default"; c.hoverCursor = "move"
    } else if (tool === "pen" || tool === "highlighter") {
      c.isDrawingMode = true
      try {
        const f = getFabricSync(); const brush = new f.PencilBrush(c)
        brush.color = tool === "highlighter" ? hexToRgba(style.strokeColor, 0.35) : style.strokeColor
        brush.width = tool === "highlighter" ? style.strokeWidth * 4 : style.strokeWidth
        c.freeDrawingBrush = brush
      } catch { /* */ }
    } else if (tool === "eraser") { c.defaultCursor = "cell"; c.hoverCursor = "cell" }
    else if (tool === "pan") { c.defaultCursor = "grab"; c.hoverCursor = "grab" }
    c.renderAll()
  }, [tool, style.strokeColor, style.strokeWidth])

  // Shape drawing
  useEffect(() => {
    const c = canvasRef.current; if (!c) return
    let startX = 0, startY = 0, activeShape: any = null
    const onDown = (opt: any) => {
      if (spaceDownRef.current || tool === "pan") {
        isPanningRef.current = true; lastPanPointRef.current = { x: opt.e.clientX, y: opt.e.clientY }
        c.defaultCursor = "grabbing"; return
      }
      if (["pen", "highlighter", "select"].includes(tool)) return
      const p = c.getScenePoint(opt.e); startX = p.x; startY = p.y; isDrawingRef.current = true
      if (tool === "eraser") {
        const t = c.findTarget(opt.e); if (t) { pushState(); c.remove(t); c.renderAll(); onModified() }; return
      }
      if (tool === "laser") {
        laserPointsRef.current = [{ x: p.x, y: p.y, time: Date.now() }]; startLaser(c); return
      }
      pushState()
      const f = getFabricSync()
      const fillVal = style.fillColor === "transparent" ? "transparent" : hexToRgba(style.fillColor, style.fillOpacity)
      const dashArr = getDashArray(style.dashStyle, style.strokeWidth)
      if (tool === "rect") activeShape = new f.Rect({ left: startX, top: startY, width: 0, height: 0, fill: fillVal, stroke: style.strokeColor, strokeWidth: style.strokeWidth, strokeDashArray: dashArr, originX: "left", originY: "top" })
      else if (tool === "circle") activeShape = new f.Ellipse({ left: startX, top: startY, rx: 0, ry: 0, fill: fillVal, stroke: style.strokeColor, strokeWidth: style.strokeWidth, strokeDashArray: dashArr, originX: "center", originY: "center" })
      else if (tool === "triangle") activeShape = new f.Triangle({ left: startX, top: startY, width: 0, height: 0, fill: fillVal, stroke: style.strokeColor, strokeWidth: style.strokeWidth, strokeDashArray: dashArr, originX: "left", originY: "top" })
      else if (tool === "diamond") activeShape = new f.Rect({ left: startX, top: startY, width: 0, height: 0, fill: fillVal, stroke: style.strokeColor, strokeWidth: style.strokeWidth, strokeDashArray: dashArr, angle: 45, originX: "center", originY: "center" })
      else if (tool === "line") activeShape = new f.Line([startX, startY, startX, startY], { stroke: style.strokeColor, strokeWidth: style.strokeWidth, strokeDashArray: dashArr })
      else if (tool === "arrow" || tool === "connector") activeShape = new f.Line([startX, startY, startX, startY], { stroke: style.strokeColor, strokeWidth: style.strokeWidth, strokeDashArray: dashArr })
      if (activeShape) { c.add(activeShape); c.renderAll() }
    }
    const onMove = (opt: any) => {
      if (isPanningRef.current && lastPanPointRef.current) {
        const vpt = c.viewportTransform!
        vpt[4] += opt.e.clientX - lastPanPointRef.current.x
        vpt[5] += opt.e.clientY - lastPanPointRef.current.y
        c.requestRenderAll(); lastPanPointRef.current = { x: opt.e.clientX, y: opt.e.clientY }; return
      }
      if (!isDrawingRef.current) return
      const p = c.getScenePoint(opt.e)
      if (tool === "laser") { laserPointsRef.current.push({ x: p.x, y: p.y, time: Date.now() }); return }
      if (tool === "eraser") { const t = c.findTarget(opt.e); if (t) { c.remove(t); c.renderAll(); onModified() }; return }
      if (!activeShape) return
      const dx = p.x - startX, dy = p.y - startY
      if (tool === "rect" || tool === "triangle") activeShape.set({ left: dx >= 0 ? startX : p.x, top: dy >= 0 ? startY : p.y, width: Math.abs(dx), height: Math.abs(dy) })
      else if (tool === "circle") activeShape.set({ left: (startX + p.x) / 2, top: (startY + p.y) / 2, rx: Math.abs(dx) / 2, ry: Math.abs(dy) / 2 })
      else if (tool === "diamond") activeShape.set({ left: (startX + p.x) / 2, top: (startY + p.y) / 2, width: Math.abs(dx) * 0.707, height: Math.abs(dy) * 0.707 })
      else if (["line", "arrow", "connector"].includes(tool)) activeShape.set({ x2: p.x, y2: p.y })
      activeShape.setCoords(); c.renderAll()
    }
    const onUp = () => {
      if (isPanningRef.current) { isPanningRef.current = false; lastPanPointRef.current = null; c.defaultCursor = tool === "pan" ? "grab" : "crosshair"; return }
      if (tool === "laser") { isDrawingRef.current = false; return }
      if (!isDrawingRef.current) return; isDrawingRef.current = false
      if ((tool === "arrow" || tool === "connector") && activeShape) {
        try {
          const f = getFabricSync()
          const x1 = activeShape.x1 ?? 0, y1 = activeShape.y1 ?? 0, x2 = activeShape.x2 ?? 0, y2 = activeShape.y2 ?? 0
          const angle = Math.atan2(y2 - y1, x2 - x1), hl = 15
          const head = new f.Polygon([{ x: 0, y: 0 }, { x: -hl, y: hl * 0.4 }, { x: -hl, y: -hl * 0.4 }], {
            left: x2, top: y2, fill: style.strokeColor, stroke: style.strokeColor, strokeWidth: 1,
            angle: (angle * 180) / Math.PI, originX: "left", originY: "center", selectable: false, evented: false,
          })
          c.remove(activeShape); const grp = new f.Group([activeShape, head]); c.add(grp)
        } catch { /* */ }
      }
      activeShape = null; onModified(); c.renderAll()
    }
    const onPath = () => { pushState(); onModified() }
    c.on("mouse:down", onDown); c.on("mouse:move", onMove); c.on("mouse:up", onUp); c.on("path:created", onPath)
    return () => { c.off("mouse:down", onDown); c.off("mouse:move", onMove); c.off("mouse:up", onUp); c.off("path:created", onPath) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, style, pushState, onModified])

  // Space+pan
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.code === "Space" && !e.repeat) { spaceDownRef.current = true; if (canvasRef.current) canvasRef.current.defaultCursor = "grab" } }
    const up = (e: KeyboardEvent) => { if (e.code === "Space") { spaceDownRef.current = false; isPanningRef.current = false; lastPanPointRef.current = null } }
    window.addEventListener("keydown", down); window.addEventListener("keyup", up)
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up) }
  }, [])

  const startLaser = useCallback((canvas: any) => {
    if (laserIntervalRef.current) clearInterval(laserIntervalRef.current)
    let laserLine: any = null
    laserIntervalRef.current = setInterval(() => {
      const now = Date.now()
      laserPointsRef.current = laserPointsRef.current.filter((p) => now - p.time < 1500)
      if (laserLine) canvas.remove(laserLine)
      if (laserPointsRef.current.length > 1) {
        try {
          const f = getFabricSync()
          const pathStr = laserPointsRef.current.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ")
          laserLine = new f.Path(pathStr, { fill: "transparent", stroke: "#ff0000", strokeWidth: 3, opacity: 0.8, selectable: false, evented: false, shadow: new f.Shadow({ color: "rgba(255,0,0,0.6)", blur: 12, offsetX: 0, offsetY: 0 }) })
          canvas.add(laserLine); canvas.renderAll()
        } catch { /* */ }
      }
      if (laserPointsRef.current.length === 0 && !isDrawingRef.current) {
        if (laserIntervalRef.current) { clearInterval(laserIntervalRef.current); laserIntervalRef.current = null }
      }
    }, 30)
  }, [])

  // === Actions ===
  const getCanvas = useCallback(() => canvasRef.current, [])

  const addText = useCallback((text: string, x: number, y: number, opts: Partial<StyleState>) => {
    const c = canvasRef.current; if (!c) return; pushState()
    const f = getFabricSync()
    const t = new f.IText(text, { left: x || c.getWidth() / 2, top: y || c.getHeight() / 2, fontSize: opts.fontSize || style.fontSize, fontFamily: opts.fontFamily || style.fontFamily, fill: opts.strokeColor || style.strokeColor, fontWeight: opts.fontBold ? "bold" : "normal", fontStyle: opts.fontItalic ? "italic" : "normal", underline: opts.fontUnderline || false, textAlign: opts.textAlign || "left", originX: "center", originY: "center", editable: true })
    c.add(t); c.setActiveObject(t)
    // Enter editing mode immediately so user can type
    t.enterEditing(); t.selectAll()
    c.renderAll(); onModified()
  }, [pushState, style, onModified])

  const addSticky = useCallback((text: string, x: number, y: number, color: string) => {
    const c = canvasRef.current; if (!c) return; pushState()
    const f = getFabricSync(); const sc = color || STICKY_COLORS[0]; const w2 = 200; const h2 = 200
    const rect = new f.Rect({ width: w2, height: h2, fill: sc, rx: 8, ry: 8, shadow: new f.Shadow({ color: "rgba(0,0,0,0.2)", blur: 8, offsetX: 2, offsetY: 2 }) })
    const txt = new f.IText(text || "Note", { fontSize: 16, fontFamily: "Inter, system-ui, sans-serif", fill: "#1a1a1a", width: w2 - 24, textAlign: "left", left: 12, top: 12 })
    const grp = new f.Group([rect, txt], { left: x || c.getWidth() / 2 - 100, top: y || c.getHeight() / 2 - 100 })
    c.add(grp); c.setActiveObject(grp); c.renderAll(); onModified()
  }, [pushState, onModified])

  const addEquation = useCallback(async (latex: string, x: number, y: number) => {
    const c = canvasRef.current; if (!c) return; pushState()
    const f = getFabricSync()
    try {
      const katex = (await import("katex")).default
      // Render KaTeX to a temporary off-screen div to measure it
      const wrapper = document.createElement("div")
      wrapper.style.cssText = "position:absolute;left:-9999px;top:-9999px;font-size:" + style.fontSize + "px;color:" + style.strokeColor + ";padding:10px;background:transparent;display:inline-block"
      document.body.appendChild(wrapper)
      katex.render(latex, wrapper, { throwOnError: false, displayMode: true })
      const w = wrapper.offsetWidth + 20
      const h = wrapper.offsetHeight + 20
      const html = wrapper.innerHTML
      document.body.removeChild(wrapper)

      // Build SVG with embedded KaTeX HTML via foreignObject
      const svgNS = "http://www.w3.org/2000/svg"
      const svgStr = [
        `<svg xmlns="${svgNS}" width="${w}" height="${h}">`,
        `<foreignObject width="100%" height="100%">`,
        `<div xmlns="http://www.w3.org/1999/xhtml" style="font-size:${style.fontSize}px;color:${style.strokeColor};padding:10px;display:inline-block">`,
        html,
        `</div></foreignObject></svg>`,
      ].join("")

      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.crossOrigin = "anonymous"

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          // Rasterise at 2× for crispness
          const tc = document.createElement("canvas")
          tc.width = img.width * 2; tc.height = img.height * 2
          const ctx = tc.getContext("2d")!
          ctx.scale(2, 2); ctx.drawImage(img, 0, 0)
          URL.revokeObjectURL(url)

          const fi = new f.Image(tc, {
            left: x || c.getWidth() / 2 - img.width / 2,
            top: y || c.getHeight() / 2 - img.height / 2,
            scaleX: 0.5, scaleY: 0.5,
          })
          // Store original latex for re-editing later
          fi.set("data-latex" as any, latex)
          c.add(fi); c.setActiveObject(fi); c.renderAll(); onModified()
          resolve()
        }
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image failed")) }
        img.src = url
      })
    } catch {
      // Fallback: plain italic text
      const t = new f.IText(latex, {
        left: x || c.getWidth() / 2, top: y || c.getHeight() / 2,
        fontSize: style.fontSize, fontFamily: "'Times New Roman', serif",
        fontStyle: "italic", fill: style.strokeColor,
        originX: "center", originY: "center",
      })
      c.add(t); c.setActiveObject(t); c.renderAll(); onModified()
    }
  }, [pushState, style, onModified])

  const addImage = useCallback((dataUrl: string) => {
    const c = canvasRef.current; if (!c) return; pushState()
    const f = getFabricSync(); const img = new Image()
    img.onload = () => {
      const fi = new f.Image(img, { left: c.getWidth() / 2 - img.width / 4, top: c.getHeight() / 2 - img.height / 4, scaleX: 0.5, scaleY: 0.5 })
      c.add(fi); c.setActiveObject(fi); c.renderAll(); onModified()
    }
    img.src = dataUrl
  }, [pushState, onModified])

  const deleteSelected = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    const active = c.getActiveObjects(); if (active.length === 0) return; pushState()
    active.forEach((o: any) => c.remove(o)); c.discardActiveObject(); c.renderAll(); onModified()
  }, [pushState, onModified])

  const duplicateSelected = useCallback(async () => {
    const c = canvasRef.current; if (!c) return
    const active = c.getActiveObject(); if (!active) return; pushState()
    const cloned = await active.clone()
    cloned.set({ left: (cloned.left || 0) + 20, top: (cloned.top || 0) + 20 })
    c.add(cloned); c.setActiveObject(cloned); c.renderAll(); onModified()
  }, [pushState, onModified])

  const selectAll = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    const f = getFabricSync(); c.discardActiveObject()
    const sel = new f.ActiveSelection(c.getObjects(), { canvas: c })
    c.setActiveObject(sel); c.renderAll()
  }, [])

  const groupSelected = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    const a = c.getActiveObject(); if (!a || a.type !== "activeSelection") return; pushState()
    const f = getFabricSync(); const objs = a.getObjects(); c.discardActiveObject()
    const g = new f.Group(objs); c.add(g); c.setActiveObject(g); c.renderAll(); onModified()
  }, [pushState, onModified])

  const ungroupSelected = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    const a = c.getActiveObject(); if (!a || a.type !== "group") return; pushState()
    const items = a.getObjects(); c.remove(a)
    items.forEach((i: any) => c.add(i)); c.renderAll(); onModified()
  }, [pushState, onModified])

  const bringForward = useCallback(() => { const c = canvasRef.current; if (!c) return; const a = c.getActiveObject(); if (!a) return; pushState(); c.bringObjectForward(a); c.renderAll() }, [pushState])
  const sendBackward = useCallback(() => { const c = canvasRef.current; if (!c) return; const a = c.getActiveObject(); if (!a) return; pushState(); c.sendObjectBackwards(a); c.renderAll() }, [pushState])
  const bringToFront = useCallback(() => { const c = canvasRef.current; if (!c) return; const a = c.getActiveObject(); if (!a) return; pushState(); c.bringObjectToFront(a); c.renderAll() }, [pushState])
  const sendToBack = useCallback(() => { const c = canvasRef.current; if (!c) return; const a = c.getActiveObject(); if (!a) return; pushState(); c.sendObjectToBack(a); c.renderAll() }, [pushState])

  const lockObject = useCallback((lock: boolean) => {
    const c = canvasRef.current; if (!c) return; const a = c.getActiveObject(); if (!a) return
    a.set({ lockMovementX: lock, lockMovementY: lock, lockRotation: lock, lockScalingX: lock, lockScalingY: lock, hasControls: !lock })
    c.renderAll()
  }, [])

  const zoomTo = useCallback((level: number) => {
    const c = canvasRef.current; if (!c) return
    const center = c.getCenterPoint(); c.zoomToPoint(center, level); c.renderAll()
  }, [])

  const zoomToFit = useCallback(() => {
    const c = canvasRef.current; if (!c) return
    const objs = c.getObjects()
    if (objs.length === 0) { c.setViewportTransform([1, 0, 0, 1, 0, 0]); c.renderAll(); return }
    const f = getFabricSync()
    const bounds = objs.reduce((acc: any, o: any) => {
      const b = o.getBoundingRect()
      return { minX: Math.min(acc.minX, b.left), minY: Math.min(acc.minY, b.top), maxX: Math.max(acc.maxX, b.left + b.width), maxY: Math.max(acc.maxY, b.top + b.height) }
    }, { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })
    const pad = 60, bw = bounds.maxX - bounds.minX + pad * 2, bh = bounds.maxY - bounds.minY + pad * 2
    const scale = Math.min(c.getWidth() / bw, c.getHeight() / bh, 3)
    c.setViewportTransform([1, 0, 0, 1, 0, 0])
    c.zoomToPoint(new f.Point(c.getWidth() / 2, c.getHeight() / 2), scale)
    const vpt = c.viewportTransform!
    vpt[4] = c.getWidth() / 2 - (bounds.minX + (bounds.maxX - bounds.minX) / 2) * scale
    vpt[5] = c.getHeight() / 2 - (bounds.minY + (bounds.maxY - bounds.minY) / 2) * scale
    c.setViewportTransform(vpt); c.renderAll()
  }, [])

  const resetView = useCallback(() => { const c = canvasRef.current; if (!c) return; c.setViewportTransform([1, 0, 0, 1, 0, 0]); c.renderAll() }, [])
  const getZoom = useCallback(() => canvasRef.current?.getZoom() || 1, [])
  const serializeCanvas = useCallback(() => canvasRef.current ? JSON.stringify(canvasRef.current.toJSON()) : "", [])
  const loadCanvasJSON = useCallback(async (json: string) => { const c = canvasRef.current; if (!c || !json) return; try { await c.loadFromJSON(json); c.renderAll() } catch { /* */ } }, [])
  const getCanvasEl = useCallback((): HTMLCanvasElement | null => canvasRef.current?.toCanvasElement() || null, [])
  const getSVGString = useCallback(() => canvasRef.current?.toSVG() || "", [])
  const getMinimapDataUrl = useCallback(() => { try { const c = canvasRef.current; if (!c) return ""; return c.toCanvasElement(1, { left: 0, top: 0, width: c.getWidth(), height: c.getHeight() }).toDataURL("image/png", 0.3) } catch { return "" } }, [])

  return {
    getCanvas, addText, addSticky, addEquation, addImage,
    deleteSelected, duplicateSelected, selectAll,
    groupSelected, ungroupSelected,
    bringForward, sendBackward, bringToFront, sendToBack,
    lockObject, zoomTo, zoomToFit, resetView, getZoom,
    serializeCanvas, loadCanvasJSON, getCanvasEl, getSVGString,
    getMinimapDataUrl, undo, redo, canUndo, canRedo, pushState,
  }
}
