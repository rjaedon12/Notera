import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { saveTimeline, loadTimeline } from "@/lib/timeline-save"

// PUT /api/timeline/[resourceId] - Save timeline events and arrows
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
    }

    const { resourceId } = await params
    
    // Verify resource exists and user has access
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, ownerId: true, type: true }
    })

    if (!resource) {
      return NextResponse.json({ ok: false, error: "Resource not found" }, { status: 404 })
    }

    if (resource.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
    }

    if (resource.type !== "TIMELINE") {
      return NextResponse.json({ ok: false, error: "Resource is not a timeline" }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()
    
    // Support both { data: { events, edges } } and { events, edges/arrows } formats
    const data = body.data || body
    const events = data.events || []
    const edges = data.edges || data.arrows || []

    // Call the new save function
    const result = await saveTimeline({
      resourceId,
      events,
      edges,
    })

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 })
    }

    // Load and return the updated timeline
    const updated = await loadTimeline(resourceId)

    return NextResponse.json({
      ok: true,
      savedEvents: result.savedEvents,
      savedArrows: result.savedArrows,
      resource: updated,
    })
  } catch (error) {
    console.error("Error in PUT /api/timeline/[resourceId]:", error)
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

// GET /api/timeline/[resourceId] - Get timeline with events and arrows
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resourceId: string }> }
) {
  try {
    const session = await auth()
    const { resourceId } = await params

    const resource = await loadTimeline(resourceId)

    if (!resource) {
      return NextResponse.json({ ok: false, error: "Resource not found" }, { status: 404 })
    }

    // Check visibility
    if (resource.visibility === "PRIVATE") {
      if (!session?.user) {
        return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 })
      }
      if (resource.ownerId !== session.user.id && session.user.role !== "ADMIN") {
        return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 })
      }
    }

    return NextResponse.json({
      ok: true,
      ...resource,
    })
  } catch (error) {
    console.error("Error in GET /api/timeline/[resourceId]:", error)
    return NextResponse.json(
      { 
        ok: false, 
        error: error instanceof Error ? error.message : "Internal server error" 
      },
      { status: 500 }
    )
  }
}
