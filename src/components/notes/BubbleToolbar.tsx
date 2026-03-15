"use client"

import { BubbleMenu } from "@tiptap/react/menus"
import type { Editor } from "@tiptap/react"
import { useCallback, useState } from "react"
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

  const btnClass =
    "flex h-7 w-7 items-center justify-center rounded transition-colors hover:bg-black/5 dark:hover:bg-white/10"
  const activeClass = "bg-black/10 dark:bg-white/15"

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
      className="flex items-center gap-0.5 rounded-lg border px-1 py-1"
      style={{
        background: "var(--popover)",
        borderColor: "var(--border)",
        boxShadow:
          "rgba(15,15,15,0.05) 0 0 0 1px, rgba(15,15,15,0.1) 0 3px 6px, rgba(15,15,15,0.2) 0 9px 24px",
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
            className="h-6 w-48 rounded border bg-transparent px-2 text-xs outline-none"
            style={{ borderColor: "var(--border)" }}
            autoFocus
          />
          <button onClick={setLink} className="text-xs font-medium px-2 py-0.5 rounded" style={{ color: "var(--primary)" }}>
            Apply
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`${btnClass} ${editor.isActive("bold") ? activeClass : ""}`}
            title="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`${btnClass} ${editor.isActive("italic") ? activeClass : ""}`}
            title="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`${btnClass} ${editor.isActive("underline") ? activeClass : ""}`}
            title="Underline"
          >
            <Underline className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`${btnClass} ${editor.isActive("strike") ? activeClass : ""}`}
            title="Strikethrough"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`${btnClass} ${editor.isActive("code") ? activeClass : ""}`}
            title="Code"
          >
            <Code className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleLinkClick}
            className={`${btnClass} ${editor.isActive("link") ? activeClass : ""}`}
            title="Link"
          >
            <Link className="h-3.5 w-3.5" />
          </button>

          <div className="mx-1 h-4 w-px" style={{ background: "var(--border)" }} />

          {/* Turn into dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTurnInto(!showTurnInto)}
              className={`${btnClass} w-auto gap-1 px-2 text-xs`}
            >
              Turn into
              <ChevronDown className="h-3 w-3" />
            </button>

            {showTurnInto && (
              <div
                className="absolute left-0 top-full mt-1 w-40 rounded-lg border py-1 z-50"
                style={{
                  background: "var(--popover)",
                  borderColor: "var(--border)",
                  boxShadow:
                    "rgba(15,15,15,0.05) 0 0 0 1px, rgba(15,15,15,0.1) 0 3px 6px, rgba(15,15,15,0.2) 0 9px 24px",
                }}
              >
                {turnIntoItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      item.action()
                      setShowTurnInto(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
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
