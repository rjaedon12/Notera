import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { questionBankSchema } from "@/lib/validations"

// GET /api/quizzes/banks/[bankId] - Get a single question bank
export async function GET(
  _request: NextRequest,
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
      include: {
        questions: {
          include: { choices: { orderBy: { orderIndex: "asc" } } },
          orderBy: { orderIndex: "asc" },
        },
        owner: { select: { id: true, name: true } },
        _count: { select: { questions: true, attempts: true } },
      },
    })

    if (!bank) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Only owner or public
    if (bank.ownerId !== session.user.id && !bank.isPublic) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // correctChoiceId is now stored in DB, no need to derive
    return NextResponse.json(bank)
  } catch (error) {
    console.error("Get question bank error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/quizzes/banks/[bankId] - Update a question bank
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

    const existing = await prisma.questionBank.findUnique({
      where: { id: bankId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = questionBankSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { title, subject, description, imageUrl, isPublic } = parsed.data

    const bank = await prisma.questionBank.update({
      where: { id: bankId },
      data: {
        title,
        subject,
        description: description || null,
        imageUrl: imageUrl || null,
        isPublic: isPublic || false,
      },
      include: {
        _count: { select: { questions: true } },
      },
    })

    return NextResponse.json(bank)
  } catch (error) {
    console.error("Update question bank error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/quizzes/banks/[bankId] - Delete a question bank
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ bankId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { bankId } = await params

    const existing = await prisma.questionBank.findUnique({
      where: { id: bankId },
    })

    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (existing.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.questionBank.delete({ where: { id: bankId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete question bank error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
