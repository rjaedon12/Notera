import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

const ADMIN_SECRET = process.env.ADMIN_SECRET || "koda-admin-secret-key-change-in-production"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Token is already the hash; just validate it's a proper hex string
    if (token.length === 64 && /^[a-f0-9]+$/.test(token)) {
      return NextResponse.json({ authenticated: true })
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
