import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/spaces/[spaceId]/announcements — list announcements
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

    const announcements = await prisma.spaceAnnouncement.findMany({
      where: { spaceId },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error("Get announcements error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/spaces/[spaceId]/announcements — create announcement (owner/moderator)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const { title, message } = await request.json()

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      )
    }

    const membership = await prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id,
      },
      include: { user: { select: { role: true } } },
    })
    const spaceInfo = await prisma.space.findUnique({ where: { id: spaceId }, select: { hubSlug: true } })
    const canPost = membership && (
      membership.role === "OWNER" ||
      membership.role === "MODERATOR" ||
      (spaceInfo?.hubSlug && (membership.user.role === "ADMIN" || membership.user.role === "TEACHER"))
    )
    if (!canPost) {
      return NextResponse.json(
        { error: "Only owners and moderators can post announcements" },
        { status: 403 }
      )
    }

    const announcement = await prisma.spaceAnnouncement.create({
      data: {
        title,
        message,
        spaceId,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    })

    // Notify all other members
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: { members: { select: { userId: true } } },
    })

    if (space) {
      const memberIds = space.members
        .map((m: { userId: string }) => m.userId)
        .filter((id: string) => id !== session.user.id)

      if (memberIds.length > 0) {
        await prisma.notification.createMany({
          data: memberIds.map((userId: string) => ({
            userId,
            type: "SPACE_ANNOUNCEMENT" as const,
            title: `Announcement: ${title}`,
            message: message.slice(0, 120),
            link: `/spaces/${spaceId}`,
          })),
        })
      }
    }

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error("Create announcement error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
