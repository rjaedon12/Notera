import { NextRequest, NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/admin-auth"
import { scrapeQuizletSet, isValidQuizletUrl } from "@/lib/quizlet-scraper"

// POST /api/admin/sets/preview-quizlet — preview a Quizlet set before importing
export async function POST(request: NextRequest) {
  try {
    if (!(await verifyAdminAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { quizletUrl } = await request.json()

    if (!quizletUrl || typeof quizletUrl !== "string") {
      return NextResponse.json({ error: "quizletUrl is required" }, { status: 400 })
    }

    if (!isValidQuizletUrl(quizletUrl)) {
      return NextResponse.json(
        { error: "Invalid Quizlet URL. Expected format: https://quizlet.com/<set-id>/..." },
        { status: 400 }
      )
    }

    const quizletSet = await scrapeQuizletSet(quizletUrl)

    return NextResponse.json({
      title: quizletSet.title,
      description: quizletSet.description,
      numTerms: quizletSet.numTerms,
      terms: quizletSet.terms,
    })
  } catch (error) {
    console.error("Quizlet preview error:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch Quizlet set"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
