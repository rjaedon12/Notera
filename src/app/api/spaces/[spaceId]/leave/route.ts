import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/spaces/[spaceId]/leave - Leave a space
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params

    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json(
        { error: "You are not a member of this space" },
        { status: 400 }
      )
    }

    // Owners cannot leave, they must delete the space
    if (membership.role === "OWNER") {
      return NextResponse.json(
        {
          error:
            "Owners cannot leave. Transfer ownership or delete the space.",
        },
        { status: 400 }
      )
    }

    await prisma.spaceMember.delete({
      where: {
        userId_spaceId: {
          userId: session.user.id,
          spaceId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error leaving space:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
