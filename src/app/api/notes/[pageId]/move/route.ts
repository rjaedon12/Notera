import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PATCH /api/notes/[pageId]/move — reparent or reorder a page
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pageId } = await params
  const body = await req.json()
  const { parentId, sortOrder } = body as { parentId?: string | null; sortOrder?: number }

  // Verify ownership
  const existing = await prisma.notePage.findFirst({
    where: { id: pageId, userId: session.user.id },
  })
  if (!existing) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 })
  }

  // If reparenting, verify the target parent exists and is owned
  if (parentId !== undefined && parentId !== null) {
    const parent = await prisma.notePage.findFirst({
      where: { id: parentId, userId: session.user.id },
    })
    if (!parent) {
      return NextResponse.json({ error: "Target parent not found" }, { status: 404 })
    }
    // Prevent circular references — a page can't be its own descendant
    if (parentId === pageId) {
      return NextResponse.json({ error: "Cannot move a page into itself" }, { status: 400 })
    }
  }

  const data: Record<string, unknown> = {}
  if (parentId !== undefined) {
    data.parentId = parentId
  }
  if (typeof sortOrder === "number") {
    data.sortOrder = sortOrder
  }

  const updated = await prisma.notePage.update({
    where: { id: pageId },
    data,
  })

  return NextResponse.json(updated)
}
