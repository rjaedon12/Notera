import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/resources — list user's resources, optionally filter by type
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const type = request.nextUrl.searchParams.get("type")

    const where: Record<string, unknown> = { userId: session.user.id }
    if (type) where.type = type

    const resources = await prisma.resource.findMany({
      where,
      include: {
        timelineEvents: { orderBy: { sortOrder: "asc" } },
        timelineArrows: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error("Get resources error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/resources — create a new resource
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, type, visibility, content } = await request.json()

    if (!title || !type) {
      return NextResponse.json({ error: "Title and type are required" }, { status: 400 })
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        type,
        visibility: visibility || "PRIVATE",
        content: content || null,
        userId: session.user.id,
      },
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error("Create resource error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
