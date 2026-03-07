import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value
    const verifyToken = cookieStore.get("admin_token_verify")?.value

    if (!token || !verifyToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Verify the token matches the expected hash
    if (token === verifyToken && token.length === 64 && /^[a-f0-9]+$/.test(token)) {
      return NextResponse.json({ authenticated: true })
    }

    return NextResponse.json({ authenticated: false }, { status: 401 })
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
