import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { randomBytes } from "crypto"

function generateInviteCode(): string {
  return randomBytes(3).toString("hex").toUpperCase() // 6-char hex code
}

// GET /api/spaces — get user's spaces
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const spaces = await prisma.space.findMany({
      where: {
        members: {
          some: { userId: session.user.id },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { members: true, sets: true, assignments: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return Response.json(spaces)
  } catch (error) {
    console.error("Get spaces error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/spaces — create space
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name) {
      return Response.json(
        { error: "Space name is required" },
        { status: 400 }
      )
    }

    // Auto-determine space type based on user role
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN"
    const spaceType = isTeacher ? "CLASSROOM" : "COLLABORATIVE"
    const memberRole = isTeacher ? "OWNER" : "OWNER"

    let space
    let retries = 3
    while (retries > 0) {
      try {
        space = await prisma.space.create({
          data: {
            name,
            description: description || null,
            inviteCode: generateInviteCode(),
            type: spaceType,
            ownerId: session.user.id,
            members: {
              create: {
                userId: session.user.id,
                role: memberRole,
              },
            },
          },
          include: {
            owner: { select: { id: true, name: true, email: true, role: true } },
            _count: { select: { members: true, sets: true, assignments: true } },
          },
        })
        break
      } catch (err: unknown) {
        const prismaError = err as { code?: string }
        if (prismaError.code === "P2002" && retries > 1) {
          retries--
          continue
        }
        throw err
      }
    }

    return Response.json(space, { status: 201 })
  } catch (error) {
    console.error("Create space error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
