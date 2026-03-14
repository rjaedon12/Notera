import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/announcements/dismiss — dismiss an announcement for the current user
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      // Logged-out users handle dismissals client-side via localStorage
      return Response.json({ ok: true })
    }

    const { announcementId } = await request.json()
    if (!announcementId || typeof announcementId !== "string") {
      return Response.json({ error: "announcementId is required" }, { status: 400 })
    }

    // Upsert so calling twice is safe
    await prisma.announcementDismissal.upsert({
      where: {
        userId_announcementId: {
          userId: session.user.id,
          announcementId,
        },
      },
      create: {
        userId: session.user.id,
        announcementId,
      },
      update: {}, // no-op if already exists
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error("Dismiss announcement error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
