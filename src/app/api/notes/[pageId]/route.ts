import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notes/[pageId] — get single page with full content
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pageId } = await params

  const page = await prisma.notePage.findFirst({
    where: { id: pageId, userId: session.user.id },
  })

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 })
  }

  return NextResponse.json(page)
}

// PATCH /api/notes/[pageId] — update page fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pageId } = await params

  // Verify ownership
  const existing = await prisma.notePage.findFirst({
    where: { id: pageId, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 })
  }

  const body = await req.json()
  const allowedFields = [
    "title",
    "content",
    "icon",
    "coverImage",
    "isFullWidth",
    "isFavorite",
    "isArchived",
    "isPublic",
  ]

  const data: Record<string, unknown> = {}
  for (const key of allowedFields) {
    if (key in body) {
      data[key] = body[key]
    }
  }

  const updated = await prisma.notePage.update({
    where: { id: pageId },
    data,
  })

  return NextResponse.json(updated)
}

// DELETE /api/notes/[pageId] — soft-delete (archive) or hard-delete if already archived
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pageId } = await params

  const existing = await prisma.notePage.findFirst({
    where: { id: pageId, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 })
  }

  if (existing.isArchived) {
    // Hard delete — also delete any children
    await prisma.notePage.deleteMany({
      where: {
        OR: [
          { id: pageId },
          { parentId: pageId },
        ],
        userId: session.user.id,
      },
    })
    return NextResponse.json({ deleted: true })
  } else {
    // Soft delete — archive the page and its children
    await prisma.notePage.updateMany({
      where: {
        OR: [
          { id: pageId },
          { parentId: pageId },
        ],
        userId: session.user.id,
      },
      data: { isArchived: true },
    })
    return NextResponse.json({ archived: true })
  }
}
