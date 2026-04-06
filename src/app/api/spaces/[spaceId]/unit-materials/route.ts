import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/spaces/[spaceId]/unit-materials — add material to a unit
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
    const { unitId, label, type, flashcardSetId, questionBankId, dbqPromptId } = await request.json()

    if (!unitId || !label || !type) {
      return NextResponse.json({ error: "unitId, label, and type are required" }, { status: 400 })
    }

    if (!["flashcardSet", "quiz", "dbq"].includes(type)) {
      return NextResponse.json({ error: "type must be flashcardSet, quiz, or dbq" }, { status: 400 })
    }

    // Check membership + role
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id },
      include: { user: { select: { role: true } } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    // Check hub space
    const space = await prisma.space.findUnique({ where: { id: spaceId }, select: { hubSlug: true } })
    const isHubModerator =
      membership.role === "OWNER" ||
      membership.role === "MODERATOR" ||
      (space?.hubSlug && (membership.user.role === "ADMIN" || membership.user.role === "TEACHER"))

    if (!isHubModerator) {
      return NextResponse.json({ error: "Only owners, moderators, and teachers can add materials" }, { status: 403 })
    }

    // Verify unit belongs to this hub
    const unit = await prisma.hubUnit.findUnique({ where: { id: unitId } })
    if (!unit || unit.hubSlug !== space?.hubSlug) {
      return NextResponse.json({ error: "Unit not found in this hub" }, { status: 404 })
    }

    const material = await prisma.hubUnitMaterial.create({
      data: {
        unitId,
        label: label.trim(),
        type,
        flashcardSetId: type === "flashcardSet" ? flashcardSetId : null,
        questionBankId: type === "quiz" ? questionBankId : null,
        dbqPromptId: type === "dbq" ? dbqPromptId : null,
        addedById: session.user.id,
      },
      include: {
        flashcardSet: { select: { id: true, title: true } },
        questionBank: { select: { id: true, title: true, quizType: true } },
        dbqPrompt: { select: { id: true, title: true } },
        addedBy: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error("Add unit material error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/spaces/[spaceId]/unit-materials — remove material
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
    const { materialId } = await request.json()

    if (!materialId) {
      return NextResponse.json({ error: "materialId is required" }, { status: 400 })
    }

    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id },
      include: { user: { select: { role: true } } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const space = await prisma.space.findUnique({ where: { id: spaceId }, select: { hubSlug: true } })
    const isHubModerator =
      membership.role === "OWNER" ||
      membership.role === "MODERATOR" ||
      (space?.hubSlug && (membership.user.role === "ADMIN" || membership.user.role === "TEACHER"))

    if (!isHubModerator) {
      return NextResponse.json({ error: "Only owners, moderators, and teachers can remove materials" }, { status: 403 })
    }

    await prisma.hubUnitMaterial.delete({ where: { id: materialId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete unit material error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
