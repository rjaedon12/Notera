import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { questionSchema } from "@/lib/validations"
import { resolveSessionUserId } from "@/lib/session-user"

// PATCH /api/quizzes/banks/[bankId]/questions/[questionId] - Update a question
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ bankId: string; questionId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveSessionUserId(session.user)
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const sessionEmail = session.user.email?.toLowerCase().trim() ?? null

    const { bankId, questionId } = await params

    const bank = await prisma.questionBank.findUnique({
      where: { id: bankId },
      include: { owner: { select: { email: true } } },
    })

    const isOwner =
      !!bank &&
      (bank.ownerId === userId ||
        (!!sessionEmail && bank.owner?.email?.toLowerCase() === sessionEmail))

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (bank.ownerId !== userId) {
      await prisma.questionBank.update({
        where: { id: bankId },
        data: { ownerId: userId },
      })
    }

    const body = await request.json()
    const parsed = questionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { prompt, imageUrl, passage, explanation, orderIndex, choices } =
      parsed.data

    // Validate at least one correct choice
    const hasCorrect = choices.some((c) => c.isCorrect)
    if (!hasCorrect) {
      return NextResponse.json(
        { error: "At least one choice must be marked correct" },
        { status: 400 }
      )
    }

    // Delete old choices and create new ones in a transaction
    const question = await prisma.$transaction(async (tx) => {
      await tx.questionChoice.deleteMany({
        where: { questionId },
      })

      return tx.question.update({
        where: { id: questionId },
        data: {
          prompt,
          imageUrl: imageUrl || null,
          passage: passage || null,
          explanation,
          orderIndex,
          choices: {
            create: choices.map((c, i) => ({
              text: c.text,
              isCorrect: c.isCorrect,
              orderIndex: i,
            })),
          },
        },
        include: {
          choices: { orderBy: { orderIndex: "asc" } },
        },
      })
    })

    return NextResponse.json(question)
  } catch (error) {
    console.error("Update question error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/quizzes/banks/[bankId]/questions/[questionId] - Delete a question
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ bankId: string; questionId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = await resolveSessionUserId(session.user)
    if (!userId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    const sessionEmail = session.user.email?.toLowerCase().trim() ?? null

    const { bankId, questionId } = await params

    const bank = await prisma.questionBank.findUnique({
      where: { id: bankId },
      include: { owner: { select: { email: true } } },
    })

    const isOwner =
      !!bank &&
      (bank.ownerId === userId ||
        (!!sessionEmail && bank.owner?.email?.toLowerCase() === sessionEmail))

    if (!isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (bank.ownerId !== userId) {
      await prisma.questionBank.update({
        where: { id: bankId },
        data: { ownerId: userId },
      })
    }

    await prisma.question.delete({ where: { id: questionId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete question error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
