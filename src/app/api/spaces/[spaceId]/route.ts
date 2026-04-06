import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/spaces/[spaceId] - Get space details
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

    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                streak: true,
                longestStreak: true,
                role: true,
              },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        sets: {
          include: {
            set: {
              include: {
                user: { select: { id: true, name: true } },
                _count: { select: { cards: true } },
              },
            },
          },
        },
        assignments: {
          include: {
            assignedBy: { select: { id: true, name: true } },
            flashcardSet: { select: { id: true, title: true } },
            questionBank: { select: { id: true, title: true } },
            dbqPrompt: { select: { id: true, title: true } },
          },
          orderBy: { assignedAt: "desc" },
        },
        announcements: {
          include: {
            author: { select: { id: true, name: true, image: true } },
            comments: {
              include: {
                author: { select: { id: true, name: true, image: true } },
                replies: {
                  include: {
                    author: { select: { id: true, name: true, image: true } },
                  },
                  orderBy: { createdAt: "asc" as const },
                },
              },
              where: { parentId: null },
              orderBy: { createdAt: "asc" as const },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    })

    if (!space) {
      return NextResponse.json({ error: "Space not found" }, { status: 404 })
    }

    // Check if user is a member
    const isMember = space.members.some(
      (m: { userId: string }) => m.userId === session.user.id
    )
    if (!isMember) {
      return NextResponse.json({ error: "NOT_MEMBER" }, { status: 403 })
    }

    // Build leaderboard from members' streak data
    const leaderboard = space.members
      .map((m) => ({
        userId: m.user.id,
        name: m.user.name || "Anonymous",
        image: m.user.image,
        streak: m.user.streak,
        longestStreak: m.user.longestStreak,
        role: m.role,
      }))
      .sort((a, b) => b.streak - a.streak)

    // If this is a hub space, include hub-specific data
    let hubUnits: unknown[] = []
    let hubQuizLinks: unknown[] = []

    if (space.hubSlug) {
      hubUnits = await prisma.hubUnit.findMany({
        where: { hubSlug: space.hubSlug },
        orderBy: { orderIndex: "asc" },
        include: {
          materials: {
            include: {
              flashcardSet: { select: { id: true, title: true } },
              questionBank: { select: { id: true, title: true, quizType: true } },
              dbqPrompt: { select: { id: true, title: true } },
              addedBy: { select: { id: true, name: true } },
            },
            orderBy: { addedAt: "desc" },
          },
        },
      })

      hubQuizLinks = await prisma.hubQuizLink.findMany({
        where: { spaceId: space.id },
        include: {
          questionBank: { select: { id: true, title: true, subject: true, description: true, quizType: true, _count: { select: { questions: true } } } },
          dbqPrompt: { select: { id: true, title: true, subject: true, era: true, question: true, _count: { select: { documents: true } } } },
          addedBy: { select: { id: true, name: true } },
        },
        orderBy: { addedAt: "desc" },
      })
    }

    return NextResponse.json({ ...space, leaderboard, hubUnits, hubQuizLinks })
  } catch (error) {
    console.error("Error fetching space:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/spaces/[spaceId] - Delete a space (owner only)
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

    const membership = await prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id,
        role: "OWNER",
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Only the owner can delete a space" },
        { status: 403 }
      )
    }

    await prisma.space.delete({
      where: { id: spaceId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting space:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PATCH /api/spaces/[spaceId] - Update space (name, description, banner)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const body = await request.json()

    const membership = await prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id,
      },
      include: { user: { select: { role: true } } },
    })

    const space_for_patch = await prisma.space.findUnique({ where: { id: spaceId }, select: { hubSlug: true } })
    const canEdit = membership && (
      membership.role === "OWNER" ||
      membership.role === "MODERATOR" ||
      (space_for_patch?.hubSlug && (membership.user.role === "ADMIN" || membership.user.role === "TEACHER"))
    )

    if (!canEdit) {
      return NextResponse.json(
        { error: "Only owners and moderators can update a space" },
        { status: 403 }
      )
    }

    const data: Record<string, string | null> = {}
    if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim()
    if (typeof body.description === "string") data.description = body.description || null
    if (typeof body.bannerColor === "string") data.bannerColor = body.bannerColor || null
    if (typeof body.bannerImage === "string") data.bannerImage = body.bannerImage || null
    if (typeof body.hubInfoText === "string") data.hubInfoText = body.hubInfoText

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const updated = await prisma.space.update({
      where: { id: spaceId },
      data,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating space:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
