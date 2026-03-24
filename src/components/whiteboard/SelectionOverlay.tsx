"use client"

import { useRef, useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import type { WhiteboardElement, Camera } from "@/lib/whiteboard/types"
import { COLORS } from "@/lib/whiteboard/types"

interface SelectionOverlayProps {
  element: WhiteboardElement
  camera: Camera
  onResizeStart: () => void
  onResize: (id: string, x: number, y: number, w: number, h: number) => void
  onUpdateColor: (id: string, color: string) => void
  onDelete: () => void
}

type HandleKey = "nw" | "ne" | "se" | "sw"

const HANDLE_PX = 10

/** Get the real bounding box of an element in canvas coords */
function getBBox(el: WhiteboardElement) {
  if (el.type === "pen" || el.type === "highlighter") {
    let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity
    for (const p of el.points) {
      if (p.x < x1) x1 = p.x
      if (p.y < y1) y1 = p.y
      if (p.x > x2) x2 = p.x
      if (p.y > y2) y2 = p.y
    }
    if (!isFinite(x1)) return { x: el.x, y: el.y, w: el.width || 1, h: el.height || 1 }
    return { x: x1, y: y1, w: Math.max(x2 - x1, 1), h: Math.max(y2 - y1, 1) }
  }
  return { x: el.x, y: el.y, w: el.width || 200, h: el.height || 200 }
}

export function SelectionOverlay({
  element,
  camera,
  onResizeStart,
  onResize,
  onUpdateColor,
  onDelete,
}: SelectionOverlayProps) {
  const PAD = 6
  const bbox = getBBox(element)

  // Convert canvas bbox → screen coords (relative to canvas container)
  const sl = (bbox.x - PAD) * camera.zoom + camera.x   // screen left
  const st = (bbox.y - PAD) * camera.zoom + camera.y   // screen top
  const sw = (bbox.w + PAD * 2) * camera.zoom          // screen width
  const sh = (bbox.h + PAD * 2) * camera.zoom          // screen height

  const [showColors, setShowColors] = useState(false)
  const resizingRef = useRef<{
    handle: HandleKey
    startX: number
    startY: number
    origX: number
    origY: number
    origW: number
    origH: number
  } | null>(null)

  // Close color picker on outside pointer
  useEffect(() => {
    if (!showColors) return
    const close = (e: PointerEvent) => {
      // Only close if the click isn't on our own overlay (stopPropagation handles that)
      setShowColors(false)
    }
    window.addEventListener("pointerdown", close)
    return () => window.removeEventListener("pointerdown", close)
  }, [showColors])

  // Reset resize on zoom changes to avoid stale origin
  useEffect(() => {
    resizingRef.current = null
  }, [camera.zoom])

  const handleResizeStart = (e: React.PointerEvent, handle: HandleKey) => {
    e.stopPropagation()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    onResizeStart()
    resizingRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origX: bbox.x,
      origY: bbox.y,
      origW: bbox.w,
      origH: bbox.h,
    }
  }

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = resizingRef.current
      if (!r) return

      const dx = (e.clientX - r.startX) / camera.zoom
      const dy = (e.clientY - r.startY) / camera.zoom
      const MIN = 20
      let x = r.origX, y = r.origY, w = r.origW, h = r.origH

      if (r.handle === "se") {
        w = Math.max(MIN, r.origW + dx)
        h = Math.max(MIN, r.origH + dy)
      } else if (r.handle === "sw") {
        const nw = Math.max(MIN, r.origW - dx)
        x = r.origX + r.origW - nw
        w = nw
        h = Math.max(MIN, r.origH + dy)
      } else if (r.handle === "ne") {
        w = Math.max(MIN, r.origW + dx)
        const nh = Math.max(MIN, r.origH - dy)
        y = r.origY + r.origH - nh
        h = nh
      } else {
        // nw
        const nw = Math.max(MIN, r.origW - dx)
        const nh = Math.max(MIN, r.origH - dy)
        x = r.origX + r.origW - nw
        y = r.origY + r.origH - nh
        w = nw
        h = nh
      }

      onResize(element.id, x, y, w, h)
    }

    const onUp = () => {
      resizingRef.current = null
    }

    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
    }
  }, [camera.zoom, element.id, onResize])

  // Elements where color applies (not sticky bg color, not images)
  const canColor =
    element.type !== "sticky" && element.type !== "image"

  // Position the action bar: above the selection if there's room, else below
  const barAbove = st > 52
  const barTop = barAbove ? st - 42 : st + sh + 10
  const colorGridTop = barAbove ? barTop - 56 : barTop + 38

  const handles: [HandleKey, number, number, string][] = [
    ["nw", sl,      st,      "nw-resize"],
    ["ne", sl + sw, st,      "ne-resize"],
    ["se", sl + sw, st + sh, "se-resize"],
    ["sw", sl,      st + sh, "sw-resize"],
  ]

  return (
    <>
      {/* Floating action bar */}
      <div
        className="absolute pointer-events-auto flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg select-none"
        style={{
          left: sl + sw / 2,
          top: barTop,
          transform: "translateX(-50%)",
          zIndex: 60,
          whiteSpace: "nowrap",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {canColor && (
          <>
            <button
              className="w-4 h-4 rounded-full flex-shrink-0 border border-white dark:border-zinc-700"
              style={{
                background: element.style.color,
                boxShadow: "0 0 0 1.5px rgba(0,0,0,0.2)",
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setShowColors((p) => !p)}
              title="Change color"
            />
            <div className="w-px h-3.5 bg-zinc-200 dark:bg-zinc-700" />
          </>
        )}
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={onDelete}
          className="p-0.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Delete (Del)"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Color grid popover */}
      {showColors && (
        <div
          className="absolute pointer-events-auto p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-xl select-none"
          style={{
            left: sl + sw / 2,
            top: colorGridTop,
            transform: "translateX(-50%)",
            zIndex: 61,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-8 gap-1">
            {[...COLORS].map((c) => (
              <button
                key={c}
                className="w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform"
                style={{
                  background: c,
                  borderColor: element.style.color === c ? "#2383e2" : "transparent",
                  boxShadow:
                    c === "#ffffff"
                      ? "inset 0 0 0 1px rgba(0,0,0,0.15)"
                      : undefined,
                }}
                onClick={() => {
                  onUpdateColor(element.id, c)
                  setShowColors(false)
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Corner resize handles */}
      {handles.map(([key, left, top, cursor]) => (
        <div
          key={key}
          className="absolute pointer-events-auto rounded-sm bg-white border-2 border-blue-500 shadow-sm select-none"
          style={{
            left: left - HANDLE_PX / 2,
            top: top - HANDLE_PX / 2,
            width: HANDLE_PX,
            height: HANDLE_PX,
            cursor,
            zIndex: 55,
          }}
          onPointerDown={(e) => handleResizeStart(e, key)}
        />
      ))}
    </>
  )
}
