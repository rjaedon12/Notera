import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { encryptPassword } from "@/lib/encryption"

/**
 * POST /api/auth/change-password
 *
 * Authenticated endpoint for users flagged with forcePasswordChange.
 * Also usable by any logged-in user who wants to update their password.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { password } = body

    if (!password || typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    if (password.length > 128) {
      return NextResponse.json(
        { error: "Password must be at most 128 characters" },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    let encrypted: string | undefined
    try {
      encrypted = encryptPassword(password)
    } catch (err) {
      console.error("Failed to encrypt password for admin recovery:", err)
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: passwordHash,
        encryptedPassword: encrypted ?? null,
        forcePasswordChange: false,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
