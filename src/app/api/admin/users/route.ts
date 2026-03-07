import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminCookie } from "@/lib/admin-auth"

// GET /api/admin/users - Get all users (admin only)
export async function GET() {
  try {
    if (!(await verifyAdminCookie())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
        createdAt: true,
        _count: {
          select: { sets: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/admin/users — ban or unban a user
export async function PATCH(request: NextRequest) {
  try {
    if (!(await verifyAdminCookie())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const { userId, isBanned } = await request.json()
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBanned: Boolean(isBanned) },
    })
    return NextResponse.json({ success: true, isBanned: user.isBanned })
  } catch (error) {
    console.error("Admin ban/unban error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/users — delete a user
export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAdminCookie())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }
    const { userId } = await request.json()
    if (!userId) return NextResponse.json({ error: "userId is required" }, { status: 400 })
    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
