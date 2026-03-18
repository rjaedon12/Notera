import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/forum/[postId] — get a single post with its replies + reactions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await auth()

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      include: {
        user: { select: { id: true, name: true, image: true } },
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, image: true } },
            _count: { select: { childReplies: true } },
          },
        },
        _count: { select: { replies: true } },
      },
    })

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 })
    }

    // Get reaction counts for the post
    const [likes, dislikes, userReaction] = await Promise.all([
      prisma.forumReaction.count({ where: { postId, type: "LIKE" } }),
      prisma.forumReaction.count({ where: { postId, type: "DISLIKE" } }),
      session?.user?.id
        ? prisma.forumReaction.findFirst({
            where: { postId, userId: session.user.id },
            select: { type: true },
          })
        : null,
    ])

    return Response.json({
      ...post,
      reactions: { likes, dislikes, userReaction: userReaction?.type || null },
    })
  } catch (error) {
    console.error("Forum post GET error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/forum/[postId] — delete own post (auth required)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { postId } = await params

    const post = await prisma.forumPost.findUnique({
      where: { id: postId },
      select: { userId: true },
    })

    if (!post) {
      return Response.json({ error: "Post not found" }, { status: 404 })
    }

    // Only the post author or an admin can delete
    const isAdmin = session.user.role === "ADMIN"
    if (post.userId !== session.user.id && !isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.forumPost.delete({ where: { id: postId } })

    return Response.json({ success: true })
  } catch (error) {
    console.error("Forum post DELETE error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
