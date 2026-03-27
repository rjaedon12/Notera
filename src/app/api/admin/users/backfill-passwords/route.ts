import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/admin/users/backfill-passwords
 *
 * Flags users without recoverable passwords so they are forced to
 * change their password on next login.  The user keeps their existing
 * password — when they log in the auth callback will capture and
 * encrypt the plaintext automatically, and after the forced password
 * change the new password is also encrypted.
 *
 * Accepts optional { userId } in the body for single-user init.
 * Without a body it processes ALL unrecoverable users (bulk).
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Optional: target a single user by ID
    let targetUserId: string | undefined
    try {
      const body = await request.json()
      targetUserId = body?.userId
    } catch {
      // No body or invalid JSON — treat as bulk operation
    }

    // Fetch credential users who have no encrypted copy
    const usersToInit = await prisma.user.findMany({
      where: {
        password: { not: null },
        OR: [{ encryptedPassword: null }, { encryptedPassword: "" }],
        ...(targetUserId ? { id: targetUserId } : {}),
      },
      select: { id: true, email: true, name: true },
    })

    if (usersToInit.length === 0) {
      return NextResponse.json({
        success: true,
        message: targetUserId
          ? "This user already has a recoverable password."
          : "All users already have recoverable passwords.",
        affected: [],
        count: 0,
      })
    }

    // Flag each user to force password change on next login
    const affectedIds = usersToInit.map(u => u.id)
    await prisma.user.updateMany({
      where: { id: { in: affectedIds } },
      data: { forcePasswordChange: true },
    })

    // Audit log
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown"

    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        targetUserId: targetUserId || session.user.id,
        action: targetUserId ? "PASSWORD_INITIALIZED" : "BULK_PASSWORD_INIT",
        ipAddress: ip,
      },
    })

    const affected = usersToInit.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
    }))

    return NextResponse.json({
      success: true,
      message: targetUserId
        ? `${usersToInit[0].email} will be required to change their password on next login. Their current password still works.`
        : `${affected.length} user(s) will be required to change their password on next login. Their current passwords still work.`,
      affected,
      count: affected.length,
    })
  } catch (error) {
    console.error("Backfill passwords error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
