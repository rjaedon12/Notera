import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/starred - Get all starred cards for the user
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const starredCards = await prisma.starredCard.findMany({
      where: { userId: session.user.id },
      include: {
        card: {
          include: {
            studySet: {
              select: { id: true, title: true }
            }
          }
        }
      },
      orderBy: { starredAt: "desc" }
    })

    return NextResponse.json(starredCards.map((s: { card: unknown }) => s.card))
  } catch (error) {
    console.error("Get starred cards error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
