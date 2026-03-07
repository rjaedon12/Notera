import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// POST /api/ai/explain — explain a flashcard concept
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { term, definition, cardId } = await request.json()
    if (!term && !cardId) {
      return Response.json({ error: "term or cardId is required" }, { status: 400 })
    }

    let cardTerm = term
    let cardDef = definition

    if (cardId && !term) {
      const card = await prisma.flashcard.findUnique({ where: { id: cardId } })
      if (!card) return Response.json({ error: "Card not found" }, { status: 404 })
      cardTerm = card.term
      cardDef = card.definition
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Fallback: return a structured local explanation
      return Response.json({
        explanation: `**${cardTerm}**\n\n${cardDef}\n\n*Tip: To get AI-powered explanations with examples and mnemonics, set the OPENAI_API_KEY environment variable.*`,
        source: "local",
      })
    }

    const prompt = `Explain the following concept in a clear, educational way. Include:
1. A simple explanation
2. An example or analogy
3. A memory trick or mnemonic if applicable

Term: ${cardTerm}
Definition: ${cardDef}`

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a friendly and helpful study tutor. Give concise but clear explanations." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!aiRes.ok) {
      return Response.json({ error: "AI service unavailable" }, { status: 502 })
    }

    const aiData = await aiRes.json()
    const explanation = aiData.choices?.[0]?.message?.content || "Unable to generate explanation."

    return Response.json({ explanation, source: "ai" })
  } catch (error) {
    console.error("AI explain error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
