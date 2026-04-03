import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/resources/[resourceId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await auth()
    const { resourceId } = await params

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        user: { select: { id: true, name: true } },
        timelineEvents: { orderBy: { sortOrder: "asc" } },
        timelineArrows: true,
      },
    })

    if (!resource) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Allow public resources for anyone, private only for owner
    if (resource.visibility === "PRIVATE" && resource.userId !== session?.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      ...resource,
      ownerId: resource.userId,
      owner: { id: resource.user.id, name: resource.user.name },
      storagePath: null,
      tags: [],
    })
  } catch (error) {
    console.error("Get resource error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/resources/[resourceId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resourceId } = await params
    const body = await request.json()

    const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
    if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (resource.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.visibility !== undefined && { visibility: body.visibility }),
        ...(body.content !== undefined && { content: body.content }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update resource error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/resources/[resourceId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resourceId } = await params

    const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
    const isAdmin = session.user.role === "ADMIN"
    if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (resource.userId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.resource.delete({ where: { id: resourceId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete resource error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
