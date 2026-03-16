"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { Table } from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight"
import Underline from "@tiptap/extension-underline"
import Typography from "@tiptap/extension-typography"
import CharacterCount from "@tiptap/extension-character-count"
import { common, createLowlight } from "lowlight"
import { useCallback, useEffect, useRef, useState } from "react"

import { SlashCommands, getSlashCommandItems, type SlashCommandItem } from "./extensions/SlashCommands"
import { TrailingNode } from "./extensions/TrailingNode"
import { CustomPlaceholder } from "./extensions/Placeholder"
import { Callout } from "./extensions/Callout"
import { ToggleBlock, ToggleSummary, ToggleContent } from "./extensions/ToggleList"
import { BubbleToolbar } from "./BubbleToolbar"
import { BlockMenu, type BlockMenuHandle } from "./BlockMenu"
import "./NoteEditor.css"

const lowlight = createLowlight(common)

interface NoteEditorProps {
  content: Record<string, unknown> | null
  pageId?: string
  isFullWidth: boolean
  onUpdate: (content: Record<string, unknown>) => void
  editorRef?: React.MutableRefObject<ReturnType<typeof useEditor> | null>
}

export function NoteEditor({ content, pageId, isFullWidth, onUpdate, editorRef }: NoteEditorProps) {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashRange, setSlashRange] = useState<{ from: number; to: number } | null>(null)
  const [cursorRect, setCursorRect] = useState<DOMRect | null>(null)
  const [slashQuery, setSlashQuery] = useState("")
  const hasInitialized = useRef(false)
  const blockMenuRef = useRef<BlockMenuHandle>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Using CodeBlockLowlight instead
        dropcursor: {
          color: "#2383e2",
          width: 2,
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Image,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      CodeBlockLowlight.configure({ lowlight }),
      Typography,
      CharacterCount,
      CustomPlaceholder,
      TrailingNode,
      Callout,
      ToggleBlock,
      ToggleSummary,
      ToggleContent,
      SlashCommands.configure({
        suggestion: {
          char: "/",
          allowSpaces: true,
          // Always return all items — BlockMenu handles its own filtering via the `query` prop.
          // If items() returns [] here, TipTap's suggestion plugin fires onExit and closes
          // the menu before the user can scroll/select anything.
          items: () => getSlashCommandItems(),
          render: () => {
            return {
              onStart: (props: { range: { from: number; to: number }; clientRect?: () => DOMRect | null; query?: string }) => {
                setSlashMenuOpen(true)
                setSlashRange(props.range)
                setCursorRect(props.clientRect?.() ?? null)
                setSlashQuery(props.query ?? "")
              },
              onUpdate: (props: { range: { from: number; to: number }; clientRect?: () => DOMRect | null; query?: string }) => {
                setSlashRange(props.range)
                setCursorRect(props.clientRect?.() ?? null)
                setSlashQuery(props.query ?? "")
              },
              onExit: () => {
                setSlashMenuOpen(false)
                setSlashRange(null)
                setCursorRect(null)
                setSlashQuery("")
              },
              onKeyDown: (props: { event: KeyboardEvent }) => {
                const { key } = props.event
                if (key === "Escape") {
                  setSlashMenuOpen(false)
                  setSlashRange(null)
                  setCursorRect(null)
                  setSlashQuery("")
                  return true
                }
                if (key === "ArrowDown") {
                  blockMenuRef.current?.moveDown()
                  return true
                }
                if (key === "ArrowUp") {
                  blockMenuRef.current?.moveUp()
                  return true
                }
                if (key === "Enter" || key === "Tab") {
                  blockMenuRef.current?.selectCurrent()
                  return true
                }
                return false
              },
            }
          },
        },
      }),
    ],
    content: content || undefined,
    editorProps: {
      attributes: {
        class: "ProseMirror outline-none",
        style: "font-size: 1rem; line-height: 1.7;",
      },
    },
    onUpdate: ({ editor: e }) => {
      onUpdate(e.getJSON() as Record<string, unknown>)
    },
    immediatelyRender: false,
  })

  // Expose editor ref
  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor
    }
  }, [editor, editorRef])

  // Set content when page changes (gated on pageId, not content reference)
  const prevPageId = useRef<string | undefined>(undefined)
  useEffect(() => {
    if (editor && content && pageId !== prevPageId.current) {
      editor.commands.setContent(content)
      prevPageId.current = pageId
    }
  }, [editor, content, pageId])

  const handleSlashCommand = useCallback(
    (item: SlashCommandItem) => {
      if (editor && slashRange) {
        item.command({ editor, range: slashRange })
      }
      setSlashMenuOpen(false)
    },
    [editor, slashRange]
  )

  if (!editor) return null

  return (
    <div className={`${isFullWidth ? "" : "max-w-[708px]"} mx-auto px-6`}>
      <EditorContent editor={editor} />
      {/* Static spacer — keeps scroll room without resize-dependent padding */}
      <div className="h-[30vh]" aria-hidden="true" />
      <BubbleToolbar editor={editor} />
      <BlockMenu
        ref={blockMenuRef}
        editor={editor}
        isOpen={slashMenuOpen}
        cursorRect={cursorRect}
        query={slashQuery}
        onClose={() => setSlashMenuOpen(false)}
        command={handleSlashCommand}
      />
    </div>
  )
}
