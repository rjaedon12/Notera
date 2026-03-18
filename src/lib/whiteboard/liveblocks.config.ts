import { createClient } from "@liveblocks/client"
import { createRoomContext } from "@liveblocks/react"
import type { Presence } from "@/lib/whiteboard/types"

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  throttle: 16, // ~60fps cursor updates
})

// Keep storage simple — elements are synced via broadcast events, not LiveStorage
type RoomStorage = {
  [key: string]: unknown
}

export const {
  RoomProvider,
  useOthers,
  useUpdateMyPresence,
  useSelf,
  useStorage,
  useMutation,
  useBroadcastEvent,
  useEventListener,
  useStatus,
} = createRoomContext<Presence, RoomStorage>(client)
