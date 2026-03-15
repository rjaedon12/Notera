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
import { BlockMenu } from "./BlockMenu"
import "./NoteEditor.css"

const lowlight = createLowlight(common)

interface NoteEditorProps {
  content: Record<string, unknown> | null
  isFullWidth: boolean
  onUpdate: (content: Record<string, unknown>) => void
  editorRef?: React.MutableRefObject<ReturnType<typeof useEditor> | null>
}

export function NoteEditor({ content, isFullWidth, onUpdate, editorRef }: NoteEditorProps) {
  const [slashMenuOpen, setSlashMenuOpen] = useState(false)
  const [slashRange, setSlashRange] = useState<{ from: number; to: number } | null>(null)
  const hasInitialized = useRef(false)

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
          items: ({ query }: { query: string }) => {
            return getSlashCommandItems().filter((item) =>
              item.title.toLowerCase().includes(query.toLowerCase())
            )
          },
          render: () => {
            return {
              onStart: (props: { range: { from: number; to: number } }) => {
                setSlashMenuOpen(true)
                setSlashRange(props.range)
              },
              onUpdate: (props: { range: { from: number; to: number } }) => {
                setSlashRange(props.range)
              },
              onExit: () => {
                setSlashMenuOpen(false)
                setSlashRange(null)
              },
              onKeyDown: (props: { event: KeyboardEvent }) => {
                if (props.event.key === "Escape") {
                  setSlashMenuOpen(false)
                  return true
                }
                if (
                  props.event.key === "ArrowUp" ||
                  props.event.key === "ArrowDown" ||
                  props.event.key === "Enter"
                ) {
                  return true // Handled by BlockMenu
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

  // Set content when page changes (only on initial load or page switch)
  useEffect(() => {
    if (editor && content && !hasInitialized.current) {
      editor.commands.setContent(content)
      hasInitialized.current = true
    }
  }, [editor, content])

  // Reset initialization flag when content identity changes (page switch)
  useEffect(() => {
    hasInitialized.current = false
  }, [content])

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
    <div className={`${isFullWidth ? "" : "max-w-[708px]"} mx-auto px-6 pb-[30vh]`}>
      <EditorContent editor={editor} />
      <BubbleToolbar editor={editor} />
      <BlockMenu
        editor={editor}
        isOpen={slashMenuOpen}
        onClose={() => setSlashMenuOpen(false)}
        command={handleSlashCommand}
      />
    </div>
  )
}
