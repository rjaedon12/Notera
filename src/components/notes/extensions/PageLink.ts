import { Node, mergeAttributes } from "@tiptap/core"

export interface PageLinkOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageLink: {
      setPageLink: (attrs: { pageId: string; title: string; icon?: string }) => ReturnType
    }
  }
}

export const PageLink = Node.create<PageLinkOptions>({
  name: "pageLink",
  group: "inline",
  inline: true,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      pageId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-page-id"),
        renderHTML: (attributes) => ({
          "data-page-id": attributes.pageId,
        }),
      },
      title: {
        default: "Untitled",
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => ({
          "data-title": attributes.title,
        }),
      },
      icon: {
        default: "📄",
        parseHTML: (element) => element.getAttribute("data-icon"),
        renderHTML: (attributes) => ({
          "data-icon": attributes.icon,
        }),
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: "a[data-type='page-link']",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "a",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        "data-type": "page-link",
        class: "page-link-chip",
        href: `/notes/${HTMLAttributes["data-page-id"]}`,
      }),
      [
        "span",
        { class: "page-link-icon" },
        HTMLAttributes["data-icon"] || "📄",
      ],
      [
        "span",
        { class: "page-link-title" },
        HTMLAttributes["data-title"] || "Untitled",
      ],
    ]
  },

  addCommands() {
    return {
      setPageLink:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs,
          })
        },
    }
  },
})
