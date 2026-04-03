"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { MathBlock, InlineMath } from "@/components/notes/extensions/Mathematics"
import { Bold, Italic, Sigma } from "lucide-react"
import { cn } from "@/lib/utils"

interface OpenResponseEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  readOnly?: boolean
  className?: string
}

export function OpenResponseEditor({
  value,
  onChange,
  placeholder = "Type your response here...",
  readOnly = false,
  className,
}: OpenResponseEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
      }),
      Placeholder.configure({ placeholder }),
      MathBlock,
      InlineMath,
    ],
    content: value || "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-[120px] p-3 focus:outline-none",
      },
    },
  })

  if (!editor) return null

  return (
    <div
      className={cn(
        "border border-[#E8E8ED] rounded-xl overflow-hidden transition-colors",
        readOnly
          ? "bg-muted/30"
          : "focus-within:ring-2 focus-within:ring-[#0071E3]/20 focus-within:border-[#0071E3]",
        className
      )}
    >
      {/* Toolbar */}
      {!readOnly && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b bg-muted/30">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().setMathBlock().run()}
            title="Insert Math Block"
          >
            <Sigma className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded hover:bg-muted transition-colors",
        active && "bg-muted text-[var(--primary)]"
      )}
    >
      {children}
    </button>
  )
}
