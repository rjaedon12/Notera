import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth } from "@/lib/admin-auth"
import { auth } from "@/lib/auth"

// GET /api/admin/announcements — list all announcements (admin only)
export async function GET() {
  try {
    if (!(await verifyAdminAuth())) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, email: true } },
        _count: { select: { dismissals: true } },
      },
    })

    return Response.json(announcements)
  } catch (error) {
    console.error("Admin get announcements error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/admin/announcements — create a new announcement (admin only)
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth())) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, message, type, expiresAt } = await request.json()

    if (!title || !message) {
      return Response.json({ error: "title and message are required" }, { status: 400 })
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        message,
        type: type || "INFO",
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: session.user.id,
      },
    })

    return Response.json(announcement, { status: 201 })
  } catch (error) {
    console.error("Admin create announcement error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/announcements — delete an announcement (admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth())) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const { announcementId } = await request.json()
    if (!announcementId) {
      return Response.json({ error: "announcementId is required" }, { status: 400 })
    }

    await prisma.announcement.delete({ where: { id: announcementId } })

    return Response.json({ ok: true })
  } catch (error) {
    console.error("Admin delete announcement error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/admin/announcements — toggle active status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth())) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const { announcementId, isActive } = await request.json()
    if (!announcementId || typeof isActive !== "boolean") {
      return Response.json({ error: "announcementId and isActive are required" }, { status: 400 })
    }

    const updated = await prisma.announcement.update({
      where: { id: announcementId },
      data: { isActive },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Admin patch announcement error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
