import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

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

    const delimiter = format === "tsv" ? "\t" : ","
    const lines = content.split("\n").filter((l: string) => l.trim())
    
    // Skip header row if it looks like one
    const startIdx = lines[0]?.toLowerCase().includes("term") ? 1 : 0
    
    const cards: { term: string; definition: string }[] = []
    for (let i = startIdx; i < lines.length; i++) {
      const parts = lines[i].split(delimiter)
      if (parts.length >= 2) {
        cards.push({
          term: parts[0].replace(/^"|"$/g, "").trim(),
          definition: parts.slice(1).join(delimiter).replace(/^"|"$/g, "").trim(),
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
