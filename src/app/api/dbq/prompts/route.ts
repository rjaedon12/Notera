import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/dbq/prompts — list all DBQ prompts
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const prompts = await prisma.dBQPrompt.findMany({
      include: {
        _count: { select: { documents: true, essays: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    // Also get this user's essay counts per prompt
    const userEssayCounts = await prisma.dBQEssay.groupBy({
      by: ["promptId"],
      where: { userId: session.user.id },
      _count: { id: true },
    })

    const countsMap = new Map(
      userEssayCounts.map((c) => [c.promptId, c._count.id])
    )

    const result = prompts.map((p) => ({
      ...p,
      userEssayCount: countsMap.get(p.id) ?? 0,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Get DBQ prompts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
