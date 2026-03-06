import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PATCH /api/quizzes/banks/[bankId]/questions/[questionId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bankId: string; questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bankId, questionId } = await params
    const body = await request.json()

    const bank = await prisma.questionBank.findUnique({ where: { id: bankId } })
    if (!bank) return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    if (bank.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Update the question
    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(body.prompt !== undefined && { prompt: body.prompt }),
        ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
        ...(body.passage !== undefined && { passage: body.passage }),
        ...(body.explanation !== undefined && { explanation: body.explanation }),
        ...(body.orderIndex !== undefined && { orderIndex: body.orderIndex }),
      },
    })

    // If choices are provided, recreate them
    if (body.choices) {
      await prisma.choice.deleteMany({ where: { questionId } })
      await Promise.all(
        body.choices.map((c: { text: string; isCorrect: boolean; orderIndex: number }, i: number) =>
          prisma.choice.create({
            data: {
              text: c.text,
              isCorrect: c.isCorrect ?? false,
              orderIndex: c.orderIndex ?? i,
              questionId,
            },
          })
        )
      )
    }

    const result = await prisma.question.findUnique({
      where: { id: questionId },
      include: { choices: { orderBy: { orderIndex: "asc" } } },
    })

    const correctChoice = result?.choices.find((c) => c.isCorrect)

    return NextResponse.json({
      ...result,
      correctChoiceId: correctChoice?.id || null,
    })
  } catch (error) {
    console.error("Update question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/quizzes/banks/[bankId]/questions/[questionId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ bankId: string; questionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bankId, questionId } = await params

    const bank = await prisma.questionBank.findUnique({ where: { id: bankId } })
    if (!bank) return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    if (bank.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await prisma.question.delete({ where: { id: questionId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
