import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/folders/[folderId] - Get a folder with its sets
export async function GET(
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
      where: { id: folderId },
      include: {
        sets: {
          include: {
            studySet: {
              include: {
                _count: { select: { cards: true } }
              }
            }
          }
        }
      }
    })

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 })
    }

    if (folder.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Flatten the sets
    const response = {
      ...folder,
      sets: folder.sets.map((fs: { studySet: unknown }) => fs.studySet)
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Get folder error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/folders/[folderId] - Delete a folder
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

    await prisma.folder.delete({
      where: { id: folderId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete folder error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
