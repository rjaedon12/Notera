import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    const q = request.nextUrl.searchParams.get("q")?.trim()

    if (!q || q.length < 2) {
      return Response.json({ results: [] })
    }

    const search = { contains: q, mode: "insensitive" as const }

    // Public sets — available to everyone
    const setsPromise = prisma.flashcardSet.findMany({
      where: {
        isPublic: true,
        OR: [{ title: search }, { description: search }],
      },
      select: { id: true, title: true, description: true },
      take: 4,
      orderBy: { updatedAt: "desc" },
    })

    // Public quizzes
    const quizzesPromise = prisma.questionBank.findMany({
      where: {
        isPublic: true,
        OR: [{ title: search }, { subject: search }, { description: search }],
      },
      select: { id: true, title: true, subject: true },
      take: 4,
      orderBy: { updatedAt: "desc" },
    })

    // DBQs (all are public/premade)
    const dbqsPromise = prisma.dBQPrompt.findMany({
      where: {
        OR: [{ title: search }, { question: search }, { subject: search }],
      },
      select: { id: true, title: true, subject: true, era: true },
      take: 4,
      orderBy: { createdAt: "desc" },
    })

    // User's own content (only if logged in)
    const notesPromise = userId
      ? prisma.notePage.findMany({
          where: {
            userId,
            isArchived: false,
            title: search,
          },
          select: { id: true, title: true },
          take: 4,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([])

    const boardsPromise = userId
      ? prisma.whiteboardBoard.findMany({
          where: {
            ownerId: userId,
            title: search,
          },
          select: { id: true, title: true },
          take: 4,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([])

    const resourcesPromise = userId
      ? prisma.resource.findMany({
          where: {
            userId,
            title: search,
          },
          select: { id: true, title: true, type: true },
          take: 4,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([])

    const [sets, quizzes, dbqs, notes, boards, resources] = await Promise.all([
      setsPromise,
      quizzesPromise,
      dbqsPromise,
      notesPromise,
      boardsPromise,
      resourcesPromise,
    ])

    const results = [
      ...sets.map((s) => ({
        type: "set" as const,
        id: s.id,
        title: s.title,
        subtitle: s.description || "Study set",
        href: `/sets/${s.id}`,
      })),
      ...quizzes.map((q) => ({
        type: "quiz" as const,
        id: q.id,
        title: q.title,
        subtitle: q.subject,
        href: `/quizzes/${q.id}`,
      })),
      ...dbqs.map((d) => ({
        type: "dbq" as const,
        id: d.id,
        title: d.title,
        subtitle: `${d.subject} · ${d.era}`,
        href: `/dbq/${d.id}`,
      })),
      ...notes.map((n) => ({
        type: "note" as const,
        id: n.id,
        title: n.title,
        subtitle: "Note",
        href: `/notes/${n.id}`,
      })),
      ...boards.map((b) => ({
        type: "whiteboard" as const,
        id: b.id,
        title: b.title,
        subtitle: "Whiteboard",
        href: `/whiteboard/${b.id}`,
      })),
      ...resources.map((r) => ({
        type: "resource" as const,
        id: r.id,
        title: r.title,
        subtitle: r.type,
        href: `/resources/${r.id}`,
      })),
    ]

    return Response.json({ results })
  } catch (error) {
    console.error("Search error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
