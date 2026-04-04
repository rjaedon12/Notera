import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import {
  getQuestionBankFeedbackModeData,
  getQuestionBankSelect,
  QUESTION_BANK_OWNER_SELECT,
  QUESTION_WITH_CHOICES_SELECT,
  withQuestionBankDefaults,
} from "@/lib/question-bank-compat"

// GET /api/quizzes/banks/[bankId]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bankId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bankId } = await params
    const bankSelect = await getQuestionBankSelect({
      questions: {
        select: QUESTION_WITH_CHOICES_SELECT,
        orderBy: { orderIndex: "asc" },
      },
      user: { select: { id: true, name: true } },
      _count: { select: { questions: true, attempts: true } },
    })

    const bank = await prisma.questionBank.findUnique({
      where: { id: bankId },
      select: bankSelect,
    })

    if (!bank) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Check access
    if (!bank.isPublic && !bank.isPremade && bank.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Map correctChoiceId for each question
    const normalizedBank = withQuestionBankDefaults(bank)

    const questionsWithCorrect = normalizedBank.questions.map((q) => {
      const correctChoice = q.choices.find((c) => c.isCorrect)
      return { ...q, correctChoiceId: correctChoice?.id || null }
    })

    return NextResponse.json({
      ...normalizedBank,
      ownerId: normalizedBank.userId,
      questions: questionsWithCorrect,
    })
  } catch (error) {
    console.error("Get question bank error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/quizzes/banks/[bankId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bankId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bankId } = await params
    const body = await request.json()

    const bank = await prisma.questionBank.findUnique({
      where: { id: bankId },
      select: QUESTION_BANK_OWNER_SELECT,
    })
    if (!bank) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (bank.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const feedbackModeData = await getQuestionBankFeedbackModeData(body.feedbackMode)
    const bankSelect = await getQuestionBankSelect({
      _count: { select: { questions: true, attempts: true } },
    })

    const updated = await prisma.questionBank.update({
      where: { id: bankId },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.subject !== undefined && { subject: body.subject }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
        ...(body.timerMinutes !== undefined && { timerMinutes: body.timerMinutes === null ? null : Number(body.timerMinutes) }),
        ...(body.desmosEnabled !== undefined && { desmosEnabled: body.desmosEnabled }),
        ...feedbackModeData,
      },
      select: bankSelect,
    })

    return NextResponse.json(withQuestionBankDefaults(updated))
  } catch (error) {
    console.error("Update question bank error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/quizzes/banks/[bankId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bankId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bankId } = await params

    const bank = await prisma.questionBank.findUnique({
      where: { id: bankId },
      select: QUESTION_BANK_OWNER_SELECT,
    })
    if (!bank) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (bank.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await prisma.questionBank.delete({ where: { id: bankId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete question bank error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
