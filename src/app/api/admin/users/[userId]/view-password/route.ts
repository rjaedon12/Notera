import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { decryptPassword } from "@/lib/encryption"

/**
 * POST /api/admin/users/[userId]/view-password
 *
 * SECURITY-CRITICAL ENDPOINT
 * Decrypts and returns a user's current password.
 *
 * Guards:
 *  1. Caller must have ADMIN role (session check)
 *  2. Caller must re-authenticate by providing their OWN password
 *  3. Action is audit-logged with IP address
 *  4. Rejects if the user has no encrypted password stored
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
    const { adminPassword } = body

    if (!adminPassword || typeof adminPassword !== "string") {
      return NextResponse.json(
        { error: "Admin password is required for verification" },
        { status: 400 }
      )
    }

    // ── Step 1: Re-authenticate the admin ──
    const admin = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, password: true, role: true },
    })

    if (!admin || admin.role !== "ADMIN" || !admin.password) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const adminValid = await bcrypt.compare(adminPassword, admin.password)
    if (!adminValid) {
      return NextResponse.json(
        { error: "Admin password is incorrect" },
        { status: 401 }
      )
    }

    // ── Step 2: Fetch target user's encrypted password ──
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, encryptedPassword: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (!user.encryptedPassword) {
      return NextResponse.json(
        {
          error:
            "No recoverable password stored yet. The user needs to log in once for their password to be captured, or you can set a new password for them using the \"Set New Password\" option above.",
        },
        { status: 404 }
      )
    }

    // ── Step 3: Decrypt ──
    let plaintext: string
    try {
      plaintext = decryptPassword(user.encryptedPassword)
    } catch (err) {
      console.error("Decryption failed for user", userId, err)
      return NextResponse.json(
        { error: "Failed to decrypt password. The encryption key may have changed." },
        { status: 500 }
      )
    }

    // ── Step 4: Audit log ──
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown"
    await prisma.adminAuditLog.create({
      data: {
        adminId: session.user.id,
        targetUserId: userId,
        action: "PASSWORD_VIEWED",
        ipAddress: ip,
      },
    })

    return NextResponse.json({
      success: true,
      email: user.email,
      password: plaintext,
    })
  } catch (error) {
    console.error("Admin view-password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
