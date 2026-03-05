import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/groups/[groupId]/leave - Leave a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = await params

    // Find membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this group" },
        { status: 400 }
      )
    }

    // Owners cannot leave, they must delete the group
    if (membership.role === "OWNER") {
      return NextResponse.json(
        { error: "Owners cannot leave. Transfer ownership or delete the group." },
        { status: 400 }
      )
    }

    // Remove membership using composite key
    await prisma.groupMember.delete({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error leaving group:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
