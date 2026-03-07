import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/sets/[setId]/save — save a set to library
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
    await prisma.savedSet.upsert({
      where: { userId_setId: { userId: session.user.id, setId } },
      create: { userId: session.user.id, setId },
      update: {},
    })
    return Response.json({ saved: true })
  } catch (error) {
    console.error("Save set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/sets/[setId]/save — unsave a set
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
    await prisma.savedSet.deleteMany({
      where: { userId: session.user.id, setId },
    })
    return Response.json({ saved: false })
  } catch (error) {
    console.error("Unsave set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
