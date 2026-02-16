import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { questionBankSchema } from "@/lib/validations"

export const dynamic = "force-dynamic"

// GET /api/quizzes/banks - Get user's question banks
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const banks = await prisma.questionBank.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(banks)
  } catch (error) {
    console.error("Get question banks error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/quizzes/banks - Create a new question bank
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    const parsed = questionBankSchema.safeParse(body)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join("; ")
      console.error("Validation failed:", msg, JSON.stringify(parsed.error.issues))
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    const { title, subject, description, imageUrl, isPublic } = parsed.data

    // Parse and validate incoming questions with correctChoiceIndex
    const rawQuestions: {
      prompt: string
      imageUrl?: string
      passage?: string
      explanation: string
      correctChoiceIndex: number
      choices: { text: string }[]
    }[] = Array.isArray(body.questions) ? body.questions : []

    // Filter out incomplete questions (allow blank sets)
    const validQuestions = rawQuestions.filter(
      (q) =>
        q.prompt?.trim() &&
        q.explanation?.trim() &&
        Array.isArray(q.choices) &&
        q.choices.filter((c) => c.text?.trim()).length >= 2 &&
        typeof q.correctChoiceIndex === "number" &&
        q.correctChoiceIndex >= 0 &&
        q.correctChoiceIndex < q.choices.length
    )

    // STEP 1: Create QuestionSet atomically with nested questions/choices
    const bank = await prisma.questionBank.create({
      data: {
        title,
        subject,
        description: description || null,
        imageUrl: imageUrl || null,
        isPublic: isPublic || false,
        ownerId: session.user.id,
        questions: {
          create: validQuestions.map((q, index) => {
            const filteredChoices = q.choices.filter((c) => c.text?.trim())
            return {
              prompt: q.prompt.trim(),
              imageUrl: q.imageUrl?.trim() || null,
              passage: q.passage?.trim() || null,
              explanation: q.explanation.trim(),
              correctChoiceId: "", // Temporary - will be set in next step
              orderIndex: index,
              choices: {
                create: filteredChoices.map((c, ci) => ({
                  text: c.text.trim(),
                  isCorrect: ci === q.correctChoiceIndex,
                  orderIndex: ci,
                })),
              },
            }
          }),
        },
      },
      include: {
        questions: {
          include: { choices: true },
        },
      },
    })

    // STEP 2: Set correctChoiceId for each question (now that choice IDs exist)
    for (const question of bank.questions) {
      const correctChoice = question.choices.find((c) => c.isCorrect)
      if (correctChoice) {
        await prisma.question.update({
          where: { id: question.id },
          data: { correctChoiceId: correctChoice.id },
        })
      }
    }

    // STEP 3: Confirm QuestionSet exists - explicit DB read-back
    const confirmedBank = await prisma.questionBank.findUnique({
      where: { id: bank.id },
      include: {
        questions: {
          include: { choices: { orderBy: { orderIndex: "asc" } } },
          orderBy: { orderIndex: "asc" },
        },
        _count: { select: { questions: true } },
      },
    })

    if (!confirmedBank) {
      console.error("CRITICAL: QuestionBank created but not found on read-back:", bank.id)
      return NextResponse.json(
        { error: "Failed to confirm question set creation" },
        { status: 500 }
      )
    }

    // STEP 4: Confirm Questions exist
    if (validQuestions.length > 0 && confirmedBank.questions.length !== validQuestions.length) {
      console.error(
        `CRITICAL: Expected ${validQuestions.length} questions, found ${confirmedBank.questions.length}`
      )
      return NextResponse.json(
        { error: "Failed to confirm all questions were created" },
        { status: 500 }
      )
    }

    // STEP 5: Return full hydrated object
    return NextResponse.json(confirmedBank, { status: 201 })
  } catch (error) {
    console.error("Create question bank error:", error)
    const message =
      error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
