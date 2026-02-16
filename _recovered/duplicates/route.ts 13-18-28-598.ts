import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/saved - Get all saved sets for the user
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const savedSets = await prisma.savedSet.findMany({
      where: { userId: session.user.id },
      include: {
        studySet: {
          include: {
            owner: {
              select: { id: true, name: true, email: true }
            },
            _count: { select: { cards: true } }
          }
        }
      },
      orderBy: { savedAt: "desc" }
    })

    return NextResponse.json(savedSets.map((s: { studySet: unknown }) => s.studySet))
  } catch (error) {
    console.error("Get saved sets error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
