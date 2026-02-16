import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/resources/[resourceId] - Get a resource
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
        owner: { select: { id: true, name: true } },
        tags: {
          include: { tag: true }
        },
        timelineEvents: {
          orderBy: { sortOrder: "asc" },
          include: {
            arrowsFrom: true,
          }
        }
      }
    })

    // Flatten arrows from timelineEvents for easier consumption
    const arrows = resource?.timelineEvents?.flatMap(event =>
      event.arrowsFrom?.map(arrow => ({
        id: arrow.id,
        fromEventId: arrow.fromEventId,
        toEventId: arrow.toEventId,
        label: arrow.label,
      })) || []
    ) || []

    // Add arrows to response (will be merged in final response)

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // Check visibility
    if (resource.visibility === "PRIVATE") {
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      if (resource.ownerId !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    // Return resource with arrows attached
    return NextResponse.json({ ...resource, arrows })
  } catch (error) {
    console.error("Error fetching resource:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/resources/[resourceId] - Delete a resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resourceId } = await params

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    })

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // Check ownership or admin
    if (resource.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Persist deletes across restarts by hard-deleting DB rows
    // and revalidating cached pages that may still show stale data.
    await prisma.$transaction([
      prisma.resourceTag.deleteMany({ where: { resourceId } }),
      prisma.groupResource.deleteMany({ where: { resourceId } }),
      prisma.timelineArrow.deleteMany({
        where: {
          OR: [
            { fromEvent: { resourceId } },
            { toEvent: { resourceId } }
          ]
        }
      }),
      prisma.timelineEvent.deleteMany({ where: { resourceId } }),
      prisma.resource.delete({ where: { id: resourceId } })
    ])

    // Revalidate key pages that may have cached data
    revalidatePath("/resources")
    revalidatePath("/timeline-builder")

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error deleting resource:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/resources/[resourceId] - Update a resource
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resourceId } = await params
    const body = await request.json()

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    })

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // Check ownership or admin
    if (resource.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { title, content, visibility } = body

    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(title && { title: title.trim() }),
        ...(content !== undefined && { content: content?.trim() || null }),
        ...(visibility && { visibility })
      },
      include: {
        owner: { select: { id: true, name: true } },
        tags: { include: { tag: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating resource:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/resources/[resourceId] - Partial update (e.g., visibility toggle)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resourceId } = await params
    const body = await request.json()

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId }
    })

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 })
    }

    // Check ownership or admin
    if (resource.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { visibility } = body

    const updated = await prisma.resource.update({
      where: { id: resourceId },
      data: {
        ...(visibility && { visibility })
      },
      include: {
        owner: { select: { id: true, name: true } },
        tags: { include: { tag: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error patching resource:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
