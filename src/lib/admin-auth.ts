import { auth } from "@/lib/auth"

/**
 * Verifies the current user has ADMIN role via NextAuth session.
 * Used to protect all /api/admin/* routes.
 */
export async function verifyAdminAuth(): Promise<boolean> {
  try {
    const session = await auth()
    return session?.user?.role === "ADMIN"
  } catch {
    return false
  }
}
