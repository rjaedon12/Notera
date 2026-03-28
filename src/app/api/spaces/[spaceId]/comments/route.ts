import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/spaces/[spaceId]/comments — create a comment on an announcement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const { announcementId, message, parentId } = await request.json()

    if (!announcementId || !message?.trim()) {
      return NextResponse.json(
        { error: "announcementId and message are required" },
        { status: 400 }
      )
    }

    // Verify membership
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    // Verify announcement belongs to this space
    const announcement = await prisma.spaceAnnouncement.findFirst({
      where: { id: announcementId, spaceId },
    })
    if (!announcement) {
      return NextResponse.json(
        { error: "Announcement not found" },
        { status: 404 }
      )
    }

    // If replying, verify parent comment exists and belongs to same announcement
    if (parentId) {
      const parentComment = await prisma.spaceComment.findFirst({
        where: { id: parentId, announcementId },
      })
      if (!parentComment) {
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        )
      }
    }

    const comment = await prisma.spaceComment.create({
      data: {
        message: message.trim(),
        announcementId,
        authorId: session.user.id,
        parentId: parentId || null,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/spaces/[spaceId]/comments — delete a comment
// Author can delete their own; OWNER/MODERATOR can delete any
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const { commentId } = await request.json()

    if (!commentId) {
      return NextResponse.json(
        { error: "commentId is required" },
        { status: 400 }
      )
    }

    // Get comment
    const comment = await prisma.spaceComment.findUnique({
      where: { id: commentId },
      include: { announcement: { select: { spaceId: true } } },
    })

    if (!comment || comment.announcement.spaceId !== spaceId) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      )
    }

    // Check permissions: author can delete own, OWNER/MODERATOR can delete any
    const isAuthor = comment.authorId === session.user.id

    if (!isAuthor) {
      const membership = await prisma.spaceMember.findFirst({
        where: {
          spaceId,
          userId: session.user.id,
          role: { in: ["OWNER", "MODERATOR"] },
        },
      })
      if (!membership) {
        return NextResponse.json(
          { error: "You can only delete your own comments" },
          { status: 403 }
        )
      }
    }

    // Delete comment (cascades to replies)
    await prisma.spaceComment.delete({
      where: { id: commentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete comment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
