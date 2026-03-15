import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

// Ensures there's always an empty paragraph at the end of the document
export const TrailingNode = Extension.create({
  name: "trailingNode",

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey("trailingNode"),
      appendTransaction: (_, __, newState) => {
        const { doc, tr, schema } = newState
        const lastNode = doc.lastChild

        if (!lastNode) return null

        const isParagraph = lastNode.type === schema.nodes.paragraph
        const isEmpty = lastNode.content.size === 0

        if (isParagraph && isEmpty) return null

        const endPosition = doc.content.size
        const type = schema.nodes.paragraph
        const transaction = tr.insert(endPosition, type.create())

        return transaction
      },
    })

    return [plugin]
  },
})
