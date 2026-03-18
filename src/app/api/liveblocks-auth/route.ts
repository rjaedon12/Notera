import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { Liveblocks } from "@liveblocks/node"
import { USER_COLORS } from "@/lib/whiteboard/types"

const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY || "sk_dev_placeholder",
})

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Pick a deterministic color based on user ID hash
  const colorIndex =
    session.user.id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % USER_COLORS.length
  const userColor = USER_COLORS[colorIndex]

  const liveblocksSession = liveblocks.prepareSession(session.user.id, {
    userInfo: {
      name: session.user.name || "Anonymous",
      image: session.user.image || "",
      color: userColor,
    },
  })

  // Grant access to all rooms (boards). In production you'd scope this.
  liveblocksSession.allow("board:*", liveblocksSession.FULL_ACCESS)

  const { body, status } = await liveblocksSession.authorize()
  return new Response(body, { status })
}
