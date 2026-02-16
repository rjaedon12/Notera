import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/quizzes/attempts/[attemptId]/complete - Complete a quiz attempt
export async function POST(
  _request: NextRequest,
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
      include: {
        answers: true,
      },
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

    const score = attempt.answers.filter((a) => a.isCorrect).length

    const completed = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: {
        score,
        completedAt: new Date(),
      },
      include: {
        answers: {
          include: {
            question: {
              include: {
                choices: { orderBy: { orderIndex: "asc" } },
              },
            },
            choice: true,
          },
        },
        bank: { select: { id: true, title: true } },
      },
    })

    return NextResponse.json(completed)
  } catch (error) {
    console.error("Complete attempt error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
