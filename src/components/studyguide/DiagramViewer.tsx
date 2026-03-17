"use client"

interface DiagramViewerProps {
  component: React.ReactNode
  caption?: string
}

/** Responsive wrapper for SVG diagrams with optional caption */
export function DiagramViewer({ component, caption }: DiagramViewerProps) {
  return (
    <figure className="flex flex-col items-center gap-3 py-2">
      <div
        className="w-full max-w-sm rounded-2xl p-4 flex items-center justify-center"
        style={{
          background: "var(--muted)",
          border: "1px solid var(--glass-border)",
        }}
      >
        {component}
      </div>
      {caption && (
        <figcaption
          className="text-xs text-center max-w-md leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
