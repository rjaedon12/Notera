import { prisma } from "@/lib/prisma"

type SessionUserLike = {
  id?: string | null
  email?: string | null
  name?: string | null
  image?: string | null
  role?: string | null
}

// Placeholder hash used only when recreating a missing user row from session context.
const FALLBACK_PASSWORD_HASH = "$2b$10$wM98Q9R2vQd.j4hRrjmM8eLLvF6kq7f3h6YqS9C2n7v5yLqkM8T6a"

export async function resolveSessionUserId(sessionUser: SessionUserLike): Promise<string | null> {
  const sessionId = sessionUser.id ?? null
  const email = sessionUser.email?.toLowerCase().trim() ?? null

  // Prefer ID when available
  if (sessionId) {
    const byId = await prisma.user.findUnique({
      where: { id: sessionId },
      select: { id: true },
    })
    if (byId) return byId.id
  }

  // Fallback to email lookup
  if (email) {
    const byEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (byEmail) return byEmail.id

    // Recreate user record when session exists but row is missing in current DB instance
    try {
      const created = await prisma.user.create({
        data: {
          ...(sessionId ? { id: sessionId } : {}),
          email,
          name: sessionUser.name ?? email.split("@")[0],
          image: sessionUser.image ?? null,
          role: sessionUser.role === "ADMIN" ? "ADMIN" : "USER",
          passwordHash: FALLBACK_PASSWORD_HASH,
        },
        select: { id: true },
      })
      return created.id
    } catch {
      // Handle race conditions / uniqueness conflicts by retrying lookup
      const retry = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      })
      return retry?.id ?? null
    }
  }

  return null
}
