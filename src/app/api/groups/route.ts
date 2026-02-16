import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

// Generate a short invite code
function generateInviteCode(): string {
  return randomBytes(4).toString("hex").toUpperCase()
}

// GET /api/groups - Get user's groups
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId: session.user.id }
        }
      },
      include: {
        _count: {
          select: { members: true, sets: true }
        },
        members: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      )
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: session.user.id,
        inviteToken: generateInviteCode(),
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER"
          }
        }
      },
      include: {
        _count: { select: { members: true, sets: true } },
        members: {
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
