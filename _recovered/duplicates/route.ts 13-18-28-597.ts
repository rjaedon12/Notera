import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// GET /api/resources - Get resources
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const type = searchParams.get("type")

    const where: Record<string, unknown> = {}

    // Filter by visibility - show public + own resources
    if (session?.user) {
      where.OR = [
        { visibility: "PUBLIC" },
        { ownerId: session.user.id }
      ]
    } else {
      where.visibility = "PUBLIC"
    }

    if (search) {
      where.title = { contains: search }
    }

    if (type) {
      where.type = type
    }

    const resources = await prisma.resource.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true } },
        tags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error("Error fetching resources:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/resources - Create a resource
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { title, type, visibility = "PUBLIC", content } = body

    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    const validTypes = ["STUDY_GUIDE", "TIMELINE", "IMAGE", "DOCUMENT"]
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      )
    }

    const validVisibilities = ["PUBLIC", "PRIVATE", "GROUP"]
    if (!validVisibilities.includes(visibility)) {
      return NextResponse.json(
        { error: "Invalid visibility" },
        { status: 400 }
      )
    }

    const resource = await prisma.resource.create({
      data: {
        title: title.trim(),
        type,
        visibility,
        content: content?.trim() || null,
        storagePath: null,
        ownerId: session.user.id
      },
      include: {
        owner: { select: { id: true, name: true } },
        tags: {
          include: { tag: true }
        }
      }
    })

    return NextResponse.json(resource, { status: 201 })
  } catch (error) {
    console.error("Error creating resource:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
