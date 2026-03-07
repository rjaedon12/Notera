import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/folders — list user's folders
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const folders = await prisma.folder.findMany({
      where: { userId: session.user.id },
      include: { _count: { select: { sets: true } } },
      orderBy: { updatedAt: "desc" },
    })
    return Response.json(folders)
  } catch (error) {
    console.error("Get folders error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/folders — create a folder
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { name } = await request.json()
    if (!name?.trim()) {
      return Response.json({ error: "Folder name is required" }, { status: 400 })
    }
    const folder = await prisma.folder.create({
      data: { name: name.trim(), userId: session.user.id },
      include: { _count: { select: { sets: true } } },
    })
    return Response.json(folder)
  } catch (error) {
    console.error("Create folder error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
