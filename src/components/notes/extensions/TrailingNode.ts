import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "@tiptap/pm/state"

// Ensures there's always an empty paragraph at the end of the document,
// but only inserts one when a transaction actually changed the doc.
export const TrailingNode = Extension.create({
  name: "trailingNode",

  addProseMirrorPlugins() {
    const plugin = new Plugin({
      key: new PluginKey("trailingNode"),
      appendTransaction: (transactions, oldState, newState) => {
        // Only act when the document actually changed
        const docChanged = transactions.some((tr) => tr.docChanged)
        if (!docChanged) return null

        const { doc, tr, schema } = newState
        const lastNode = doc.lastChild

        if (!lastNode) return null

        const isParagraph = lastNode.type === schema.nodes.paragraph
        const isEmpty = lastNode.content.size === 0

        // Already has an empty trailing paragraph — nothing to do
        if (isParagraph && isEmpty) return null

        const endPosition = doc.content.size
        const type = schema.nodes.paragraph
        return tr.insert(endPosition, type.create())
      },
    })

    return [plugin]
  },
})
