import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/forum — list all posts (paginated, newest first)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")))
    const skip = (page - 1) * limit

    const [posts, total] = await Promise.all([
      prisma.forumPost.findMany({
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, image: true } },
          _count: { select: { replies: true } },
        },
      }),
      prisma.forumPost.count(),
    ])

    return Response.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Forum GET error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/forum — create a new post (auth required)
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, content } = body

    if (!title || !title.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 })
    }
    if (!content || !content.trim()) {
      return Response.json({ error: "Content is required" }, { status: 400 })
    }
    if (title.trim().length > 200) {
      return Response.json({ error: "Title must be under 200 characters" }, { status: 400 })
    }
    if (content.trim().length > 10000) {
      return Response.json({ error: "Content must be under 10,000 characters" }, { status: 400 })
    }

    const post = await prisma.forumPost.create({
      data: {
        title: title.trim(),
        body: content.trim(),
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
        _count: { select: { replies: true } },
      },
    })

    return Response.json(post, { status: 201 })
  } catch (error) {
    console.error("Forum POST error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
