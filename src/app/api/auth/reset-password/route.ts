import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { createHash } from "crypto"
import { encryptPassword } from "@/lib/encryption"

/**
 * POST /api/auth/reset-password
 * 
 * Public endpoint for users to reset their password using a valid reset token.
 * Token must not be expired and must match the one in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Hash the token before comparing (tokens are stored hashed)
    const hashedToken = createHash('sha256').update(token).digest('hex')

    // Find user with valid, non-expired token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        resetTokenExpiry: { gt: new Date() },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token. Please request a new password reset link." },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await hash(password, 12)

    // Encrypt password for admin recovery
    let encrypted: string | undefined
    try {
      encrypted = encryptPassword(password)
    } catch {
      // Skip if encryption key not configured
    }

    // Update user's password and clear the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        encryptedPassword: encrypted ?? user.encryptedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        forcePasswordChange: false,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now sign in with your new password."
    })
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    )
  }
}
