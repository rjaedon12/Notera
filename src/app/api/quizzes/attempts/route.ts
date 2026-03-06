import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/quizzes/attempts — list user's quiz attempts
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bankId = request.nextUrl.searchParams.get("bankId")

    const where: Record<string, unknown> = { userId: session.user.id }
    if (bankId) where.bankId = bankId

    const attempts = await prisma.quizAttempt.findMany({
      where,
      include: {
        bank: { select: { id: true, title: true } },
        _count: { select: { answers: true } },
      },
      orderBy: { startedAt: "desc" },
      take: 50,
    })

    // Map totalQuestions from bank question count
    const mapped = await Promise.all(
      attempts.map(async (a) => {
        const totalQ = await prisma.question.count({ where: { bankId: a.bankId } })
        return {
          ...a,
          totalQuestions: totalQ,
          createdAt: a.startedAt,
        }
      })
    )

    return NextResponse.json(mapped)
  } catch (error) {
    console.error("Get attempts error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/quizzes/attempts — start a new quiz attempt
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bankId } = await request.json()

    if (!bankId) {
      return NextResponse.json({ error: "bankId is required" }, { status: 400 })
    }

    const bank = await prisma.questionBank.findUnique({
      where: { id: bankId },
      include: {
        questions: {
          include: { choices: { orderBy: { orderIndex: "asc" } } },
          orderBy: { orderIndex: "asc" },
        },
      },
    })

    if (!bank) return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    if (bank.questions.length === 0) {
      return NextResponse.json({ error: "No questions in this bank" }, { status: 400 })
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        bankId,
        userId: session.user.id,
      },
      include: {
        bank: {
          include: {
            questions: {
              include: { choices: { orderBy: { orderIndex: "asc" } } },
              orderBy: { orderIndex: "asc" },
            },
          },
        },
      },
    })

    // Map correctChoiceId for each question
    const questions = attempt.bank.questions.map((q) => {
      const correct = q.choices.find((c) => c.isCorrect)
      return { ...q, correctChoiceId: correct?.id || null }
    })

    return NextResponse.json({
      ...attempt,
      totalQuestions: questions.length,
      bank: { ...attempt.bank, questions },
    }, { status: 201 })
  } catch (error) {
    console.error("Create attempt error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
