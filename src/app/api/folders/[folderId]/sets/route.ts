import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/folders/[folderId]/sets - Add a set to a folder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    if (folder.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { setId } = body

    if (!setId) {
      return NextResponse.json(
        { error: "setId is required" },
        { status: 400 }
      )
    }

    // Check if already in folder
    const existing = await prisma.folderSet.findUnique({
      where: {
        folderId_setId: {
          folderId,
          setId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ message: "Set already in folder" })
    }

    await prisma.folderSet.create({
      data: {
        folderId,
        setId
      }
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Add set to folder error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/folders/[folderId]/sets - Remove a set from a folder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  try {
    const { folderId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folder = await prisma.folder.findUnique({
      where: { id: folderId }
    })

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    if (folder.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { setId } = body

    if (!setId) {
      return NextResponse.json(
        { error: "setId is required" },
        { status: 400 }
      )
    }

    await prisma.folderSet.deleteMany({
      where: {
        folderId,
        setId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove set from folder error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
