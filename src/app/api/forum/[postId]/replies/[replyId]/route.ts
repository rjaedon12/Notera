import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// DELETE /api/forum/[postId]/replies/[replyId] — delete own reply
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string; replyId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { replyId } = await params
    const reply = await prisma.forumReply.findUnique({
      where: { id: replyId },
      select: { userId: true },
    })
    if (!reply) return Response.json({ error: "Reply not found" }, { status: 404 })

    const isAdmin = session.user.role === "ADMIN"
    if (reply.userId !== session.user.id && !isAdmin) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.forumReply.delete({ where: { id: replyId } })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Reply DELETE error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
