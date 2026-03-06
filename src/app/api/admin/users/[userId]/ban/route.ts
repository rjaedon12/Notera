import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// PUT /api/admin/users/[userId]/ban — toggle ban status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { userId } = await params
    const { isBanned } = await request.json()

    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot ban yourself" }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBanned: !!isBanned },
      select: { id: true, name: true, email: true, isBanned: true },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("Ban user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
