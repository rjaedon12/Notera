import { createClient } from "@liveblocks/client"
import { createRoomContext } from "@liveblocks/react"
import type { Presence, Storage } from "@/lib/whiteboard/types"

const client = createClient({
  authEndpoint: "/api/liveblocks-auth",
  throttle: 16, // ~60fps cursor updates
})

type RoomStorage = {
  elements: Storage["elements"]
  background: Storage["background"]
  bgColor: Storage["bgColor"]
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
