"use client"

import { BubbleMenu } from "@tiptap/react/menus"
import type { Editor } from "@tiptap/react"
import { useCallback, useState, useEffect, useRef } from "react"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code2,
  ChevronDown,
  Highlighter,
  Palette,
  Sigma,
} from "lucide-react"

const HIGHLIGHT_COLORS = [
  { label: "Yellow", value: "#fef08a" },
  { label: "Green", value: "#bbf7d0" },
  { label: "Blue", value: "#bfdbfe" },
  { label: "Purple", value: "#e9d5ff" },
  { label: "Pink", value: "#fce7f3" },
  { label: "Orange", value: "#fed7aa" },
  { label: "Red", value: "#fecaca" },
  { label: "None", value: "" },
]

const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#ef4444" },
  { label: "Orange", value: "#f97316" },
  { label: "Yellow", value: "#eab308" },
  { label: "Green", value: "#22c55e" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#a855f7" },
  { label: "Pink", value: "#ec4899" },
  { label: "Gray", value: "#9ca3af" },
]

interface BubbleToolbarProps {
  editor: Editor
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [showTurnInto, setShowTurnInto] = useState(false)
  const [showHighlight, setShowHighlight] = useState(false)
  const [showTextColor, setShowTextColor] = useState(false)
  const [linkInput, setLinkInput] = useState("")
  const [showLinkInput, setShowLinkInput] = useState(false)
  const turnIntoRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const textColorRef = useRef<HTMLDivElement>(null)

  const setLink = useCallback(() => {
    if (linkInput === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: linkInput })
        .run()
    }
    setShowLinkInput(false)
    setLinkInput("")
  }, [editor, linkInput])

  const handleLinkClick = useCallback(() => {
    const prev = editor.getAttributes("link").href || ""
    setLinkInput(prev)
    setShowLinkInput(true)
  }, [editor])

  // Close Turn Into dropdown when clicking outside
  useEffect(() => {
    if (!showTurnInto && !showHighlight && !showTextColor) return
    const handleClick = (e: MouseEvent) => {
      if (showTurnInto && turnIntoRef.current && !turnIntoRef.current.contains(e.target as Node)) {
        setShowTurnInto(false)
      }
      if (showHighlight && highlightRef.current && !highlightRef.current.contains(e.target as Node)) {
        setShowHighlight(false)
      }
      if (showTextColor && textColorRef.current && !textColorRef.current.contains(e.target as Node)) {
        setShowTextColor(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showTurnInto, showHighlight, showTextColor])

  const btnClass =
    "flex h-7 w-7 items-center justify-center rounded-md transition-colors"
  const activeClass = "bg-white/15"
  const hoverClass = "hover:bg-white/10"

  const turnIntoItems = [
    { label: "Text", icon: <Type className="h-3.5 w-3.5" />, action: () => editor.chain().focus().setNode("paragraph").run() },
    { label: "Heading 1", icon: <Heading1 className="h-3.5 w-3.5" />, action: () => editor.chain().focus().setNode("heading", { level: 1 }).run() },
    { label: "Heading 2", icon: <Heading2 className="h-3.5 w-3.5" />, action: () => editor.chain().focus().setNode("heading", { level: 2 }).run() },
    { label: "Heading 3", icon: <Heading3 className="h-3.5 w-3.5" />, action: () => editor.chain().focus().setNode("heading", { level: 3 }).run() },
    { label: "Quote", icon: <Quote className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "Code", icon: <Code2 className="h-3.5 w-3.5" />, action: () => editor.chain().focus().toggleCodeBlock().run() },
  ]

  return (
    <BubbleMenu
      editor={editor}
      className="bubble-toolbar flex items-center gap-0.5 rounded-[10px] px-1 py-1"
      style={{
        background: "rgba(15, 15, 15, 0.90)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        boxShadow:
          "0 0 0 1px rgba(255,255,255,0.08), 0 8px 30px rgba(0,0,0,0.35)",
        color: "#ebebeb",
      }}
    >
      {showLinkInput ? (
        <div className="flex items-center gap-1 px-1">
          <input
            type="url"
            placeholder="Paste link…"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                setLink()
              }
              if (e.key === "Escape") {
                setShowLinkInput(false)
              }
            }}
            className="h-6 w-48 rounded-md bg-white/10 border-none px-2 text-xs text-white outline-none placeholder-white/40"
            autoFocus
          />
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              setLink()
            }}
            className="text-xs font-medium px-2 py-0.5 rounded-md text-blue-400 hover:bg-white/10 transition-colors"
          >
            Apply
          </button>
        </div>
      ) : (
        <>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleBold().run()
            }}
            className={`${btnClass} ${hoverClass} ${editor.isActive("bold") ? activeClass : ""}`}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleItalic().run()
            }}
            className={`${btnClass} ${hoverClass} ${editor.isActive("italic") ? activeClass : ""}`}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleUnderline().run()
            }}
            className={`${btnClass} ${hoverClass} ${editor.isActive("underline") ? activeClass : ""}`}
            title="Underline"
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleStrike().run()
            }}
            className={`${btnClass} ${hoverClass} ${editor.isActive("strike") ? activeClass : ""}`}
            title="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().toggleCode().run()
            }}
            className={`${btnClass} ${hoverClass} ${editor.isActive("code") ? activeClass : ""}`}
            title="Code"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              handleLinkClick()
            }}
            className={`${btnClass} ${hoverClass} ${editor.isActive("link") ? activeClass : ""}`}
            title="Link"
          >
            <Link className="h-3.5 w-3.5" />
          </button>

          {/* Highlight dropdown */}
          <div className="relative" ref={highlightRef}>
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                setShowHighlight(!showHighlight)
                setShowTextColor(false)
                setShowTurnInto(false)
              }}
              className={`${btnClass} ${hoverClass} ${editor.isActive("highlight") ? activeClass : ""}`}
              title="Highlight"
            >
              <Highlighter className="h-3.5 w-3.5" />
            </button>

            {showHighlight && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-1 rounded-xl py-2 px-2 z-50"
                style={{
                  background: "rgba(15, 15, 15, 0.92)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 8px 30px rgba(0,0,0,0.35)",
                }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-1 pb-1.5">Highlight</div>
                <div className="flex gap-1.5">
                  {HIGHLIGHT_COLORS.map((c) => (
                    <button
                      key={c.label}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        if (c.value) {
                          editor.chain().focus().toggleHighlight({ color: c.value }).run()
                        } else {
                          editor.chain().focus().unsetHighlight().run()
                        }
                        setShowHighlight(false)
                      }}
                      className="w-6 h-6 rounded-md border border-white/10 transition-transform hover:scale-110"
                      style={{ background: c.value || "transparent" }}
                      title={c.label}
                    >
                      {!c.value && <span className="text-[10px] text-white/50">✕</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text Color dropdown */}
          <div className="relative" ref={textColorRef}>
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                setShowTextColor(!showTextColor)
                setShowHighlight(false)
                setShowTurnInto(false)
              }}
              className={`${btnClass} ${hoverClass}`}
              title="Text color"
            >
              <Palette className="h-3.5 w-3.5" />
            </button>

            {showTextColor && (
              <div
                className="absolute left-1/2 -translate-x-1/2 top-full mt-1 rounded-xl py-2 px-2 z-50"
                style={{
                  background: "rgba(15, 15, 15, 0.92)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.08), 0 8px 30px rgba(0,0,0,0.35)",
                }}
              >
                <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40 px-1 pb-1.5">Text Color</div>
                <div className="flex gap-1.5">
                  {TEXT_COLORS.map((c) => (
                    <button
                      key={c.label}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        if (c.value) {
                          editor.chain().focus().setColor(c.value).run()
                        } else {
                          editor.chain().focus().unsetColor().run()
                        }
                        setShowTextColor(false)
                      }}
                      className="w-6 h-6 rounded-md border border-white/10 transition-transform hover:scale-110 flex items-center justify-center"
                      style={{ background: c.value ? c.value + "20" : "transparent" }}
                      title={c.label}
                    >
                      <span style={{ color: c.value || "#fff", fontSize: "13px", fontWeight: 700 }}>A</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Inline Math */}
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              editor.chain().focus().setInlineMath().run()
            }}
            className={`${btnClass} ${hoverClass}`}
            title="Inline math"
          >
            <Sigma className="h-3.5 w-3.5" />
          </button>

          <div className="mx-0.5 h-4 w-px bg-white/15" />

          {/* Turn into dropdown */}
          <div className="relative" ref={turnIntoRef}>
            <button
              onMouseDown={(e) => {
                e.preventDefault()
                setShowTurnInto(!showTurnInto)
              }}
              className={`${btnClass} ${hoverClass} w-auto gap-1 px-2 text-xs`}
            >
              Turn into
              <ChevronDown className="h-3 w-3" />
            </button>

            {showTurnInto && (
              <div
                className="absolute left-0 top-full mt-1 w-44 rounded-xl py-1 z-50"
                style={{
                  background: "rgba(15, 15, 15, 0.92)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  boxShadow:
                    "0 0 0 1px rgba(255,255,255,0.08), 0 8px 30px rgba(0,0,0,0.35)",
                }}
              >
                {turnIntoItems.map((item) => (
                  <button
                    key={item.label}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      item.action()
                      setShowTurnInto(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10 transition-colors"
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </BubbleMenu>
  )
}
