import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { encryptPassword } from "@/lib/encryption"
import { randomBytes } from "crypto"

/**
 * POST /api/admin/users/backfill-passwords
 *
 * Generates secure temporary passwords for ALL users who do not yet
 * have an encrypted (recoverable) password stored. Each user gets:
 *   • A new bcrypt hash (for authentication)
 *   • An AES-256-GCM encrypted copy (for admin recovery)
 *   • forcePasswordChange = true (so they must reset on next login)
 *
 * Returns the list of affected users and their temporary passwords
 * so the admin can distribute them.
 */

function generateTempPassword(): string {
  // 12-char alphanumeric — easy to share, ambiguous chars removed
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  const bytes = randomBytes(12)
  let pw = ""
  for (let i = 0; i < 12; i++) {
    pw += chars[bytes[i] % chars.length]
  }
  return pw
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Verify encryption is configured before proceeding
    try {
      encryptPassword("test")
    } catch (err) {
      console.error("Encryption key not configured:", err)
      return NextResponse.json(
        {
          error:
            "ADMIN_PASSWORD_ENCRYPTION_KEY is not configured. Add this environment variable before using this feature.",
        },
        { status: 500 }
      )
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
    const usersWithoutEncrypted = await prisma.user.findMany({
      where: {
        password: { not: null },
        OR: [{ encryptedPassword: null }, { encryptedPassword: "" }],
        ...(targetUserId ? { id: targetUserId } : {}),
      },
      select: { id: true, email: true, name: true },
    })

    if (usersWithoutEncrypted.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All users already have recoverable passwords.",
        affected: [],
        count: 0,
      })
    }

    const affected: {
      id: string
      email: string
      name: string | null
      tempPassword: string
    }[] = []

    for (const user of usersWithoutEncrypted) {
      const tempPassword = generateTempPassword()
      const hash = await bcrypt.hash(tempPassword, 12)
      const encrypted = encryptPassword(tempPassword)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hash,
          encryptedPassword: encrypted,
          forcePasswordChange: true,
        },
      })

      affected.push({
        id: user.id,
        email: user.email,
        name: user.name,
        tempPassword,
      })
    }

    // Audit log
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown"

    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        targetUserId: targetUserId || session.user.id,
        action: targetUserId ? "PASSWORD_INITIALIZED" : "BULK_PASSWORD_RESET",
        ipAddress: ip,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Generated temporary passwords for ${affected.length} user(s). They will be required to change their password on next login.`,
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
