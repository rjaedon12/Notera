"use client"

import { useCallback, useEffect, useRef } from "react"
import type { WhiteboardElement, Presence, Point, ToolType } from "@/lib/whiteboard/types"
import {
  useOthers,
  useUpdateMyPresence,
  useSelf,
  useBroadcastEvent,
  useEventListener,
} from "@/lib/whiteboard/liveblocks.config"

interface UseCollaborationOptions {
  elements: WhiteboardElement[]
  setElements: (elements: WhiteboardElement[]) => void
  tool: ToolType
  userName: string
  userColor: string
  userId: string
}

export function useCollaboration({
  elements,
  setElements,
  tool,
  userName,
  userColor,
  userId,
}: UseCollaborationOptions) {
  const others = useOthers()
  const updateMyPresence = useUpdateMyPresence()
  const self = useSelf()
  const broadcastEvent = useBroadcastEvent()
  const lastBroadcast = useRef<number>(0)

  // Update my cursor position
  const updateCursor = useCallback(
    (cursor: Point | null) => {
      updateMyPresence({
        cursor,
        selectedTool: tool,
        userName,
        userColor,
        userId,
      } as Presence)
    },
    [updateMyPresence, tool, userName, userColor, userId]
  )

  // Broadcast element changes (throttled)
  const broadcastElements = useCallback(
    (newElements: WhiteboardElement[]) => {
      const now = Date.now()
      if (now - lastBroadcast.current < 50) return // throttle to 20fps
      lastBroadcast.current = now
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      broadcastEvent({ type: "elements-update", elements: newElements } as any)
    },
    [broadcastEvent]
  )

  // Listen for element updates from others
  useEventListener(({ event }) => {
    const e = event as unknown as { type: string; elements?: WhiteboardElement[] }
    if (e.type === "elements-update" && e.elements) {
      setElements(e.elements)
    }
  })

  // Update presence when tool changes
  useEffect(() => {
    updateMyPresence({
      selectedTool: tool,
      userName,
      userColor,
      userId,
    } as Partial<Presence>)
  }, [tool, userName, userColor, userId, updateMyPresence])

  // Collaborators with cursors
  const collaborators = others.map((other) => ({
    connectionId: other.connectionId,
    presence: other.presence as Presence | null,
    info: other.info as { name?: string; image?: string; color?: string } | undefined,
  }))

  return {
    collaborators,
    updateCursor,
    broadcastElements,
    self,
    connectionCount: others.length,
  }
}
