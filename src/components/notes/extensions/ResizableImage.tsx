"use client"

import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react"
import { useState, useRef, useCallback, useEffect } from "react"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableImage: {
      setImage: (options: { src: string; alt?: string; title?: string; width?: number }) => ReturnType
    }
  }
}

/* ====================================================================
   Resizable Image Node View — Notion-style drag-to-resize
   ==================================================================== */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ResizableImageComponent({ node, updateAttributes, selected }: any) {
  const { src, alt, title, width } = node.attrs
  const [resizing, setResizing] = useState(false)
  const [currentWidth, setCurrentWidth] = useState<number>(width || 100)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const handleSideRef = useRef<"left" | "right">("right")

  // Sync from node attrs when they change externally
  useEffect(() => {
    if (!resizing) {
      setCurrentWidth(node.attrs.width || 100)
    }
  }, [node.attrs.width, resizing])

  const onMouseDown = useCallback(
    (e: React.MouseEvent, side: "left" | "right") => {
      e.preventDefault()
      e.stopPropagation()
      setResizing(true)
      startXRef.current = e.clientX
      startWidthRef.current = currentWidth
      handleSideRef.current = side
    },
    [currentWidth]
  )

  useEffect(() => {
    if (!resizing) return

    const onMouseMove = (e: MouseEvent) => {
      const wrapper = wrapperRef.current?.parentElement
      if (!wrapper) return
      const containerWidth = wrapper.clientWidth

      const deltaX = e.clientX - startXRef.current
      // When dragging the left handle, moving left = wider; right handle, moving right = wider
      const direction = handleSideRef.current === "right" ? 1 : -1
      const deltaPercent = (deltaX * direction / containerWidth) * 100
      const newWidth = Math.max(10, Math.min(100, startWidthRef.current + deltaPercent))

      setCurrentWidth(Math.round(newWidth))
    }

    const onMouseUp = () => {
      setResizing(false)
      updateAttributes({ width: currentWidth })
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [resizing, currentWidth, updateAttributes])

  // Persist final width on resize end
  useEffect(() => {
    if (!resizing && currentWidth !== (node.attrs.width || 100)) {
      updateAttributes({ width: currentWidth })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resizing])

  return (
    <NodeViewWrapper className="resizable-image-wrapper" data-type="resizable-image">
      <div
        ref={wrapperRef}
        className={`resizable-image-container ${selected ? "selected" : ""} ${resizing ? "resizing" : ""}`}
        style={{ width: `${currentWidth}%` }}
      >
        <img
          src={src}
          alt={alt || ""}
          title={title || ""}
          draggable={false}
        />

        {/* Left resize handle */}
        <div
          className="resize-handle resize-handle-left"
          onMouseDown={(e) => onMouseDown(e, "left")}
        >
          <div className="resize-handle-bar" />
        </div>

        {/* Right resize handle */}
        <div
          className="resize-handle resize-handle-right"
          onMouseDown={(e) => onMouseDown(e, "right")}
        >
          <div className="resize-handle-bar" />
        </div>

        {/* Width indicator while resizing */}
        {resizing && (
          <div className="resize-width-indicator">
            {currentWidth}%
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

/* ====================================================================
   TipTap Extension Definition
   ==================================================================== */

export const ResizableImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
      width: { default: 100 }, // percentage of container width
    }
  },

  parseHTML() {
    return [{ tag: "img[src]" }]
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes)]
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent)
  },

  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string; title?: string; width?: number }) =>
        ({ chain }: { chain: () => ReturnType<import("@tiptap/core").Editor["chain"]> }) => {
          return chain()
            .insertContent({ type: this.name, attrs: options })
            .run()
        },
    }
  },
})
