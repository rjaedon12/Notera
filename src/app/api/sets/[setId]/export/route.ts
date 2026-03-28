import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import PptxGenJS from "pptxgenjs"

// GET /api/sets/[setId]/export — export set as CSV, TSV, JSON, or PPTX
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

    if (format === "pptx") {
      const pres = new PptxGenJS()
      pres.layout = "LAYOUT_WIDE"

      // Title slide
      const titleSlide = pres.addSlide()
      titleSlide.background = { color: "1D4ED8" }
      titleSlide.addText(set.title, {
        x: 0.5,
        y: 1.5,
        w: "90%",
        h: 1.5,
        fontSize: 40,
        bold: true,
        color: "FFFFFF",
        align: "center",
      })
      if (set.description) {
        titleSlide.addText(set.description, {
          x: 0.5,
          y: 3.2,
          w: "90%",
          h: 0.8,
          fontSize: 18,
          color: "BFDBFE",
          align: "center",
        })
      }
      titleSlide.addText(`${set.cards.length} card${set.cards.length !== 1 ? "s" : ""}`, {
        x: 0.5,
        y: 4.2,
        w: "90%",
        h: 0.5,
        fontSize: 14,
        color: "93C5FD",
        align: "center",
      })

      // One slide per card: term on top, definition on bottom
      for (const card of set.cards) {
        const slide = pres.addSlide()
        slide.background = { color: "F8FAFC" }

        // Term section
        slide.addShape(pres.ShapeType.rect, {
          x: 0.5,
          y: 0.4,
          w: "88%",
          h: 2.6,
          fill: { color: "1D4ED8" },
          line: { color: "1D4ED8", width: 0 },
        })
        slide.addText("TERM", {
          x: 0.5,
          y: 0.5,
          w: "88%",
          h: 0.35,
          fontSize: 11,
          bold: true,
          color: "93C5FD",
          align: "center",
        })
        slide.addText(card.term, {
          x: 0.5,
          y: 0.9,
          w: "88%",
          h: 2.0,
          fontSize: 24,
          bold: true,
          color: "FFFFFF",
          align: "center",
          valign: "middle",
        })

        // Definition section
        slide.addShape(pres.ShapeType.rect, {
          x: 0.5,
          y: 3.2,
          w: "88%",
          h: 2.6,
          fill: { color: "FFFFFF" },
          line: { color: "E2E8F0", width: 1 },
        })
        slide.addText("DEFINITION", {
          x: 0.5,
          y: 3.3,
          w: "88%",
          h: 0.35,
          fontSize: 11,
          bold: true,
          color: "64748B",
          align: "center",
        })
        slide.addText(card.definition, {
          x: 0.5,
          y: 3.7,
          w: "88%",
          h: 2.0,
          fontSize: 18,
          color: "1E293B",
          align: "center",
          valign: "middle",
        })
      }

      const buffer = (await pres.write({ outputType: "nodebuffer" })) as Buffer
      const safeTitle = set.title.replace(/[^a-z0-9\s-]/gi, "").replace(/[\s-]+/g, "-").trim() || "flashcards"
      return new Response(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "Content-Disposition": `attachment; filename="${safeTitle}.pptx"`,
        },
      })
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
        // Escape tabs and newlines to prevent TSV corruption
        const term = card.term.replace(/[\t\n\r]/g, ' ')
        const def = card.definition.replace(/[\t\n\r]/g, ' ')
        tsvRows.push(`${term}\t${def}`)
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
