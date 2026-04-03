import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { signupSchema } from "@/lib/validations"
import { logSignupToGoogleSheets } from "@/lib/google-sheets"
import { encryptPassword } from "@/lib/encryption"
import { buildRateLimitKey, createRateLimitResponse, takeRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const rateLimit = takeRateLimit(buildRateLimitKey("signup", request), {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    })
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "Too many signup attempts. Please try again later.")
    }

    const body = await request.json()
    
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = parsed.data

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      )
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Encrypt password for admin recovery
    let encrypted: string | undefined
    try {
      encrypted = encryptPassword(password)
    } catch (err) {
      console.error("Failed to encrypt password for admin recovery:", err)
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: passwordHash,
        encryptedPassword: encrypted ?? null,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    })

    // Log signup to Google Sheets (async, non-blocking)
    // IMPORTANT: We only log email and name - NEVER the password
    logSignupToGoogleSheets({
      email,
      name,
      source: "web"
    }).catch(console.error)

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    // Handle unique constraint violation (email already registered, race condition)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      )
    }
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
