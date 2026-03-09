import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/dbq/prompts/[promptId] — get single prompt with documents
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ promptId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { promptId } = await params

    const prompt = await prisma.dBQPrompt.findUnique({
      where: { id: promptId },
      include: {
        documents: { orderBy: { orderIndex: "asc" } },
      },
    })

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 })
    }

    return NextResponse.json(prompt)
  } catch (error) {
    console.error("Get DBQ prompt error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
