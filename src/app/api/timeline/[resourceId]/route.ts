import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PUT /api/timeline/[resourceId] — save timeline events + arrows
export async function PUT(
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
    const { data } = body

    if (!data) {
      return NextResponse.json({ error: "Missing data payload" }, { status: 400 })
    }

    const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
    if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (resource.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Delete existing events and arrows, then recreate
    await prisma.timelineArrow.deleteMany({ where: { resourceId } })
    await prisma.timelineEvent.deleteMany({ where: { resourceId } })

    // Create events
    const eventIdMap = new Map<string, string>()
    const events = data.events || []

    for (const evt of events) {
      const created = await prisma.timelineEvent.create({
        data: {
          dateLabel: evt.date || evt.dateLabel || "",
          title: evt.title || "",
          body: evt.description || evt.body || null,
          sortOrder: evt.sortOrder ?? 0,
          posX: evt.x ?? evt.posX ?? 0,
          posY: evt.y ?? evt.posY ?? 0,
          resourceId,
        },
      })
      eventIdMap.set(evt.id, created.id)
    }

    // Create arrows (edges)
    const edges = data.edges || []
    for (const edge of edges) {
      const fromId = eventIdMap.get(edge.fromEventId)
      const toId = eventIdMap.get(edge.toEventId)
      if (fromId && toId) {
        await prisma.timelineArrow.create({
          data: {
            label: edge.label || null,
            fromEventId: fromId,
            toEventId: toId,
            resourceId,
          },
        })
      }
    }

    // Return updated resource
    const updated = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        timelineEvents: { orderBy: { sortOrder: "asc" } },
        timelineArrows: true,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Save timeline error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/timeline/[resourceId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resourceId } = await params

    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      include: {
        timelineEvents: { orderBy: { sortOrder: "asc" } },
        timelineArrows: true,
      },
    })

    if (!resource) return NextResponse.json({ error: "Not found" }, { status: 404 })

    return NextResponse.json(resource)
  } catch (error) {
    console.error("Get timeline error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
