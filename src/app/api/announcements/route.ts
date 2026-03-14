import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/announcements — return active announcements the current user hasn't dismissed
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const now = new Date()

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: now } },
        ],
        // Exclude dismissed announcements for logged-in users
        ...(userId
          ? {
              dismissals: {
                none: { userId },
              },
            }
          : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        message: true,
        type: true,
        createdAt: true,
        expiresAt: true,
      },
    })

    // For logged-out users, let the client filter via localStorage
    return Response.json({ announcements })
  } catch (error) {
    console.error("Get announcements error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
