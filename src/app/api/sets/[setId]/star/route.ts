import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/sets/[setId]/star - Star a study set
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId } = await params

    // Check if already starred
    const existing = await prisma.starredSet.findUnique({
      where: {
        userId_setId: {
          userId: session.user.id,
          setId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: "Already starred" }, { status: 200 })
    }

    await prisma.starredSet.create({
      data: {
        userId: session.user.id,
        setId,
      },
    })

    return NextResponse.json({ starred: true }, { status: 201 })
  } catch (error) {
    console.error("Star set error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/sets/[setId]/star - Unstar a study set
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { setId } = await params

    await prisma.starredSet.deleteMany({
      where: {
        userId: session.user.id,
        setId,
      },
    })

    return NextResponse.json({ starred: false })
  } catch (error) {
    console.error("Unstar set error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
