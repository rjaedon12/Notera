import { NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/admin-auth"
import { prisma } from "@/lib/prisma"

// GET /api/admin/stats - Get admin dashboard stats
export async function GET() {
  const isAdmin = await verifyAdminAuth()
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const [totalUsers, totalSets, totalQuizzes, totalResources] = await Promise.all([
      prisma.user.count(),
      prisma.flashcardSet.count(),
      prisma.questionBank.count(),
      prisma.resource.count(),
    ])

    return NextResponse.json({ totalUsers, totalSets, totalQuizzes, totalResources })
  } catch (error) {
    console.error("Admin stats error:", error)
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
  }
}
