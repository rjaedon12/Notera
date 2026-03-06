import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/quizzes/banks/[bankId]/questions — add a question
export async function POST(
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

    const bank = await prisma.questionBank.findUnique({ where: { id: bankId } })
    if (!bank) return NextResponse.json({ error: "Bank not found" }, { status: 404 })
    if (bank.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const { prompt, imageUrl, passage, explanation, correctChoiceIndex, orderIndex, choices } = body

    if (!prompt || !explanation || !choices || choices.length < 2) {
      return NextResponse.json({ error: "Prompt, explanation, and at least 2 choices required" }, { status: 400 })
    }

    const question = await prisma.question.create({
      data: {
        prompt,
        imageUrl: imageUrl || null,
        passage: passage || null,
        explanation,
        orderIndex: orderIndex ?? 0,
        bankId,
        choices: {
          create: choices.map((c: { text: string; orderIndex?: number }, i: number) => ({
            text: c.text,
            isCorrect: i === (correctChoiceIndex ?? 0),
            orderIndex: c.orderIndex ?? i,
          })),
        },
      },
      include: { choices: { orderBy: { orderIndex: "asc" } } },
    })

    const correctChoice = question.choices.find((c) => c.isCorrect)

    return NextResponse.json({
      ...question,
      correctChoiceId: correctChoice?.id || null,
    }, { status: 201 })
  } catch (error) {
    console.error("Add question error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
