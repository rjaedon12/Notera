import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/spaces/[spaceId] - Get space details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params

    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                streak: true,
                longestStreak: true,
                role: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        sets: {
          include: {
            set: {
              include: {
                user: { select: { id: true, name: true } },
                _count: { select: { cards: true } },
              },
            },
          },
        },
        assignments: {
          include: {
            assignedBy: { select: { id: true, name: true } },
            flashcardSet: { select: { id: true, title: true } },
            questionBank: { select: { id: true, title: true } },
            dbqPrompt: { select: { id: true, title: true } },
          },
          orderBy: { assignedAt: "desc" },
        },
        announcements: {
          include: {
            author: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    })

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 })
    }

    // Check if user is a member
    const isMember = space.members.some(
      (m: { userId: string }) => m.userId === session.user.id
    )
    if (!isMember) {
      return NextResponse.json({ error: "NOT_MEMBER" }, { status: 403 })
    }

    // Build leaderboard from members' streak data
    const leaderboard = space.members
      .map((m) => ({
        userId: m.user.id,
        name: m.user.name || "Anonymous",
        image: m.user.image,
        streak: m.user.streak,
        longestStreak: m.user.longestStreak,
        role: m.role,
      }))
      .sort((a, b) => b.streak - a.streak)

    return NextResponse.json({ ...space, leaderboard })
  } catch (error) {
    console.error("Error fetching space:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/spaces/[spaceId] - Delete a space (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params

    const membership = await prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id,
        role: "OWNER",
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Only the owner can delete a space" },
        { status: 403 }
      )
    }

    await prisma.space.delete({
      where: { id: spaceId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting space:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
