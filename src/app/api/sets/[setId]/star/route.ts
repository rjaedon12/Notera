import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/sets/[setId]/star — star a set
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { setId } = await params
    await prisma.$transaction([
      prisma.starredSet.upsert({
        where: { userId_setId: { userId: session.user.id, setId } },
        create: { userId: session.user.id, setId },
        update: {},
      }),
      prisma.savedSet.upsert({
        where: { userId_setId: { userId: session.user.id, setId } },
        create: { userId: session.user.id, setId },
        update: {},
      }),
    ])
    return Response.json({ starred: true })
  } catch (error) {
    console.error("Star set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/sets/[setId]/star — unstar a set
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { setId } = await params
    await prisma.$transaction([
      prisma.starredSet.deleteMany({ where: { userId: session.user.id, setId } }),
      prisma.savedSet.deleteMany({ where: { userId: session.user.id, setId } }),
    ])
    return Response.json({ starred: false })
  } catch (error) {
    console.error("Unstar set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
