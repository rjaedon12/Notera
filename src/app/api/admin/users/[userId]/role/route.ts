import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// PUT /api/admin/users/[userId]/role - Update user role (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { userId } = await params
    const body = await request.json()
    const { role } = body

    if (!role || !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be USER or ADMIN" },
        { status: 400 }
      )
    }

    // Prevent self-demotion
    if (userId === session.user.id && role !== "ADMIN") {
      return NextResponse.json(
        { error: "Cannot demote yourself" },
        { status: 400 }
      )
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
