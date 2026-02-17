import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { resolveSessionUserId } from "@/lib/session-user"

export const dynamic = "force-dynamic"

// POST /api/quizzes/attempts - Start a new quiz attempt
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveSessionUserId(session.user)
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const sessionEmail = session.user.email?.toLowerCase().trim() ?? null

    const body = await request.json()
    const { bankId } = body

    if (!bankId) {
      return NextResponse.json(
        { error: "bankId is required" },
        { status: 400 }
      )
    }

    const bank = await prisma.questionBank.findUnique({
      where: { id: bankId },
      include: {
        _count: { select: { questions: true } },
        owner: { select: { email: true } },
      },
    })

    if (!bank) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const isOwner =
      bank.ownerId === userId ||
      (!!sessionEmail && bank.owner?.email?.toLowerCase() === sessionEmail)

    if (!isOwner && !bank.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        bankId,
        totalQuestions: bank._count.questions,
      },
    })

    return NextResponse.json(attempt, { status: 201 })
  } catch (error) {
    console.error("Create attempt error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// GET /api/quizzes/attempts - Get user's quiz attempt history
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveSessionUserId(session.user)
    if (!userId) {
      return NextResponse.json([], { status: 200 })
    }

    const { searchParams } = new URL(request.url)
    const bankId = searchParams.get("bankId")

    const where: { userId: string; bankId?: string } = {
      userId,
    }
    if (bankId) where.bankId = bankId

    const attempts = await prisma.quizAttempt.findMany({
      where,
      include: {
        bank: { select: { id: true, title: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(attempts)
  } catch (error) {
    console.error("Get attempts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
