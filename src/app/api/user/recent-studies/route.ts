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

    // Get recent study sessions grouped by set
    const recentSessions = await prisma.studySession.findMany({
      where: { userId: session.user.id },
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        studySet: {
          include: {
            _count: { select: { cards: true } }
          }
        }
      }
    })

    // Deduplicate by set and keep most recent
    const seenSets = new Set<string>()
    type SessionEntry = typeof recentSessions[number]
    const uniqueRecent = recentSessions.filter((s: SessionEntry) => {
      if (seenSets.has(s.setId)) return false
      seenSets.add(s.setId)
      return true
    }).slice(0, 8)

    const result = uniqueRecent.map((s: SessionEntry) => ({
      id: s.id,
      setId: s.setId,
      set: {
        id: s.studySet.id,
        title: s.studySet.title,
        _count: s.studySet._count
      },
      studiedAt: s.startedAt.toISOString(),
      mode: s.mode
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
