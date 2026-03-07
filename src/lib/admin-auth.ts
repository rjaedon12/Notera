import { cookies } from "next/headers"

/**
 * Verifies the admin_token cookie matches the admin_token_verify cookie.
 * Both are set during login with the same HMAC-SHA256 hash.
 */
export async function verifyAdminCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value
    const verifyToken = cookieStore.get("admin_token_verify")?.value
    if (!token || !verifyToken) return false
    return token === verifyToken && token.length === 64 && /^[a-f0-9]+$/.test(token)
  } catch {
    return false
  }
}
