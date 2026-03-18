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
  pan: null, // Pan is via space key, not in toolbar
}

const TOOLBAR_TOOLS: ToolType[] = [
  "select", "pen", "highlighter", "eraser",
  "rectangle", "circle", "line", "arrow",
  "text", "sticky",
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
          <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-700/60 shadow-lg shadow-black/5 dark:shadow-black/30">
            {/* Undo/Redo */}
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (⌘Z)"
            >
              <Undo2 size={18} />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (⌘⇧Z)"
            >
              <Redo2 size={18} />
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />

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
                className={`p-2 rounded-xl transition-all duration-150 ${
                  tool === t
                    ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-200 dark:ring-blue-500/30"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
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
