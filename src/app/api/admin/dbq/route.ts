import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth } from "@/lib/admin-auth"

// GET /api/admin/dbq — list all DBQ prompts (admin only)
export async function GET() {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const prompts = await prisma.dBQPrompt.findMany({
      include: {
        _count: { select: { documents: true, essays: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(prompts)
  } catch (error) {
    console.error("Admin get DBQ prompts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/dbq — delete a DBQ prompt by id (admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { promptId } = await request.json()
    if (!promptId) return NextResponse.json({ error: "promptId is required" }, { status: 400 })

    const prompt = await prisma.dBQPrompt.findUnique({ where: { id: promptId } })
    if (!prompt) return NextResponse.json({ error: "DBQ prompt not found" }, { status: 404 })

    // Cascade deletes DBQDocument and DBQEssay via onDelete: Cascade
    await prisma.dBQPrompt.delete({ where: { id: promptId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin delete DBQ prompt error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
