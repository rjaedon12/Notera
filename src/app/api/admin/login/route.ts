import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
const ADMIN_SECRET = process.env.ADMIN_SECRET

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex")
}

function hashToken(token: string): string {
  return crypto.createHmac("sha256", ADMIN_SECRET || "fallback").update(token).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_SECRET) {
      console.error("Admin credentials not configured in environment variables")
      return NextResponse.json({ error: "Admin portal not configured" }, { status: 503 })
    }

    const { username, password } = await request.json()

    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken()
    const hashedToken = hashToken(token)

    const cookieStore = await cookies()
    cookieStore.set("admin_token", hashedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    })
    // Store the expected hash in a server-side cookie for verification
    cookieStore.set("admin_token_verify", hashedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
