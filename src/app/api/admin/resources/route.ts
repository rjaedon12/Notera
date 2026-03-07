import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminCookie } from "@/lib/admin-auth"

// GET /api/admin/resources — list all resources (admin only)
export async function GET() {
  try {
    if (!(await verifyAdminCookie())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const resources = await prisma.resource.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(resources)
  } catch (error) {
    console.error("Admin get resources error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/resources — delete a resource by id (admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAdminCookie())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { resourceId } = await request.json()
    if (!resourceId) return NextResponse.json({ error: "resourceId is required" }, { status: 400 })

    const resource = await prisma.resource.findUnique({ where: { id: resourceId } })
    if (!resource) return NextResponse.json({ error: "Resource not found" }, { status: 404 })

    await prisma.resource.delete({ where: { id: resourceId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin delete resource error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
