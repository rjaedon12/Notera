import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import {
  getQuestionBankFeedbackModeData,
  getQuestionBankSelect,
  QUESTION_WITH_CHOICES_SELECT,
  withQuestionBankDefaults,
} from "@/lib/question-bank-compat"

// GET /api/quizzes/banks — returns { myBanks, premadeBanks }
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bankSelect = await getQuestionBankSelect({
      user: { select: { id: true, name: true } },
      _count: { select: { questions: true, attempts: true } },
    })

    const [myBanks, premadeBanks] = await Promise.all([
      prisma.questionBank.findMany({
        where: { userId: session.user.id },
        select: bankSelect,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.questionBank.findMany({
        where: {
          OR: [{ isPublic: true }, { isPremade: true }],
          NOT: { userId: session.user.id },
        },
        select: bankSelect,
        orderBy: { updatedAt: "desc" },
      }),
    ])

    // Map owner to match the frontend's expected field names
    const mapBank = (bank: (typeof myBanks)[number]) => ({
      ...withQuestionBankDefaults(bank),
      ownerId: bank.userId,
    })

    return NextResponse.json({
      myBanks: myBanks.map(mapBank),
      premadeBanks: premadeBanks.map(mapBank),
    })
  } catch (error) {
    console.error("Get question banks error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/quizzes/banks — create a question bank, optionally with questions
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      subject,
      description,
      imageUrl,
      isPublic,
      timerMinutes,
      desmosEnabled,
      feedbackMode,
      questions,
    } = body

    if (!title || !subject) {
      return NextResponse.json({ error: "Title and subject are required" }, { status: 400 })
    }

    const feedbackModeData = await getQuestionBankFeedbackModeData(feedbackMode)
    const bankSelect = await getQuestionBankSelect({
      questions: {
        select: QUESTION_WITH_CHOICES_SELECT,
        orderBy: { orderIndex: "asc" },
      },
      _count: { select: { questions: true, attempts: true } },
    })

    const bank = await prisma.questionBank.create({
      data: {
        title,
        subject,
        description: description || null,
        imageUrl: imageUrl || null,
        isPublic: isPublic ?? false,
        timerMinutes: timerMinutes != null ? Number(timerMinutes) : null,
        desmosEnabled: desmosEnabled ?? false,
        ...feedbackModeData,
        userId: session.user.id,
        ...(questions && questions.length > 0
          ? {
              questions: {
                create: questions.map(
                  (q: {
                    prompt: string
                    imageUrl?: string
                    passage?: string
                    explanation: string
                    type?: string
                    pointValue?: number
                    exampleAnswer?: string
                    correctChoiceIndex?: number
                    choices?: { text: string }[]
                  }, qi: number) => ({
                    prompt: q.prompt,
                    imageUrl: q.imageUrl || null,
                    passage: q.passage || null,
                    explanation: q.explanation,
                    type: q.type === "OPEN_RESPONSE" ? "OPEN_RESPONSE" : "MULTIPLE_CHOICE",
                    pointValue: q.pointValue ?? 1,
                    exampleAnswer: q.exampleAnswer || null,
                    orderIndex: qi,
                    ...(q.type !== "OPEN_RESPONSE" && q.choices && q.choices.length > 0
                      ? {
                          choices: {
                            create: q.choices.map((c: { text: string }, ci: number) => ({
                              text: c.text,
                              isCorrect: ci === (q.correctChoiceIndex ?? 0),
                              orderIndex: ci,
                            })),
                          },
                        }
                      : {}),
                  })
                ),
              },
            }
          : {}),
      },
      select: bankSelect,
    })

    return NextResponse.json(withQuestionBankDefaults(bank), { status: 201 })
  } catch (error) {
    console.error("Create question bank error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
