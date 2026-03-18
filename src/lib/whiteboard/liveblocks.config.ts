import { createClient } from "@liveblocks/client"
import { createRoomContext } from "@liveblocks/react"

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
  throttle: 16, // ~60fps cursor updates
})

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
} = createRoomContext(client)
