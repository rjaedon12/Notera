import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/groups/join - Join a group by invite code
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { inviteCode } = body

    if (!inviteCode || typeof inviteCode !== "string") {
      return NextResponse.json(
        { error: "Invite code is required" },
        { status: 400 }
      )
    }

    // Find group by invite token
    const group = await prisma.group.findFirst({
      where: { inviteToken: inviteCode.toUpperCase() },
      include: {
        members: {
          where: { userId: session.user.id }
        }
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: "Invalid invite code" },
        { status: 404 }
      )
    }

    // Check if already a member
    if (group.members.length > 0) {
      return NextResponse.json(
        { error: "You are already a member of this group" },
        { status: 400 }
      )
    }

    // Add member
    await prisma.groupMembership.create({
      data: {
        groupId: group.id,
        userId: session.user.id,
        role: "MEMBER"
      }
    })

    return NextResponse.json({ success: true, groupId: group.id })
  } catch (error) {
    console.error("Error joining group:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
