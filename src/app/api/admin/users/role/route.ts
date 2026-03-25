import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth } from "@/lib/admin-auth"
import { auth } from "@/lib/auth"

const VALID_ROLES = ["USER", "TEACHER", "ADMIN"]

/**
 * PATCH /api/admin/users/role — Change a user's role (admin only)
 * 
 * Body: { userId: string, role: "USER" | "TEACHER" | "ADMIN" }
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify caller is admin
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const session = await auth()
    const { userId, role } = await request.json()

    // Validate input
    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 })
    }
    if (!role || !VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      )
    }

    // Prevent admins from changing their own role
    if (session?.user?.id === userId) {
      return NextResponse.json(
        { error: "You cannot change your own role" },
        { status: 400 }
      )
    }

    // If demoting an admin, ensure at least one admin remains
    if (role !== "ADMIN") {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (targetUser?.role === "ADMIN") {
        const adminCount = await prisma.user.count({
          where: { role: "ADMIN" },
        })
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "Cannot demote the last admin" },
            { status: 400 }
          )
        }
      }
    }

    // Update role
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error) {
    console.error("Admin role change error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
