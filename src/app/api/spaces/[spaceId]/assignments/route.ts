import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/spaces/[spaceId]/assignments — list assignments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params

    // Verify membership
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const assignments = await prisma.spaceAssignment.findMany({
      where: { spaceId },
      include: {
        assignedBy: { select: { id: true, name: true } },
        flashcardSet: {
          select: {
            id: true,
            title: true,
            description: true,
            _count: { select: { cards: true } },
          },
        },
        questionBank: {
          select: {
            id: true,
            title: true,
            subject: true,
            description: true,
          },
        },
        dbqPrompt: {
          select: { id: true, title: true, subject: true, question: true },
        },
      },
      orderBy: { assignedAt: "desc" },
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error("Get assignments error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/spaces/[spaceId]/assignments — create assignment (owner/moderator only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const { title, description, dueDate, flashcardSetId, questionBankId, dbqPromptId } =
      await request.json()

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    // Verify user is owner or moderator
    const membership = await prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id,
        role: { in: ["OWNER", "MODERATOR"] },
      },
    })
    if (!membership) {
      return NextResponse.json(
        { error: "Only owners and moderators can create assignments" },
        { status: 403 }
      )
    }

    const assignment = await prisma.spaceAssignment.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        spaceId,
        assignedById: session.user.id,
        flashcardSetId: flashcardSetId || null,
        questionBankId: questionBankId || null,
        dbqPromptId: dbqPromptId || null,
      },
      include: {
        assignedBy: { select: { id: true, name: true } },
        flashcardSet: { select: { id: true, title: true } },
        questionBank: { select: { id: true, title: true } },
        dbqPrompt: { select: { id: true, title: true } },
      },
    })

    // Notify all members about the new assignment
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: { members: { select: { userId: true } } },
    })

    if (space) {
      const memberIds = space.members
        .map((m: { userId: string }) => m.userId)
        .filter((id: string) => id !== session.user.id)

      if (memberIds.length > 0) {
        await prisma.notification.createMany({
          data: memberIds.map((userId: string) => ({
            userId,
            type: "SPACE_ASSIGNMENT" as const,
            title: "New Assignment",
            message: `"${title}" was assigned in ${space.name}`,
            link: `/spaces/${spaceId}`,
          })),
        })
      }
    }

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error("Create assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/spaces/[spaceId]/assignments — delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const { assignmentId } = await request.json()

    const membership = await prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id,
        role: { in: ["OWNER", "MODERATOR"] },
      },
    })
    if (!membership) {
      return NextResponse.json(
        { error: "Only owners and moderators can delete assignments" },
        { status: 403 }
      )
    }

    await prisma.spaceAssignment.delete({
      where: { id: assignmentId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete assignment error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
