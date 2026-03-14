import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/sets/[setId]/comments — list comments on a set
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const comments = await prisma.comment.findMany({
      where: { setId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    })
    return Response.json(comments)
  } catch (error) {
    console.error("Get comments error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/sets/[setId]/comments — add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { setId } = await params
    const { text } = await request.json()
    if (!text?.trim()) {
      return Response.json({ error: "Comment text is required" }, { status: 400 })
    }
    const comment = await prisma.comment.create({
      data: { text: text.trim(), userId: session.user.id, setId },
      include: { user: { select: { id: true, name: true } } },
    })
    return Response.json(comment)
  } catch (error) {
    console.error("Create comment error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/sets/[setId]/comments — delete own comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { setId } = await params
    const { commentId } = await request.json()
    const comment = await prisma.comment.findUnique({ where: { id: commentId } })
    if (!comment || comment.userId !== session.user.id || comment.setId !== setId) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }
    await prisma.comment.delete({ where: { id: commentId } })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete comment error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
