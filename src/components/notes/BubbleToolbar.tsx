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
} from "lucide-react"

interface BubbleToolbarProps {
  editor: Editor
}

export function BubbleToolbar({ editor }: BubbleToolbarProps) {
  const [showTurnInto, setShowTurnInto] = useState(false)
  const [linkInput, setLinkInput] = useState("")
  const [showLinkInput, setShowLinkInput] = useState(false)
  const turnIntoRef = useRef<HTMLDivElement>(null)

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
    if (!showTurnInto) return
    const handleClick = (e: MouseEvent) => {
      if (turnIntoRef.current && !turnIntoRef.current.contains(e.target as Node)) {
        setShowTurnInto(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showTurnInto])

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
