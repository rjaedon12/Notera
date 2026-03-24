"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import { useState, useEffect, useRef, useCallback } from "react"
import katex from "katex"
import { Trash2 } from "lucide-react"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    mathBlock: {
      setMathBlock: () => ReturnType
    }
    inlineMath: {
      setInlineMath: () => ReturnType
    }
  }
}

/* ====================================================================
   MATH BLOCK — Display-mode equation (own line)
   ==================================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MathBlockComponent({ node, updateAttributes, selected, deleteNode }: any) {
  const [editing, setEditing] = useState(!node.attrs.latex)
  const [latex, setLatex] = useState(node.attrs.latex || "")
  const renderRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Render the saved equation
  useEffect(() => {
    if (!editing && renderRef.current && latex) {
      try {
        katex.render(latex, renderRef.current, {
          displayMode: true,
          throwOnError: false,
          trust: true,
        })
      } catch {
        renderRef.current.textContent = latex
      }
    }
  }, [editing, latex])

  // Live preview while editing
  useEffect(() => {
    if (editing && previewRef.current && latex) {
      try {
        katex.render(latex, previewRef.current, {
          displayMode: true,
          throwOnError: false,
          trust: true,
        })
      } catch {
        previewRef.current.textContent = "⚠ Invalid LaTeX"
      }
    }
  }, [editing, latex])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.selectionStart = inputRef.current.value.length
    }
  }, [editing])

  const handleSave = useCallback(() => {
    updateAttributes({ latex })
    setEditing(false)
  }, [latex, updateAttributes])

  return (
    <NodeViewWrapper className="math-block-wrapper" data-type="math-block">
      {editing ? (
        <div className="math-block-editor">
          <div className="math-block-editor-header">
            <span className="math-block-editor-label">LaTeX Equation</span>
            <span className="math-block-editor-hint">⌘+Enter to save · Esc to cancel</span>
          </div>
          <textarea
            ref={inputRef}
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleSave()
              }
              if (e.key === "Escape") {
                setEditing(false)
              }
            }}
            placeholder="E = mc^2"
            className="math-block-input"
            rows={3}
            spellCheck={false}
          />
          {latex && (
            <div className="math-block-preview">
              <div className="math-block-preview-label">Preview</div>
              <div ref={previewRef} className="math-block-preview-render" />
            </div>
          )}
          <div className="math-block-actions">
            <button
              onClick={() => setEditing(false)}
              className="math-block-cancel-btn"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="math-block-save-btn">
              Done
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`math-block-render ${selected ? "selected" : ""}`}
          onClick={() => setEditing(true)}
          title="Click to edit equation"
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              deleteNode()
            }}
            className="math-block-delete-btn"
            title="Delete equation"
            type="button"
          >
            <Trash2 size={14} />
          </button>
          {latex ? (
            <div ref={renderRef} />
          ) : (
            <div className="math-block-placeholder">Click to add equation</div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  )
}

export const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      latex: { default: "" },
    }
  },

  parseHTML() {
    return [{ tag: 'div[data-type="math-block"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "math-block" }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockComponent)
  },

  addCommands() {
    return {
      setMathBlock:
        () =>
        ({ chain }: { chain: () => ReturnType<import("@tiptap/core").Editor["chain"]> }) => {
          return chain()
            .insertContent({ type: "mathBlock", attrs: { latex: "" } })
            .run()
        },
    }
  },
})

/* ====================================================================
   INLINE MATH — Inline equation within text
   ==================================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function InlineMathComponent({ node, updateAttributes, selected }: any) {
  const [editing, setEditing] = useState(!node.attrs.latex)
  const [latex, setLatex] = useState(node.attrs.latex || "")
  const renderRef = useRef<HTMLSpanElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!editing && renderRef.current && latex) {
      try {
        katex.render(latex, renderRef.current, {
          displayMode: false,
          throwOnError: false,
          trust: true,
        })
      } catch {
        renderRef.current.textContent = latex
      }
    }
  }, [editing, latex])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  const handleSave = useCallback(() => {
    updateAttributes({ latex })
    setEditing(false)
  }, [latex, updateAttributes])

  return (
    <NodeViewWrapper as="span" className="inline-math-wrapper" data-type="inline-math">
      {editing ? (
        <input
          ref={inputRef}
          value={latex}
          onChange={(e) => setLatex(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              handleSave()
            }
            if (e.key === "Escape") {
              if (latex) setEditing(false)
            }
          }}
          onBlur={handleSave}
          placeholder="x^2 + y^2 = z^2"
          className="inline-math-input"
          spellCheck={false}
        />
      ) : (
        <span
          className={`inline-math-render ${selected ? "selected" : ""}`}
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {latex ? (
            <span ref={renderRef} />
          ) : (
            <span className="inline-math-placeholder">equation</span>
          )}
        </span>
      )}
    </NodeViewWrapper>
  )
}

export const InlineMath = Node.create({
  name: "inlineMath",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: { default: "" },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-type="inline-math"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "inline-math" }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineMathComponent)
  },

  addCommands() {
    return {
      setInlineMath:
        () =>
        ({ chain }: { chain: () => ReturnType<import("@tiptap/core").Editor["chain"]> }) => {
          return chain()
            .insertContent({ type: "inlineMath", attrs: { latex: "" } })
            .run()
        },
    }
  },
})
