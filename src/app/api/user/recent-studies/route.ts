import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/user/recent-studies - Get user's recent study sessions
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get recent study progress grouped by set (using studyProgress model)
    const recentProgress = await prisma.studyProgress.findMany({
      where: { userId: session.user.id },
      orderBy: { lastStudied: "desc" },
      take: 8,
      include: {
        set: {
          select: {
            id: true,
            title: true,
            _count: { select: { cards: true } }
          }
        }
      }
    })

    const result = recentProgress.map((p) => ({
      id: p.id,
      setId: p.setId,
      set: {
        id: p.set.id,
        title: p.set.title,
        _count: { cards: p.set._count.cards }
      },
      studiedAt: p.lastStudied.toISOString(),
      mode: p.mode
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching recent studies:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
