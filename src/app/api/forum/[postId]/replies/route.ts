import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/forum/[postId]/replies — add a reply to a post (auth required)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId } = await params

    // Verify post exists
    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { id: true },
    })

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 })
    }

    const body = await req.json()
    const { content } = body

    if (!content || !content.trim()) {
      return Response.json({ error: "Content is required" }, { status: 400 })
    }
    if (content.trim().length > 5000) {
      return Response.json({ error: "Reply must be under 5,000 characters" }, { status: 400 })
    }

    const reply = await prisma.forumReply.create({
      data: {
        body: content.trim(),
        userId: session.user.id,
        postId,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    })

    return Response.json(reply, { status: 201 })
  } catch (error) {
    console.error("Forum reply POST error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
