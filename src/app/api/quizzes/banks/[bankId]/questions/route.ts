import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { questionSchema } from "@/lib/validations"

// POST /api/quizzes/banks/[bankId]/questions - Add a question
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

    const bank = await prisma.questionBank.findUnique({
      where: { id: bankId },
      include: { _count: { select: { questions: true } } },
    })

    if (!bank) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (bank.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = questionSchema.safeParse({
      ...body,
      orderIndex: body.orderIndex ?? bank._count.questions,
    })
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { prompt, imageUrl, passage, explanation, correctChoiceIndex, orderIndex, choices } =
      parsed.data

    // Validate correctChoiceIndex is within bounds
    if (correctChoiceIndex < 0 || correctChoiceIndex >= choices.length) {
      return NextResponse.json(
        { error: "correctChoiceIndex must be a valid choice index" },
        { status: 400 }
      )
    }

    // Create question with choices
    const question = await prisma.question.create({
      data: {
        prompt,
        imageUrl: imageUrl || null,
        passage: passage || null,
        explanation,
        correctChoiceId: "", // Temporary - will be set after choices are created
        orderIndex,
        bankId,
        choices: {
          create: choices.map((c, i) => ({
            text: c.text,
            isCorrect: i === correctChoiceIndex,
            orderIndex: i,
          })),
        },
      },
      include: {
        choices: { orderBy: { orderIndex: "asc" } },
      },
    })

    // Update with actual correctChoiceId
    const correctChoice = question.choices[correctChoiceIndex]
    const updatedQuestion = await prisma.question.update({
      where: { id: question.id },
      data: { correctChoiceId: correctChoice.id },
      include: {
        choices: { orderBy: { orderIndex: "asc" } },
      },
    })

    return NextResponse.json(updatedQuestion, { status: 201 })
  } catch (error) {
    console.error("Create question error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
