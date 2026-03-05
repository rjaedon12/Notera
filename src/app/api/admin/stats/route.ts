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

    const [users, sets, cards, groups] = await Promise.all([
      prisma.user.count(),
      prisma.flashcardSet.count(),
      prisma.flashcard.count(),
      prisma.group.count()
    ])

    return NextResponse.json({ users, sets, cards, groups })
  } catch (error) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
