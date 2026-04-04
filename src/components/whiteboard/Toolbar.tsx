"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MousePointer2,
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
  Type,
  StickyNote,
  ImagePlus,
  Undo2,
  Redo2,
} from "lucide-react"
import type { ToolType, StrokeStyle } from "@/lib/whiteboard/types"
import { TOOLS_CONFIG } from "@/lib/whiteboard/types"
import { ColorPicker } from "./ColorPicker"

interface ToolbarProps {
  tool: ToolType
  setTool: (tool: ToolType) => void
  style: StrokeStyle
  setStyle: (style: StrokeStyle) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}

const TOOL_ICONS: Record<ToolType, React.ReactNode> = {
  select: <MousePointer2 size={20} />,
  pen: <Pen size={20} />,
  highlighter: <Highlighter size={20} />,
  eraser: <Eraser size={20} />,
  rectangle: <Square size={20} />,
  circle: <Circle size={20} />,
  line: <Minus size={20} />,
  arrow: <ArrowUpRight size={20} />,
  text: <Type size={20} />,
  sticky: <StickyNote size={20} />,
  image: <ImagePlus size={20} />,
  pan: null, // Pan is via space key, not in toolbar
}

const TOOLBAR_TOOLS: ToolType[] = [
  "select", "pen", "highlighter", "eraser",
  "rectangle", "circle", "line", "arrow",
  "text", "sticky", "image",
]

export function Toolbar({
  tool,
  setTool,
  style,
  setStyle,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Auto-hide toolbar after inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setIsVisible(true)
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setIsVisible(false), 4000)
    }
    window.addEventListener("mousemove", handleMouseMove)
    handleMouseMove()
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      clearTimeout(timeoutRef.current)
    }
  }, [])

  // Show color picker for drawing tools
  const isDrawingTool = ["pen", "highlighter", "eraser"].includes(tool)
  const isShapeTool = ["rectangle", "circle", "line", "arrow"].includes(tool)
  const showStylePicker = isDrawingTool || isShapeTool

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={toolbarRef}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2"
        >
          {/* Color/Style popover */}
          <AnimatePresence>
            {showColorPicker && showStylePicker && (
              <motion.div
                initial={{ y: 8, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 8, opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <ColorPicker
                  style={style}
                  setStyle={setStyle}
                  isHighlighter={tool === "highlighter"}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main toolbar */}
          <div
            className="flex items-center gap-1 px-3 py-2 rounded-2xl backdrop-blur-xl shadow-lg"
            style={{
              background: "var(--popover)",
              border: "1px solid var(--glass-border)",
            }}
          >
            {/* Undo/Redo */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: "var(--muted-foreground)" }}
              title="Undo (⌘Z)"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ color: "var(--muted-foreground)" }}
              title="Redo (⌘⇧Z)"
            >
              <Redo2 size={18} />
            </button>

            {/* Divider */}
            <div className="w-px h-6 mx-1" style={{ background: "var(--glass-border)" }} />

            {/* Tool buttons */}
            {TOOLBAR_TOOLS.map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTool(t)
                  if (["pen", "highlighter", "rectangle", "circle", "line", "arrow"].includes(t)) {
                    setShowColorPicker((prev) => (tool === t ? !prev : true))
                  } else {
                    setShowColorPicker(false)
                  }
                }}
                className="p-2 rounded-xl transition-all duration-150"
                style={
                  tool === t
                    ? {
                        background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                        color: "var(--primary)",
                        boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--primary) 30%, transparent)",
                      }
                    : { color: "var(--muted-foreground)" }
                }
                title={`${TOOLS_CONFIG[t].label} (${TOOLS_CONFIG[t].shortcut})`}
              >
                {TOOL_ICONS[t]}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
