import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/notifications — list user's notifications
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, isRead: false },
    })
    return Response.json({ notifications, unreadCount })
  } catch (error) {
    console.error("Get notifications error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/notifications — mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { notificationIds, markAllRead } = await request.json()
    
    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, isRead: false },
        data: { isRead: true },
      })
    } else if (notificationIds?.length) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId: session.user.id },
        data: { isRead: true },
      })
    }
    return Response.json({ success: true })
  } catch (error) {
    console.error("Update notifications error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
