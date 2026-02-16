import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/sets/[setId]/duplicate - Duplicate a study set
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const originalSet = await prisma.studySet.findUnique({
      where: { id: setId },
      include: { cards: true }
    })

    if (!originalSet) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    // Check access - can duplicate if owner or if public
    if (!originalSet.isPublic && originalSet.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const newSet = await prisma.studySet.create({
      data: {
        title: `${originalSet.title} (Copy)`,
        description: originalSet.description,
        isPublic: false,
        ownerId: session.user.id,
        cards: {
          create: originalSet.cards.map((card: { term: string; definition: string; orderIndex: number }) => ({
            term: card.term,
            definition: card.definition,
            orderIndex: card.orderIndex
          }))
        }
      },
      include: {
        cards: true,
        _count: { select: { cards: true } }
      }
    })

    return NextResponse.json(newSet, { status: 201 })
  } catch (error) {
    console.error("Duplicate set error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
