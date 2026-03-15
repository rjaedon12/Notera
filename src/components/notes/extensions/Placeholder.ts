import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

export const CustomPlaceholder = Extension.create({
  name: "customPlaceholder",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("customPlaceholder"),
        props: {
          decorations: (state) => {
            const { doc, selection } = state
            const decorations: Decoration[] = []
            const isDocEmpty =
              doc.childCount === 1 &&
              doc.firstChild?.isTextblock &&
              doc.firstChild.content.size === 0

            doc.descendants((node, pos) => {
              if (!node.isTextblock || node.content.size > 0) return

              // Only show placeholder if cursor is in this block
              const isActive =
                selection.$anchor.pos >= pos &&
                selection.$anchor.pos <= pos + node.nodeSize

              if (!isActive && !isDocEmpty) return

              let placeholder = ""
              if (isDocEmpty && node.type.name === "paragraph") {
                placeholder = "Press '/' for commands"
              } else if (node.type.name === "heading") {
                const level = node.attrs.level
                placeholder = `Heading ${level}`
              }

              if (placeholder) {
                const decoration = Decoration.node(pos, pos + node.nodeSize, {
                  class: "is-empty",
                  "data-placeholder": placeholder,
                })
                decorations.push(decoration)
              }
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
})
