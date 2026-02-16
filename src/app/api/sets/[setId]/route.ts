import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/sets/[setId] - Get a study set
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    const set = await prisma.studySet.findUnique({
      where: { id: setId },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        cards: {
          orderBy: { orderIndex: "asc" }
        },
        _count: { select: { cards: true } }
      }
    })

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    // Check access
    if (!set.isPublic && set.ownerId !== session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Add starred status for authenticated users
    if (session?.user?.id) {
      const starredCards = await prisma.starredCard.findMany({
        where: {
          userId: session.user.id,
          cardId: { in: set.cards.map((c: { id: string }) => c.id) }
        },
        select: { cardId: true }
      })
      const starredIds = new Set(starredCards.map((s: { cardId: string }) => s.cardId))
      
      const cardsWithStarred = set.cards.map((card: { id: string }) => ({
        ...card,
        isStarred: starredIds.has(card.id)
      }))

      return NextResponse.json({ ...set, cards: cardsWithStarred })
    }

    return NextResponse.json(set)
  } catch (error) {
    console.error("Get set error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/sets/[setId] - Update a study set
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const set = await prisma.studySet.findUnique({
      where: { id: setId }
    })

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    const isAdmin = session.user.role === "ADMIN"
    if (set.ownerId !== session.user.id && !isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, isPublic } = body

    const updated = await prisma.studySet.update({
      where: { id: setId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(isPublic !== undefined && { isPublic })
      },
      include: {
        cards: { orderBy: { orderIndex: "asc" } },
        _count: { select: { cards: true } }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update set error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/sets/[setId] - Delete a study set
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const set = await prisma.studySet.findUnique({
      where: { id: setId }
    })

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    if (set.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      console.log(`Delete denied: userId=${session.user.id} role=${session.user.role} ownerId=${set.ownerId}`)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
      // Ensure hard delete persists across restarts (transaction + cleanup)
      // and avoid stale cached lists by revalidating key pages.
      await prisma.$transaction([
        prisma.starredCard.deleteMany({ where: { card: { setId } } }),
        prisma.progress.deleteMany({ where: { card: { setId } } }),
        prisma.card.deleteMany({ where: { setId } }),
        prisma.folderSet.deleteMany({ where: { setId } }),
        prisma.savedSet.deleteMany({ where: { setId } }),
        prisma.studySession.deleteMany({ where: { setId } }),
        prisma.matchScore.deleteMany({ where: { setId } }),
        prisma.timedScore.deleteMany({ where: { setId } }),
        prisma.shareLink.deleteMany({ where: { setId } }),
        prisma.setTag.deleteMany({ where: { setId } }),
        prisma.groupSet.deleteMany({ where: { setId } }),
        prisma.studySet.delete({ where: { id: setId } })
      ])
    } catch (error: any) {
      // Handle foreign key constraint errors manually if cascade is missing
      console.error("Delete set failed:", error)
      return NextResponse.json(
        { error: `Could not delete set: ${error.message}` },
        { status: 400 }
      )
    }

    if (session.user.role === "ADMIN" && set.ownerId !== session.user.id) {
      await prisma.auditLog.create({
        data: {
          action: "DELETE_SET",
          targetType: "StudySet",
          targetId: setId,
          adminId: session.user.id,
          details: JSON.stringify({
            ownerId: set.ownerId,
            title: set.title
          })
        }
      })
    }

    // Revalidate key pages that may have cached data
    revalidatePath("/library")
    revalidatePath("/sets")

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Delete set error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
