import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/spaces/[spaceId]/leaderboard — get streak leaderboard for the space
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params

    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const members = await prisma.spaceMember.findMany({
      where: { spaceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            streak: true,
            longestStreak: true,
          },
        },
      },
    })

    const leaderboard = members
      .map((m) => ({
        userId: m.user.id,
        name: m.user.name || "Anonymous",
        image: m.user.image,
        streak: m.user.streak,
        longestStreak: m.user.longestStreak,
        role: m.role,
        joinedAt: m.joinedAt,
      }))
      .sort((a, b) => b.streak - a.streak || b.longestStreak - a.longestStreak)

    return NextResponse.json(leaderboard)
  } catch (error) {
    console.error("Get leaderboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
