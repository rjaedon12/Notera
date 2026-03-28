import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/spaces/join — join space by { inviteCode }
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { inviteCode } = await request.json()

    if (!inviteCode || typeof inviteCode !== "string") {
      return Response.json(
        { error: "Invite code is required" },
        { status: 400 }
      )
    }

    const space = await prisma.space.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!space) {
      return Response.json({ error: "Invalid invite code" }, { status: 404 })
    }

    // Already a member?
    if (space.members.length > 0) {
      return Response.json(
        { error: "You are already a member of this space" },
        { status: 400 }
      )
    }

    // Auto-assign role: STUDENT for classrooms, MEMBER for collaborative spaces
    const joinRole = space.type === "CLASSROOM" ? "STUDENT" : "MEMBER"

    await prisma.spaceMember.create({
      data: {
        userId: session.user.id,
        spaceId: space.id,
        role: joinRole,
      },
    })

    // Send notification to space owner
    await prisma.notification.create({
      data: {
        userId: space.ownerId,
        type: "SPACE_INVITE",
        title: "New member joined",
        message: `${session.user.name || "Someone"} joined your space "${space.name}"`,
        link: `/spaces/${space.id}`,
      },
    })

    const updated = await prisma.space.findUnique({
      where: { id: space.id },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { members: true, sets: true, assignments: true } },
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Join space error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
