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
    const { questionId, choiceId, openResponseText } = await request.json()

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 })
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

    // Get the question to check its type
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { bankId: true, type: true, pointValue: true },
    })
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 })
    if (question.bankId !== attempt.bankId) {
      return NextResponse.json({ error: "Question does not belong to this quiz" }, { status: 400 })
    }

    if (question.type === "OPEN_RESPONSE") {
      // Open response: store text, no auto-score (graded by student self-assessment later)
      const answer = await prisma.attemptAnswer.create({
        data: {
          attemptId,
          questionId,
          openResponseText: openResponseText || "",
          isCorrect: false,
          pointsEarned: 0,
        },
        include: {
          question: { include: { choices: true } },
        },
      })
      return NextResponse.json(answer)
    } else {
      // Multiple choice
      if (!choiceId) {
        return NextResponse.json({ error: "choiceId is required for multiple choice" }, { status: 400 })
      }

      const choice = await prisma.choice.findUnique({
        where: { id: choiceId },
        include: { question: { select: { bankId: true } } },
      })
      if (!choice) return NextResponse.json({ error: "Choice not found" }, { status: 404 })

      const isCorrect = choice.isCorrect
      const answer = await prisma.attemptAnswer.create({
        data: {
          attemptId,
          questionId,
          choiceId,
          isCorrect,
          pointsEarned: isCorrect ? question.pointValue : 0,
        },
        include: {
          choice: true,
          question: { include: { choices: true } },
        },
      })
      return NextResponse.json(answer)
    }
  } catch (error) {
    console.error("Submit answer error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/quizzes/attempts/[attemptId]/answer — update points earned (self-assessment for open response)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { attemptId } = await params
    const { questionId, pointsEarned } = await request.json()

    if (!questionId || pointsEarned == null) {
      return NextResponse.json({ error: "questionId and pointsEarned are required" }, { status: 400 })
    }

    const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } })
    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    if (attempt.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Get the question to validate pointsEarned doesn't exceed pointValue
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { pointValue: true },
    })
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 })

    const clampedPoints = Math.max(0, Math.min(Number(pointsEarned), question.pointValue))

    const updated = await prisma.attemptAnswer.update({
      where: { attemptId_questionId: { attemptId, questionId } },
      data: { pointsEarned: clampedPoints },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update answer points error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
