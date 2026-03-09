import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/dbq/essays/[essayId] — get a single essay
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ essayId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { essayId } = await params

    const essay = await prisma.dBQEssay.findUnique({
      where: { id: essayId },
      include: {
        prompt: {
          include: {
            documents: { orderBy: { orderIndex: "asc" } },
          },
        },
      },
    })

    if (!essay) {
      return NextResponse.json({ error: "Essay not found" }, { status: 404 })
    }

    // Only allow the author to view their own essay
    if (essay.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json(essay)
  } catch (error) {
    console.error("Get DBQ essay error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
