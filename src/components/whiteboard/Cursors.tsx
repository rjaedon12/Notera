"use client"

import type { Point } from "@/lib/whiteboard/types"

interface CursorsProps {
  collaborators: {
    connectionId: number
    presence: {
      cursor: Point | null
      userName: string
      userColor: string
    } | null
    info?: { name?: string; color?: string }
  }[]
  camera: { x: number; y: number; zoom: number }
}

export function Cursors({ collaborators, camera }: CursorsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
      {collaborators.map((c) => {
        const cursor = c.presence?.cursor
        if (!cursor || isNaN(cursor.x) || isNaN(cursor.y)) return null

        const color = c.presence?.userColor || c.info?.color || "#1971c2"
        const name = c.presence?.userName || c.info?.name || "Anonymous"

        // Convert canvas coordinates to screen coordinates
        const screenX = cursor.x * camera.zoom + camera.x
        const screenY = cursor.y * camera.zoom + camera.y

        return (
          <div
            key={c.connectionId}
            className="absolute transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${screenX}px, ${screenY}px)`,
            }}
          >
            {/* Cursor arrow SVG */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              className="drop-shadow-sm"
              style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.15))` }}
            >
              <path
                d="M3 3L10 17L12.5 10.5L19 8L3 3Z"
                fill={color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* Name label */}
            <div
              className="absolute left-4 top-4 px-2 py-0.5 rounded-full text-[11px] font-medium text-white whitespace-nowrap shadow-sm"
              style={{ backgroundColor: color }}
            >
              {name}
            </div>
          </div>
        )
      })}
    </div>
  )
}
