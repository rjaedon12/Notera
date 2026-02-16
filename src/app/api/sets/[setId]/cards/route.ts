import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/sets/[setId]/cards - Create a new card
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

    const set = await prisma.studySet.findUnique({
      where: { id: setId }
    })

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    if (set.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { term, definition, orderIndex } = body

    if (!term || !definition) {
      return NextResponse.json(
        { error: "Term and definition are required" },
        { status: 400 }
      )
    }

    const card = await prisma.card.create({
      data: {
        term,
        definition,
        orderIndex: orderIndex ?? 0,
        setId
      }
    })

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    console.error("Create card error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
