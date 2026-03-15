import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/notes — list all non-archived pages for current user (metadata only)
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const groupId = searchParams.get("groupId")
  const archived = searchParams.get("archived")

  const where: Record<string, unknown> = {
    userId: session.user.id,
  }

  if (archived === "true") {
    where.isArchived = true
  } else {
    where.isArchived = false
  }

  if (groupId) {
    where.groupId = groupId
  }

  const pages = await prisma.notePage.findMany({
    where,
    select: {
      id: true,
      title: true,
      icon: true,
      parentId: true,
      sortOrder: true,
      isFavorite: true,
      isArchived: true,
      isFullWidth: true,
      coverImage: true,
      groupId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { sortOrder: "asc" },
  })

  return NextResponse.json(pages)
}

// POST /api/notes — create a new page
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { title, parentId, groupId, icon } = body

  // If parentId is given, verify ownership
  if (parentId) {
    const parent = await prisma.notePage.findFirst({
      where: { id: parentId, userId: session.user.id },
    })
    if (!parent) {
      return NextResponse.json({ error: "Parent page not found" }, { status: 404 })
    }
  }

  // Get next sort order for this level
  const maxSort = await prisma.notePage.aggregate({
    where: {
      userId: session.user.id,
      parentId: parentId || null,
      isArchived: false,
    },
    _max: { sortOrder: true },
  })

  const page = await prisma.notePage.create({
    data: {
      title: title || "Untitled",
      icon: icon || null,
      parentId: parentId || null,
      groupId: groupId || null,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
      userId: session.user.id,
    },
  })

  return NextResponse.json(page, { status: 201 })
}
