import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/quizzes/attempts/[attemptId] — get attempt details for review
export async function GET(
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
      include: {
        bank: {
          select: {
            id: true,
            title: true,
            subject: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                choices: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
            choice: true,
          },
          orderBy: {
            question: { orderIndex: "asc" },
          },
        },
      },
    })

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    if (attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(attempt)
  } catch (error) {
    console.error("Get attempt error:", error)
    return NextResponse.json(
      { error: "Failed to get attempt" },
      { status: 500 }
    )
  }
}

// DELETE /api/quizzes/attempts/[attemptId] — delete user's quiz attempt
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { attemptId } = await params

    // Verify the attempt belongs to the user
    const attempt = await prisma.quizAttempt.findUnique({
      where: { id: attemptId },
      select: { id: true, userId: true },
    })

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 })
    }

    if (attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete all answers for this attempt first
    await prisma.attemptAnswer.deleteMany({
      where: { attemptId },
    })

    // Delete the attempt
    await prisma.quizAttempt.delete({
      where: { id: attemptId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete attempt error:", error)
    return NextResponse.json(
      { error: "Failed to delete attempt" },
      { status: 500 }
    )
  }
}
