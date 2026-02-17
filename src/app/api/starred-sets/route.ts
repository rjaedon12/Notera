import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/starred-sets - Get all starred study set IDs for the user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const starredSets = await prisma.starredSet.findMany({
      where: { userId: session.user.id },
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
