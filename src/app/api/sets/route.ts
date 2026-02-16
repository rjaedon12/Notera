import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { studySetSchema } from "@/lib/validations"

export const dynamic = "force-dynamic"

// GET /api/sets - Get user's study sets
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const sets = await prisma.studySet.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: { select: { cards: true } }
      },
      orderBy: { updatedAt: "desc" }
    })

    return NextResponse.json(sets)
  } catch (error) {
    console.error("Get sets error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/sets - Create a new study set
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    
    const parsed = studySetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, description, isPublic } = parsed.data
    const cards = body.cards || []

    const set = await prisma.studySet.create({
      data: {
        title,
        description,
        isPublic: isPublic || false,
        ownerId: session.user.id,
        cards: {
          create: cards.map((card: { term: string; definition: string }, index: number) => ({
            term: card.term,
            definition: card.definition,
            orderIndex: index,
          }))
        }
      },
      include: {
        cards: true,
        _count: { select: { cards: true } }
      }
    })

    return NextResponse.json(set, { status: 201 })
  } catch (error) {
    console.error("Create set error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
