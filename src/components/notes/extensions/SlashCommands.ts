import { Extension } from "@tiptap/core"
import { PluginKey } from "@tiptap/pm/state"
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion"

export interface SlashCommandItem {
  title: string
  description: string
  icon: string
  category: string
  command: (props: { editor: ReturnType<typeof import("@tiptap/react").useEditor>; range: { from: number; to: number } }) => void
}

export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: ReturnType<typeof import("@tiptap/react").useEditor>
          range: { from: number; to: number }
          props: SlashCommandItem
        }) => {
          props.command({ editor, range })
        },
      } as Partial<SuggestionOptions>,
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        pluginKey: new PluginKey("slashCommands"),
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
})

export function getSlashCommandItems(): SlashCommandItem[] {
  return [
    {
      title: "Text",
      description: "Plain paragraph",
      icon: "📝",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setNode("paragraph").run()
      },
    },
    {
      title: "Heading 1",
      description: "Large section header",
      icon: "H1",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run()
      },
    },
    {
      title: "Heading 2",
      description: "Medium section header",
      icon: "H2",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run()
      },
    },
    {
      title: "Heading 3",
      description: "Small section header",
      icon: "H3",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run()
      },
    },
    {
      title: "Bulleted list",
      description: "Unordered list",
      icon: "•",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: "Numbered list",
      description: "Ordered list",
      icon: "1.",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: "To-do list",
      description: "Checkbox list",
      icon: "☑",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    },
    {
      title: "Toggle list",
      description: "Collapsible content",
      icon: "▸",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setToggleBlock().run()
      },
    },
    {
      title: "Quote",
      description: "Indented quote",
      icon: "❝",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    },
    {
      title: "Callout",
      description: "Highlighted info block",
      icon: "💡",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setCallout().run()
      },
    },
    {
      title: "Divider",
      description: "Horizontal rule",
      icon: "─",
      category: "Basic blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
    {
      title: "Code",
      description: "Syntax highlighted code block",
      icon: "</>",
      category: "Advanced blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    },
    {
      title: "Table",
      description: "3×3 starter table",
      icon: "⊞",
      category: "Advanced blocks",
      command: ({ editor, range }) => {
        editor
          ?.chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
      },
    },
    {
      title: "Image",
      description: "Embed an image from URL",
      icon: "🖼️",
      category: "Media",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).run()
        // Defer the prompt so the editor can finish cleaning up the slash text first
        requestAnimationFrame(() => {
          const url = window.prompt("Paste the image URL:")
          if (url && url.trim()) {
            const alt = window.prompt("Image description (optional):") || ""
            editor?.chain().focus().setImage({ src: url.trim(), alt: alt.trim() }).run()
          } else {
            // Re-focus the editor even if cancelled
            editor?.commands.focus()
          }
        })
      },
    },
    // Math & Science
    {
      title: "Math Equation",
      description: "Display LaTeX equation",
      icon: "∑",
      category: "Advanced blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setMathBlock().run()
      },
    },
    {
      title: "Inline Math",
      description: "Inline LaTeX expression",
      icon: "𝑥",
      category: "Advanced blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setInlineMath().run()
      },
    },
    // Planning & Organization
    {
      title: "Timeline",
      description: "Chronological event timeline",
      icon: "📅",
      category: "Advanced blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setTimelineBlock().run()
      },
    },
    {
      title: "Calendar",
      description: "Monthly calendar with events",
      icon: "🗓️",
      category: "Advanced blocks",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setCalendarBlock().run()
      },
    },
  ]
}
