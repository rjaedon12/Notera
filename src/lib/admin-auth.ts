import { cookies } from "next/headers"

/**
 * Verifies the admin_token cookie that is set by /api/admin/login.
 * Returns true if the cookie looks like a valid HMAC-SHA256 hex digest.
 */
export async function verifyAdminCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value
    if (!token) return false
    // SHA-256 HMAC hex = exactly 64 lowercase hex chars
    return token.length === 64 && /^[a-f0-9]+$/.test(token)
  } catch {
    return false
  }
}
