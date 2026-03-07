import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "KodaAdmin2026!"
const ADMIN_SECRET = process.env.ADMIN_SECRET || "koda-admin-secret-key-change-in-production"

function generateToken(): string {
  return crypto.randomBytes(48).toString("hex")
}

function hashToken(token: string): string {
  return crypto.createHmac("sha256", ADMIN_SECRET).update(token).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
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

    // Also store the raw token hash server-side for verification
    // For simplicity we use the hash directly in the cookie
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
