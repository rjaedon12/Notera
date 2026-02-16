import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/stats - Get admin dashboard stats
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const [users, sets, cards, tags] = await Promise.all([
      prisma.user.count(),
      prisma.studySet.count(),
      prisma.card.count(),
      prisma.tag.count()
    ])

    return NextResponse.json({ users, sets, cards, tags })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
