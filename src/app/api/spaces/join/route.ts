import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { buildRateLimitKey, createRateLimitResponse, takeRateLimit } from "@/lib/rate-limit"

// POST /api/spaces/join — join space by { inviteCode } or { spaceId } (for public hubs)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { inviteCode, spaceId: publicSpaceId } = body

    // Either inviteCode or spaceId (for public hubs) is required
    if (!inviteCode && !publicSpaceId) {
      return Response.json(
        { error: "Invite code or space ID is required" },
        { status: 400 }
      )
    }

    let space;

    if (publicSpaceId && typeof publicSpaceId === "string") {
      // Public hub join — no invite code needed
      space = await prisma.space.findUnique({
        where: { id: publicSpaceId },
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      })
      if (!space || !space.isPublic) {
        return Response.json({ error: "Space not found or not public" }, { status: 404 })
      }
    } else if (inviteCode && typeof inviteCode === "string") {
      space = await prisma.space.findUnique({
        where: { inviteCode: inviteCode.toUpperCase() },
        include: {
          members: {
            where: { userId: session.user.id },
          },
        },
      })
      if (!space) {
        return Response.json({ error: "Invalid invite code" }, { status: 404 })
      }
    } else {
      return Response.json({ error: "Invalid request" }, { status: 400 })
    }

    // Already a member?
    if (space.members.length > 0) {
      return Response.json(
        { error: "You are already a member of this space" },
        { status: 400 }
      )
    }

    const rateLimit = takeRateLimit(buildRateLimitKey("spaces-join", request, session.user.id), {
      limit: 10,
      windowMs: 10 * 60 * 1000,
    })
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "Too many join attempts. Please try again later.")
    }

    // Auto-assign role: STUDENT for classrooms, MEMBER for collaborative spaces
    // Global ADMIN/TEACHER users get MODERATOR in hub spaces
    let joinRole: "STUDENT" | "MEMBER" | "MODERATOR" = space.type === "CLASSROOM" ? "STUDENT" : "MEMBER"
    if (space.hubSlug) {
      const joiningUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      })
      if (joiningUser?.role === "ADMIN" || joiningUser?.role === "TEACHER") {
        joinRole = "MODERATOR"
      }
    }

    // Atomic: create member + send notification to space owner
    await prisma.$transaction([
      prisma.spaceMember.create({
        data: {
          userId: session.user.id,
          spaceId: space.id,
          role: joinRole,
        },
      }),
      prisma.notification.create({
        data: {
          userId: space.ownerId,
          type: "SPACE_INVITE",
          title: "New member joined",
          message: `${session.user.name || "Someone"} joined your space "${space.name}"`,
          link: `/spaces/${space.id}`,
        },
      }),
    ])

    const updated = await prisma.space.findUnique({
      where: { id: space.id },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { members: true, sets: true, assignments: true } },
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error("Join space error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
