import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

/**
 * SECURE PASSWORD RECOVERY IMPLEMENTATION
 * 
 * This endpoint allows admins to generate a secure, one-time password reset token.
 * 
 * SECURITY NOTES:
 * - Passwords are NEVER stored or displayed in plaintext
 * - The reset token is shown only ONCE to the admin (they must share it securely)
 * - Token expires in 24 hours
 * - Token is invalidated after use
 * - Only admins can generate reset tokens
 */

// Generate a cryptographically secure reset token
function generateResetToken(): string {
  return randomBytes(32).toString("hex")
}

// POST /api/admin/users/[userId]/reset-password - Generate a password reset token
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    
    // Only admins can generate reset tokens
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { userId } = await params

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Generate a secure reset token
    const resetToken = generateResetToken()
    
    // Set expiry to 24 hours from now
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Store the token (in production, this should be hashed)
    await prisma.user.update({
      where: { id: userId },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: "GENERATE_RESET_TOKEN",
        targetType: "User",
        targetId: userId,
        adminId: session.user.id,
        details: JSON.stringify({
          userEmail: user.email,
          expiresAt: resetTokenExpiry.toISOString()
        })
      }
    })

    // Return the reset link (token is shown only once)
    // In production, this URL should use the actual domain
    const resetLink = `/reset-password?token=${resetToken}`

    return NextResponse.json({
      success: true,
      resetLink,
      expiresAt: resetTokenExpiry.toISOString(),
      message: "Reset link generated. Share this securely with the user. It expires in 24 hours."
    })
  } catch (error) {
    console.error("Error generating reset token:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
