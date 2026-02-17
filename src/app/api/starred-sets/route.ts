import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { resolveSessionUserId } from "@/lib/session-user"

// GET /api/starred-sets - Get all starred study set IDs for the user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveSessionUserId(session.user)
    if (!userId) {
      return NextResponse.json([], { status: 200 })
    }

    const starredSets = await prisma.starredSet.findMany({
      where: { userId },
      select: { setId: true },
    })

    return NextResponse.json(starredSets.map((s: { setId: string }) => s.setId))
  } catch (error) {
    console.error("Get starred sets error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
