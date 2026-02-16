import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { generateShareToken } from "@/lib/utils"

// POST /api/sets/[setId]/share - Create a share link
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

    if (set.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check for existing share link
    const existing = await prisma.shareLink.findFirst({
      where: { setId }
    })

    if (existing) {
      const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${existing.token}`
      return NextResponse.json({ token: existing.token, url: shareUrl })
    }

    // Create new share link
    const token = generateShareToken()
    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        setId,
        userId: session.user.id
      }
    })

    const shareUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/share/${shareLink.token}`

    return NextResponse.json({ token: shareLink.token, url: shareUrl }, { status: 201 })
  } catch (error) {
    console.error("Create share link error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
