import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/dbq/essays?promptId=xxx — get user's essays for a prompt
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const promptId = searchParams.get("promptId")

    const where: Record<string, unknown> = { userId: session.user.id }
    if (promptId) where.promptId = promptId

    const essays = await prisma.dBQEssay.findMany({
      where,
      include: {
        prompt: { select: { id: true, title: true, question: true } },
      },
      orderBy: { submittedAt: "desc" },
    })

    return NextResponse.json(essays)
  } catch (error) {
    console.error("Get DBQ essays error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/dbq/essays — submit a new essay
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { promptId, content, highlights } = body

    if (!promptId || !content) {
      return NextResponse.json(
        { error: "promptId and content are required" },
        { status: 400 }
      )
    }

    // Verify prompt exists
    const prompt = await prisma.dBQPrompt.findUnique({
      where: { id: promptId },
    })
    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 })
    }

    const wordCount = content
      .trim()
      .split(/\s+/)
      .filter((w: string) => w.length > 0).length

    const essay = await prisma.dBQEssay.create({
      data: {
        content,
        highlights: highlights ? JSON.stringify(highlights) : null,
        wordCount,
        userId: session.user.id,
        promptId,
      },
    })

    return NextResponse.json(essay, { status: 201 })
  } catch (error) {
    console.error("Submit DBQ essay error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
