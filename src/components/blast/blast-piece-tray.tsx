"use client"

import { memo, useRef, useCallback, useState } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { GamePiece } from "@/lib/blast"
import { BOARD_SIZE, canPlace } from "@/lib/blast"

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
    <div className="flex items-center justify-center gap-4 py-3">
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
        "relative p-2 rounded-lg border-2 transition-colors min-w-[60px] min-h-[60px]",
        "flex items-center justify-center touch-none select-none",
        piece
          ? isDragging
            ? "border-primary bg-primary/10 shadow-lg scale-110 opacity-50"
            : "border-border bg-card hover:border-muted-foreground cursor-grab active:cursor-grabbing"
          : "border-transparent bg-muted/30 opacity-30"
      )}
      animate={isDragging ? { scale: 0.85, opacity: 0.4 } : { scale: 1, opacity: piece ? 1 : 0.3 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {piece ? (
        <PieceMiniGrid shape={piece.shape.grid} color={piece.color} />
      ) : (
        <div className="w-6 h-6" />
      )}
    </motion.div>
  )
}

/** Renders a small preview of a piece shape. */
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
      className="inline-grid gap-[2px]"
      style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
    >
      {shape.flatMap((row, r) =>
        Array.from({ length: cols }, (_, c) => (
          <div
            key={`${r}-${c}`}
            className="w-3 h-3 rounded-[2px]"
            style={{
              backgroundColor: row[c] ? color : "transparent",
            }}
          />
        ))
      )}
    </div>
  )
}
