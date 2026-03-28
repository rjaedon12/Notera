import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth } from "@/lib/admin-auth"
import { scrapeQuizletSet, isValidQuizletUrl } from "@/lib/quizlet-scraper"
import { auth } from "@/lib/auth"

// POST /api/admin/sets/import-quizlet — import a Quizlet set and create it in the app
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      quizletUrl,
      title: customTitle,
      description: customDescription,
      isPublic = true,
      isFeatured = false,
      tags = [],
    } = body

    if (!quizletUrl || typeof quizletUrl !== "string") {
      return NextResponse.json({ error: "quizletUrl is required" }, { status: 400 })
    }

    if (!isValidQuizletUrl(quizletUrl)) {
      return NextResponse.json(
        { error: "Invalid Quizlet URL. Expected format: https://quizlet.com/<set-id>/..." },
        { status: 400 }
      )
    }

    // Scrape the Quizlet set
    const quizletSet = await scrapeQuizletSet(quizletUrl)

    if (quizletSet.terms.length === 0) {
      return NextResponse.json({ error: "No terms found in the Quizlet set" }, { status: 400 })
    }

    // Use custom title/description if provided, otherwise use scraped values
    const title = customTitle?.trim() || quizletSet.title || "Imported Quizlet Set"
    const description = customDescription?.trim() || quizletSet.description || ""

    // Create the set with cards in the database
    const set = await prisma.flashcardSet.create({
      data: {
        title,
        description,
        isPublic,
        isFeatured,
        tags: Array.isArray(tags) ? tags : [],
        userId: session.user.id,
        cards: {
          create: quizletSet.terms.map((term, index) => ({
            term: term.term,
            definition: term.definition,
            order: index,
          })),
        },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { cards: true } },
      },
    })

    return NextResponse.json(set)
  } catch (error) {
    console.error("Quizlet import error:", error)
    const message = error instanceof Error ? error.message : "Failed to import Quizlet set"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
