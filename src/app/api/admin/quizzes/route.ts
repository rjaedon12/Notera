import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth } from "@/lib/admin-auth"

// GET /api/admin/quizzes — list all quiz banks (admin only)
export async function GET() {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const banks = await prisma.questionBank.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(banks)
  } catch (error) {
    console.error("Admin get quizzes error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/admin/quizzes — delete a quiz bank by id (admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { bankId } = await request.json()
    if (!bankId) return NextResponse.json({ error: "bankId is required" }, { status: 400 })

    const bank = await prisma.questionBank.findUnique({ where: { id: bankId } })
    if (!bank) return NextResponse.json({ error: "Quiz bank not found" }, { status: 404 })

    await prisma.questionBank.delete({ where: { id: bankId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin delete quiz error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
