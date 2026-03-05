import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/groups/join — join group by { inviteCode }
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

    const group = await prisma.group.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
      include: {
        members: {
          where: { userId: session.user.id },
        },
      },
    })

    if (!group) {
      return Response.json({ error: "Invalid invite code" }, { status: 404 })
    }

    // Already a member?
    if (group.members.length > 0) {
      return Response.json(
        { error: "You are already a member of this group" },
        { status: 400 }
      )
    }

    await prisma.groupMember.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: "MEMBER",
      },
    })

    const updated = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, sets: true } },
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Join group error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
