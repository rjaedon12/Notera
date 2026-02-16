import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/folders - Get all folders for the user
export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const folders = await prisma.folder.findMany({
      where: { ownerId: session.user.id },
      include: {
        _count: { select: { sets: true } }
      },
      orderBy: { updatedAt: "desc" }
    })

    return NextResponse.json(folders)
  } catch (error) {
    console.error("Get folders error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/folders - Create a new folder
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Folder name is required" },
        { status: 400 }
      )
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        ownerId: session.user.id
      }
    })

    return NextResponse.json(folder, { status: 201 })
  } catch (error) {
    console.error("Create folder error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
