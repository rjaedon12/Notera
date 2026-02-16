import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/groups/[groupId] - Get group details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = await params

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        },
        sets: {
          include: {
            studySet: {
              include: {
                owner: { select: { id: true, name: true } },
                _count: { select: { cards: true } }
              }
            }
          }
        }
      }
    })

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 })
    }

    // Check if user is a member
    const isMember = group.members.some((m: { userId: string }) => m.userId === session.user.id)
    if (!isMember) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error("Error fetching group:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/groups/[groupId] - Delete a group (owner only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = await params

    // Check if user is owner
    const membership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId: session.user.id,
        role: "OWNER"
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Only the owner can delete a group" },
        { status: 403 }
      )
    }

    // Delete the group (cascades to memberships, group sets, group resources)
    await prisma.group.delete({
      where: { id: groupId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting group:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
