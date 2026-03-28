"use client"

import { memo, useRef, useCallback, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { GamePiece } from "@/lib/blast"

interface BlastPieceTrayProps {
  tray: (GamePiece | null)[]
  onDragStart: (index: number) => void
  onDragMove: (clientX: number, clientY: number) => void
  onDragEnd: () => void
  disabled?: boolean
}

export const BlastPieceTray = memo(function BlastPieceTray({
  tray,
  onDragStart,
  onDragMove,
  onDragEnd,
  disabled,
}: BlastPieceTrayProps) {
  return (
    <div className="flex items-center justify-center gap-3 py-3 px-2">
      {tray.map((piece, i) => (
        <DraggablePiece
          key={i}
          piece={piece}
          index={i}
          disabled={disabled}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragEnd={onDragEnd}
        />
      ))}
    </div>
  )
})

function DraggablePiece({
  piece,
  index,
  disabled,
  onDragStart,
  onDragMove,
  onDragEnd,
}: {
  piece: GamePiece | null
  index: number
  disabled?: boolean
  onDragStart: (index: number) => void
  onDragMove: (clientX: number, clientY: number) => void
  onDragEnd: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!piece || disabled) return
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      setIsDragging(true)
      onDragStart(index)
      onDragMove(e.clientX, e.clientY)
    },
    [piece, disabled, index, onDragStart, onDragMove]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      e.preventDefault()
      onDragMove(e.clientX, e.clientY)
    },
    [isDragging, onDragMove]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
      setIsDragging(false)
      onDragEnd()
    },
    [isDragging, onDragEnd]
  )

  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative rounded-xl min-w-[68px] min-h-[68px]",
        "flex items-center justify-center touch-none select-none",
        piece
          ? isDragging
            ? "bg-[var(--background-tertiary)]"
            : "bg-[var(--glass-fill)] border border-[var(--glass-border)] cursor-grab active:cursor-grabbing"
          : "border border-dashed border-[var(--glass-border)] bg-transparent"
      )}
      style={{ padding: "10px" }}
      animate={isDragging ? { scale: 0.85, opacity: 0.3 } : { scale: 1, opacity: piece ? 1 : 0.35 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {piece ? (
        <PieceMiniGrid shape={piece.shape.grid} color={piece.color} />
      ) : (
        <div className="w-8 h-8 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[var(--muted-foreground)] opacity-30" />
        </div>
      )}
    </motion.div>
  )
}

function PieceMiniGrid({
  shape,
  color,
}: {
  shape: boolean[][]
  color: string
}) {
  const cols = Math.max(...shape.map((r) => r.length))

  return (
    <div
      className="inline-grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: "2px",
      }}
    >
      {shape.flatMap((row, r) =>
        Array.from({ length: cols }, (_, c) => (
          <div
            key={`${r}-${c}`}
            className="w-4 h-4 rounded-[3px]"
            style={{
              backgroundColor: row[c] ? color : "transparent",
              boxShadow: row[c]
                ? "inset 0 -1px 0 rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.15)"
                : undefined,
            }}
          />
        ))
      )}
    </div>
  )
}
