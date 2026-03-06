import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/quizzes/attempts/[attemptId]/answer — submit an answer
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
    const { questionId, choiceId } = await request.json()

    if (!questionId || !choiceId) {
      return NextResponse.json({ error: "questionId and choiceId are required" }, { status: 400 })
    }

    const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } })
    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    if (attempt.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    if (attempt.completedAt) return NextResponse.json({ error: "Attempt already completed" }, { status: 400 })

    // Check if already answered
    const existing = await prisma.attemptAnswer.findUnique({
      where: { attemptId_questionId: { attemptId, questionId } },
    })
    if (existing) {
      return NextResponse.json({ error: "Already answered this question" }, { status: 400 })
    }

    // Check if the choice is correct
    const choice = await prisma.choice.findUnique({ where: { id: choiceId } })
    if (!choice) return NextResponse.json({ error: "Choice not found" }, { status: 404 })

    const answer = await prisma.attemptAnswer.create({
      data: {
        attemptId,
        questionId,
        choiceId,
        isCorrect: choice.isCorrect,
      },
      include: {
        choice: true,
        question: { include: { choices: true } },
      },
    })

    return NextResponse.json(answer)
  } catch (error) {
    console.error("Submit answer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
