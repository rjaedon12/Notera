import { Node, mergeAttributes } from "@tiptap/core"
import { TextSelection } from "@tiptap/pm/state"

export interface ToggleBlockOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    toggleBlock: {
      setToggleBlock: () => ReturnType
    }
  }
}

// The wrapper <details> element
export const ToggleBlock = Node.create<ToggleBlockOptions>({
  name: "toggleBlock",
  group: "block",
  content: "toggleSummary toggleContent",
  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      open: {
        default: true,
        parseHTML: (element) => element.hasAttribute("open"),
        renderHTML: (attributes) => {
          if (!attributes.open) return {}
          return { open: "" }
        },
      },
    }
  },

  parseHTML() {
    return [{ tag: "details" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "details",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: "toggle-block",
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setToggleBlock:
        () =>
        ({ editor }) => {
          return editor
            .chain()
            .insertContent({
              type: this.name,
              attrs: { open: true },
              content: [
                {
                  type: "toggleSummary",
                  content: [{ type: "text", text: "Toggle heading" }],
                },
                {
                  type: "toggleContent",
                  content: [
                    {
                      type: "paragraph",
                    },
                  ],
                },
              ],
            })
            .run()
        },
    }
  },
})

// The <summary> part (clickable heading)
export const ToggleSummary = Node.create({
  name: "toggleSummary",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: "summary" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "summary",
      mergeAttributes(HTMLAttributes, { class: "toggle-summary" }),
      0,
    ]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        return this.editor.commands.command(({ state, dispatch }) => {
          const { $from } = state.selection
          if ($from.parent.type.name !== "toggleSummary") return false
          const toggleNode = $from.node(-1)
          if (!toggleNode || toggleNode.type.name !== "toggleBlock") return false
          const contentNode = toggleNode.child(1)
          if (!contentNode || contentNode.type.name !== "toggleContent") return false
          const pos = $from.before(-1) + toggleNode.child(0).nodeSize + 2
          if (dispatch) {
            const tr = state.tr.setSelection(
              TextSelection.near(state.doc.resolve(pos))
            )
            dispatch(tr)
          }
          return true
        })
      },
    }
  },
})

// The content area
export const ToggleContent = Node.create({
  name: "toggleContent",
  content: "block+",
  defining: true,

  parseHTML() {
    return [{ tag: "div[data-toggle-content]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-toggle-content": "",
        class: "toggle-content",
      }),
      0,
    ]
  },
})
