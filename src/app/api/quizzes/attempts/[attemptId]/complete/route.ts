import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/quizzes/attempts/[attemptId]/complete — finish a quiz
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { attemptId } = await params

    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      include: { answers: true },
    })

    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    if (attempt.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (attempt.completedAt) return NextResponse.json({ error: "Already completed" }, { status: 400 })

    // Calculate score
    const correctCount = attempt.answers.filter((a) => a.isCorrect).length

    const completed = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt: new Date(),
        score: correctCount,
      },
      include: {
        bank: { select: { id: true, title: true } },
        answers: {
          include: {
            question: { include: { choices: true } },
            choice: true,
          },
        },
      },
    })

    const totalQ = await prisma.question.count({ where: { bankId: attempt.bankId } })

    return NextResponse.json({
      ...completed,
      totalQuestions: totalQ,
    })
  } catch (error) {
    console.error("Complete attempt error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
