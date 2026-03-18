import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/forum/[postId]/reactions — get reaction counts + user's reaction
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const session = await auth()

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

    return Response.json({ likes, dislikes, userReaction: userReaction?.type || null })
  } catch (error) {
    console.error("Reactions GET error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/forum/[postId]/reactions — toggle a reaction (auth required)
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
    const body = await req.json()
    const { type } = body

    if (!type || !["LIKE", "DISLIKE"].includes(type)) {
      return Response.json({ error: "Invalid reaction type" }, { status: 400 })
    }

    const post = await prisma.forumPost.findUnique({ where: { id: postId }, select: { id: true } })
    if (!post) return Response.json({ error: "Post not found" }, { status: 404 })

    const userId = session.user.id

    // Check existing reaction of same type
    const existing = await prisma.forumReaction.findFirst({
      where: { postId, userId, type },
    })

    if (existing) {
      // Toggle off — remove the reaction
      await prisma.forumReaction.delete({ where: { id: existing.id } })
    } else {
      // Remove opposite reaction if exists, then create
      await prisma.forumReaction.deleteMany({
        where: { postId, userId },
      })
      await prisma.forumReaction.create({
        data: { type, userId, postId },
      })
    }

    // Return updated counts
    const [likes, dislikes] = await Promise.all([
      prisma.forumReaction.count({ where: { postId, type: "LIKE" } }),
      prisma.forumReaction.count({ where: { postId, type: "DISLIKE" } }),
    ])

    const currentReaction = await prisma.forumReaction.findFirst({
      where: { postId, userId },
      select: { type: true },
    })

    return Response.json({
      likes,
      dislikes,
      userReaction: currentReaction?.type || null,
    })
  } catch (error) {
    console.error("Reactions POST error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
