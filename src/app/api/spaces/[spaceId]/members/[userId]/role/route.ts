import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/spaces/[spaceId]/members/[userId]/role — promote or demote a member
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string; userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId, userId: targetUserId } = await params
    const { role } = await request.json()

    if (!role || !["MODERATOR", "STUDENT"].includes(role)) {
      return NextResponse.json({ error: "Role must be MODERATOR or STUDENT" }, { status: 400 })
    }

    // Only the OWNER can change roles
    const ownerMember = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id, role: "OWNER" },
    })
    if (!ownerMember) {
      return NextResponse.json({ error: "Only the space owner can change roles" }, { status: 403 })
    }

    // Cannot change own role
    if (targetUserId === session.user.id) {
      return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 })
    }

    // Check the target is actually a member
    const targetMember = await prisma.spaceMember.findUnique({
      where: { userId_spaceId: { userId: targetUserId, spaceId } },
    })
    if (!targetMember) {
      return NextResponse.json({ error: "User is not a member of this space" }, { status: 404 })
    }

    // Cannot demote another OWNER
    if (targetMember.role === "OWNER") {
      return NextResponse.json({ error: "Cannot change the role of another owner" }, { status: 400 })
    }

    const updated = await prisma.spaceMember.update({
      where: { userId_spaceId: { userId: targetUserId, spaceId } },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, streak: true, longestStreak: true, role: true } },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating member role:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
