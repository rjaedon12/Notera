import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/analytics/heatmap — 180-day study activity for contribution heatmap
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

    const sessions = await prisma.studySession.findMany({
      where: { userId: session.user.id, createdAt: { gte: start } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    })

    const map: Record<string, number> = {}
    for (const s of sessions) {
      const d = s.createdAt.toISOString().split("T")[0]
      map[d] = (map[d] || 0) + 1
    }

    const activity: { date: string; count: number }[] = []
    for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0]
      activity.push({ date: dateStr, count: map[dateStr] || 0 })
    }

    return Response.json(activity)
  } catch (error) {
    console.error("Heatmap error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
