import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth } from "@/lib/admin-auth"

// GET /api/admin/sets — list all study sets (admin only)
export async function GET() {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const sets = await prisma.flashcardSet.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { cards: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(sets)
  } catch (error) {
    console.error("Admin get sets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/sets — delete a study set by id (admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { setId } = await request.json()
    if (!setId) return NextResponse.json({ error: "setId is required" }, { status: 400 })

    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })
    if (!set) return NextResponse.json({ error: "Set not found" }, { status: 404 })

    await prisma.flashcardSet.delete({ where: { id: setId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin delete set error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/admin/sets — toggle featured status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { setId, isFeatured } = await request.json()
    if (!setId) return NextResponse.json({ error: "setId is required" }, { status: 400 })
    if (typeof isFeatured !== "boolean") return NextResponse.json({ error: "isFeatured must be boolean" }, { status: 400 })

    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })
    if (!set) return NextResponse.json({ error: "Set not found" }, { status: 404 })

    const updated = await prisma.flashcardSet.update({
      where: { id: setId },
      data: { isFeatured },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Admin patch set error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
