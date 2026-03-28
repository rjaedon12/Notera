"use client"

import { memo } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import type { GamePiece } from "@/lib/blast"

interface BlastPieceTrayProps {
  tray: (GamePiece | null)[]
  selectedIndex: number | null
  onSelect: (index: number) => void
  disabled?: boolean
}

export const BlastPieceTray = memo(function BlastPieceTray({
  tray,
  selectedIndex,
  onSelect,
  disabled,
}: BlastPieceTrayProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-3">
      {tray.map((piece, i) => (
        <motion.button
          key={i}
          disabled={!piece || disabled}
          className={cn(
            "relative p-2 rounded-lg border-2 transition-colors min-w-[60px] min-h-[60px]",
            "flex items-center justify-center",
            piece && selectedIndex === i
              ? "border-white bg-zinc-700 shadow-lg shadow-white/10"
              : piece
                ? "border-zinc-600 bg-zinc-800 hover:border-zinc-400"
                : "border-zinc-800 bg-zinc-900 opacity-30"
          )}
          whileHover={piece && !disabled ? { scale: 1.05 } : {}}
          whileTap={piece && !disabled ? { scale: 0.95 } : {}}
          animate={
            piece && selectedIndex === i
              ? { y: -4 }
              : { y: 0 }
          }
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          onClick={() => piece && !disabled && onSelect(i)}
        >
          {piece ? (
            <PieceMiniGrid shape={piece.shape.grid} color={piece.color} />
          ) : (
            <div className="w-6 h-6" />
          )}
        </motion.button>
      ))}
    </div>
  )
})

/** Renders a small preview of a piece shape. */
function PieceMiniGrid({
  shape,
  color,
}: {
  shape: boolean[][]
  color: string
}) {
  const rows = shape.length
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
