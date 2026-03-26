import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { parseCSVLine } from "@/lib/csv-parser"

// POST /api/sets/import — import cards from TSV/CSV text
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { title, content, format } = await request.json()
    if (!title || !content) {
      return Response.json({ error: "Title and content are required" }, { status: 400 })
    }

    const lines = content.split(/\r?\n/).filter((l: string) => l.trim())
    
    // Skip header row if it looks like one
    const first = lines[0]?.toLowerCase() ?? ""
    const headerWords = ["term", "definition", "english", "chinese", "pinyin", "latin", "front", "back"]
    const startIdx = headerWords.some((w) => first.includes(w)) ? 1 : 0
    
    const cards: { term: string; definition: string }[] = []
    for (let i = startIdx; i < lines.length; i++) {
      // TSV is simple split; CSV needs quoted-field awareness
      const fields = format === "tsv"
        ? lines[i].split("\t")
        : parseCSVLine(lines[i])
      if (fields.length >= 2) {
        cards.push({
          term: fields[0].trim(),
          definition: fields.slice(1).join(", ").trim(),
        })
      }
    }

    if (cards.length === 0) {
      return Response.json({ error: "No valid cards found in import data" }, { status: 400 })
    }

    const set = await prisma.flashcardSet.create({
      data: {
        title,
        userId: session.user.id,
        cards: {
          create: cards.map((c, i) => ({
            term: c.term,
            definition: c.definition,
            order: i,
          })),
        },
      },
      include: { _count: { select: { cards: true } } },
    })

    return Response.json(set)
  } catch (error) {
    console.error("Import set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
