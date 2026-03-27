import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { encryptPassword } from "@/lib/encryption"

const setPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
  forceChange: z.boolean().default(true),
})

/**
 * POST /api/admin/users/[userId]/set-password
 *
 * Admin directly sets a user's password.
 * Stores bcrypt hash (for auth) + AES-256-GCM encrypted copy (for recovery).
 * Optionally flags the user to change password on next login.
 */
export async function POST(
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

    const parsed = setPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { password, forceChange } = parsed.data

    // Verify target user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        accounts: { select: { provider: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Reject for OAuth-only accounts that have never had a password
    if (!user.password && user.accounts.length > 0) {
      return NextResponse.json(
        { error: "This user authenticates via OAuth. Cannot set a password." },
        { status: 400 }
      )
    }

    // Hash for authentication
    const passwordHash = await bcrypt.hash(password, 12)

    // Encrypt for admin recovery
    let encrypted: string | undefined
    try {
      encrypted = encryptPassword(password)
    } catch {
      // Skip if encryption key not configured
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: passwordHash,
        encryptedPassword: encrypted ?? null,
        forcePasswordChange: forceChange,
      },
    })

    // Audit log
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown"
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        targetUserId: userId,
        action: "PASSWORD_SET",
        ipAddress: ip,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Password updated for ${user.email}.${forceChange ? " User will be required to change it on next login." : ""}`,
    })
  } catch (error) {
    console.error("Admin set-password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
