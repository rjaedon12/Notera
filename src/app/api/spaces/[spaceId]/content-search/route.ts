import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/spaces/[spaceId]/content-search?q=...&type=flashcardSet|quiz|dbq
// Searches across user's own + public content by title for assignment linking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const q = request.nextUrl.searchParams.get("q") || ""
    const type = request.nextUrl.searchParams.get("type") || "flashcardSet"

    // Verify membership + moderator role
    const membership = await prisma.spaceMember.findFirst({
      where: {
        spaceId,
        userId: session.user.id,
        role: { in: ["OWNER", "MODERATOR"] },
      },
    })
    if (!membership) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    if (type === "flashcardSet") {
      const sets = await prisma.flashcardSet.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
          OR: [{ userId: session.user.id }, { isPublic: true }],
        },
        select: {
          id: true,
          title: true,
          description: true,
          _count: { select: { cards: true } },
          user: { select: { name: true } },
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      })
      return NextResponse.json(
        sets.map((s) => ({
          id: s.id,
          title: s.title,
          subtitle: `${s._count.cards} cards · by ${s.user.name || "Anonymous"}`,
          description: s.description,
        }))
      )
    }

    if (type === "quiz") {
      const banks = await prisma.questionBank.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
          OR: [
            { userId: session.user.id },
            { isPublic: true },
            { isPremade: true },
          ],
        },
        select: {
          id: true,
          title: true,
          subject: true,
          description: true,
          _count: { select: { questions: true } },
          user: { select: { name: true } },
        },
        take: 10,
        orderBy: { updatedAt: "desc" },
      })
      return NextResponse.json(
        banks.map((b) => ({
          id: b.id,
          title: b.title,
          subtitle: `${b._count.questions} questions${b.subject ? ` · ${b.subject}` : ""} · by ${b.user.name || "Anonymous"}`,
          description: b.description,
        }))
      )
    }

    if (type === "dbq") {
      const prompts = await prisma.dBQPrompt.findMany({
        where: {
          title: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true,
          title: true,
          subject: true,
          question: true,
          _count: { select: { documents: true } },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
      })
      return NextResponse.json(
        prompts.map((p) => ({
          id: p.id,
          title: p.title,
          subtitle: `${p._count.documents} documents${p.subject ? ` · ${p.subject}` : ""}`,
          description: p.question?.slice(0, 100),
        }))
      )
    }

    return NextResponse.json([])
  } catch (error) {
    console.error("Content search error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
