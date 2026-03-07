import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/folders/[folderId] — get folder with sets
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { folderId } = await params
    const folder = await prisma.folder.findUnique({
      where: { id: folderId, userId: session.user.id },
      include: {
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
        _count: { select: { sets: true } },
      },
    })
    if (!folder) {
      return Response.json({ error: "Folder not found" }, { status: 404 })
    }
    return Response.json(folder)
  } catch (error) {
    console.error("Get folder error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/folders/[folderId] — delete a folder
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { folderId } = await params
    const folder = await prisma.folder.findUnique({ where: { id: folderId } })
    if (!folder || folder.userId !== session.user.id) {
      return Response.json({ error: "Not found" }, { status: 404 })
    }
    await prisma.folder.delete({ where: { id: folderId } })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Delete folder error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
