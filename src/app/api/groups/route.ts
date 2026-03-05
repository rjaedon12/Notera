import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { randomBytes } from "crypto"

function generateInviteCode(): string {
  return randomBytes(3).toString("hex").toUpperCase() // 6-char hex code
}

// GET /api/groups — get user's groups
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId: session.user.id },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, sets: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(groups)
  } catch (error) {
    console.error("Get groups error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/groups — create group, auto-generate 6-char invite code
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await request.json()

    if (!name) {
      return Response.json(
        { error: "Group name is required" },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name,
        inviteCode: generateInviteCode(),
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, sets: true } },
      },
    })

    return Response.json(group, { status: 201 })
  } catch (error) {
    console.error("Create group error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
