import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/folders/[folderId]/sets — add a set to folder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { folderId } = await params
    const { setId } = await request.json()
    if (!setId) {
      return Response.json({ error: "setId is required" }, { status: 400 })
    }
    const folder = await prisma.folder.findUnique({ where: { id: folderId } })
    if (!folder || folder.userId !== session.user.id) {
      return Response.json({ error: "Folder not found" }, { status: 404 })
    }
    await prisma.folderSet.upsert({
      where: { folderId_setId: { folderId, setId } },
      create: { folderId, setId },
      update: {},
    })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Add set to folder error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/folders/[folderId]/sets — remove a set from folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { folderId } = await params
    const { setId } = await request.json()
    if (!setId) {
      return Response.json({ error: "setId is required" }, { status: 400 })
    }
    await prisma.folderSet.deleteMany({ where: { folderId, setId } })
    return Response.json({ success: true })
  } catch (error) {
    console.error("Remove set from folder error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
