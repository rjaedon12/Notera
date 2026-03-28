import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/spaces/[spaceId]/sets — add a set to the space (owner/moderator only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const { setId } = await request.json()

    if (!setId) {
      return Response.json({ error: "setId is required" }, { status: 400 })
    }

    // Verify space exists and user has permission
    const membership = await prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id,
        role: { in: ["OWNER", "MODERATOR"] },
      },
    })

    if (!membership) {
      return Response.json(
        { error: "Only owners and moderators can add sets" },
        { status: 403 }
      )
    }

    // Verify set exists
    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })
    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }

    // Check for duplicate
    const existing = await prisma.spaceSet.findUnique({
      where: { spaceId_setId: { spaceId, setId } },
    })
    if (existing) {
      return Response.json(
        { error: "Set already added to this space" },
        { status: 400 }
      )
    }

    const spaceSet = await prisma.spaceSet.create({
      data: { spaceId, setId },
    })

    return Response.json(spaceSet, { status: 201 })
  } catch (error) {
    console.error("Add set to space error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/spaces/[spaceId]/sets — remove a set from the space
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const { setId } = await request.json()

    const membership = await prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id,
        role: { in: ["OWNER", "MODERATOR"] },
      },
    })

    if (!membership) {
      return Response.json(
        { error: "Only owners and moderators can remove sets" },
        { status: 403 }
      )
    }

    await prisma.spaceSet.delete({
      where: { spaceId_setId: { spaceId, setId } },
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Remove set from space error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
