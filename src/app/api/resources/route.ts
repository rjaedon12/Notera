import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/resources — list resources (public + user's own)
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const type = request.nextUrl.searchParams.get("type")
    const search = request.nextUrl.searchParams.get("search")

    // Show public resources to everyone, plus user's own private resources
    const where: Record<string, unknown> = {}
    if (session?.user?.id) {
      where.OR = [
        { visibility: "PUBLIC" },
        { userId: session.user.id },
      ]
    } else {
      where.visibility = "PUBLIC"
    }
    if (type) where.type = type
    if (search) where.title = { contains: search, mode: "insensitive" }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        timelineEvents: { orderBy: { sortOrder: "asc" } },
        timelineArrows: true,
      },
      orderBy: { updatedAt: "desc" },
    })

    // Map to shape the frontend expects (owner, tags, storagePath)
    const mapped = resources.map((r) => ({
      ...r,
      ownerId: r.userId,
      owner: { id: r.user.id, name: r.user.name },
      storagePath: null,
      tags: [],
    }))

    return NextResponse.json(mapped)
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
      include: {
        user: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({
      ...resource,
      ownerId: resource.userId,
      owner: { id: resource.user.id, name: resource.user.name },
      storagePath: null,
      tags: [],
    }, { status: 201 })
  } catch (error) {
    console.error("Create resource error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
