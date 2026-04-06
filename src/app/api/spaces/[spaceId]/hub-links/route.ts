import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/spaces/[spaceId]/hub-links — list linked quizzes for hub
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params

    const links = await prisma.hubQuizLink.findMany({
      where: { spaceId },
      include: {
        questionBank: {
          select: {
            id: true, title: true, subject: true, description: true, quizType: true,
            _count: { select: { questions: true } },
          },
        },
        dbqPrompt: {
          select: {
            id: true, title: true, subject: true, era: true, question: true,
            _count: { select: { documents: true } },
          },
        },
        addedBy: { select: { id: true, name: true } },
      },
      orderBy: { addedAt: "desc" },
    })

    return NextResponse.json(links)
  } catch (error) {
    console.error("Error fetching hub links:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/spaces/[spaceId]/hub-links — link a quiz to hub tab
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const { questionBankId, dbqPromptId, tabType } = await request.json()

    if (!tabType || !["dbq", "frq", "mcq", "leq"].includes(tabType)) {
      return NextResponse.json({ error: "Invalid tabType (must be dbq, frq, mcq, or leq)" }, { status: 400 })
    }

    if (!questionBankId && !dbqPromptId) {
      return NextResponse.json({ error: "Must provide questionBankId or dbqPromptId" }, { status: 400 })
    }

    // Check moderator role
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id, role: { in: ["OWNER", "MODERATOR"] } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Only teachers and admins can link content" }, { status: 403 })
    }

    const link = await prisma.hubQuizLink.create({
      data: {
        spaceId,
        tabType,
        questionBankId: questionBankId || null,
        dbqPromptId: dbqPromptId || null,
        addedById: session.user.id,
      },
      include: {
        questionBank: { select: { id: true, title: true, subject: true, description: true, quizType: true, _count: { select: { questions: true } } } },
        dbqPrompt: { select: { id: true, title: true, subject: true, era: true, question: true, _count: { select: { documents: true } } } },
        addedBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(link)
  } catch (error) {
    console.error("Error creating hub link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/spaces/[spaceId]/hub-links — unlink a quiz from hub tab
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const { linkId } = await request.json()

    if (!linkId) {
      return NextResponse.json({ error: "linkId is required" }, { status: 400 })
    }

    // Check moderator role
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id, role: { in: ["OWNER", "MODERATOR"] } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Only teachers and admins can remove content" }, { status: 403 })
    }

    await prisma.hubQuizLink.delete({ where: { id: linkId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting hub link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
