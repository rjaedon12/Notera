import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/quizzes/attempts/[attemptId]/answer - Submit an answer
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
    })

    if (!attempt || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (attempt.completedAt) {
      return NextResponse.json(
        { error: "Quiz already completed" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { questionId, choiceId } = body

    if (!questionId || !choiceId) {
      return NextResponse.json(
        { error: "questionId and choiceId are required" },
        { status: 400 }
      )
    }

    // Check if already answered
    const existingAnswer = await prisma.quizAnswer.findFirst({
      where: { attemptId, questionId },
    })

    if (existingAnswer) {
      return NextResponse.json(
        { error: "Already answered this question" },
        { status: 400 }
      )
    }

    // Verify choice belongs to question
    const choice = await prisma.questionChoice.findUnique({
      where: { id: choiceId },
    })

    if (!choice || choice.questionId !== questionId) {
      return NextResponse.json(
        { error: "Invalid choice for this question" },
        { status: 400 }
      )
    }

    const answer = await prisma.quizAnswer.create({
      data: {
        attemptId,
        questionId,
        choiceId,
        isCorrect: choice.isCorrect,
      },
    })

    return NextResponse.json(answer, { status: 201 })
  } catch (error) {
    console.error("Submit answer error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
