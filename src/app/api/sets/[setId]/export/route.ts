import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/sets/[setId]/export — export set as CSV
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const format = request.nextUrl.searchParams.get("format") || "csv"

    const set = await prisma.flashcardSet.findUnique({
      where: { id: setId },
      include: { cards: { orderBy: { order: "asc" } } },
    })

    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }

    // Check access
    const session = await auth()
    if (!set.isPublic && set.userId !== session?.user?.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    if (format === "csv") {
      const csvRows = ["term,definition"]
      for (const card of set.cards) {
        const term = `"${card.term.replace(/"/g, '""')}"`
        const def = `"${card.definition.replace(/"/g, '""')}"`
        csvRows.push(`${term},${def}`)
      }
      return new Response(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${set.title}.csv"`,
        },
      })
    }

    if (format === "tsv") {
      const tsvRows = ["term\tdefinition"]
      for (const card of set.cards) {
        tsvRows.push(`${card.term}\t${card.definition}`)
      }
      return new Response(tsvRows.join("\n"), {
        headers: {
          "Content-Type": "text/tab-separated-values",
          "Content-Disposition": `attachment; filename="${set.title}.tsv"`,
        },
      })
    }

    // JSON fallback
    return Response.json({
      title: set.title,
      description: set.description,
      cards: set.cards.map((c) => ({ term: c.term, definition: c.definition })),
    })
  } catch (error) {
    console.error("Export set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
