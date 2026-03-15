import { Extension } from "@tiptap/core"
import { PluginKey } from "@tiptap/pm/state"
import Suggestion, { type SuggestionOptions } from "@tiptap/suggestion"

export interface SlashCommandItem {
  title: string
  description: string
  icon: string
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
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setNode("paragraph").run()
      },
    },
    {
      title: "Heading 1",
      description: "Large section header",
      icon: "H1",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run()
      },
    },
    {
      title: "Heading 2",
      description: "Medium section header",
      icon: "H2",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run()
      },
    },
    {
      title: "Heading 3",
      description: "Small section header",
      icon: "H3",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setNode("heading", { level: 3 }).run()
      },
    },
    {
      title: "Bulleted list",
      description: "Unordered list",
      icon: "•",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).toggleBulletList().run()
      },
    },
    {
      title: "Numbered list",
      description: "Ordered list",
      icon: "1.",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).toggleOrderedList().run()
      },
    },
    {
      title: "To-do list",
      description: "Checkbox list",
      icon: "☑",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).toggleTaskList().run()
      },
    },
    {
      title: "Quote",
      description: "Indented quote",
      icon: "❝",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).toggleBlockquote().run()
      },
    },
    {
      title: "Code",
      description: "Monospace with syntax highlight",
      icon: "</>",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).toggleCodeBlock().run()
      },
    },
    {
      title: "Divider",
      description: "Horizontal rule",
      icon: "─",
      command: ({ editor, range }) => {
        editor?.chain().focus().deleteRange(range).setHorizontalRule().run()
      },
    },
    {
      title: "Table",
      description: "3×3 starter table",
      icon: "⊞",
      command: ({ editor, range }) => {
        editor
          ?.chain()
          .focus()
          .deleteRange(range)
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run()
      },
    },
  ]
}
