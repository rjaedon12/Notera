import { prisma } from "@/lib/prisma"

type SessionUserLike = {
  id?: string | null
  email?: string | null
  name?: string | null
  image?: string | null
  role?: string | null
}

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
