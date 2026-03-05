import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/groups/[id]/sets — add a set to the group (owner only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { groupId } = await params
    const { setId } = await request.json()

    if (!setId) {
      return Response.json({ error: "setId is required" }, { status: 400 })
    }

    // Verify group exists and user is owner
    const group = await prisma.group.findUnique({ where: { id: groupId } })

    if (!group) {
      return Response.json({ error: "Group not found" }, { status: 404 })
    }
    if (group.ownerId !== session.user.id) {
      return Response.json(
        { error: "Only the group owner can add sets" },
        { status: 403 }
      )
    }

    // Verify set exists
    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })
    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }

    // Check for duplicate
    const existing = await prisma.groupSet.findUnique({
      where: { groupId_setId: { groupId, setId } },
    })
    if (existing) {
      return Response.json(
        { error: "Set already added to this group" },
        { status: 400 }
      )
    }

    const groupSet = await prisma.groupSet.create({
      data: { groupId, setId },
    })

    return Response.json(groupSet, { status: 201 })
  } catch (error) {
    console.error("Add set to group error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
