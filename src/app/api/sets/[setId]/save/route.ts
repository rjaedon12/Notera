import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/sets/[setId]/save - Save a set
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const set = await prisma.studySet.findUnique({
      where: { id: setId }
    })

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    // Check if already saved
    const existing = await prisma.savedSet.findUnique({
      where: {
        userId_setId: {
          userId: session.user.id,
          setId
        }
      }
    })

    if (existing) {
      return NextResponse.json({ message: "Already saved" })
    }

    await prisma.savedSet.create({
      data: {
        userId: session.user.id,
        setId
      }
    })

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error) {
    console.error("Save set error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/sets/[setId]/save - Unsave a set
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await prisma.savedSet.deleteMany({
      where: {
        userId: session.user.id,
        setId
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Unsave set error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
