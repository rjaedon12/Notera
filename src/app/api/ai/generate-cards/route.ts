import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"

// POST /api/ai/generate-cards — generate flashcards from text using AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Fallback: generate simple cards from text without AI
      const { text, count = 10 } = await request.json()
      if (!text?.trim()) {
        return Response.json({ error: "Text is required" }, { status: 400 })
      }

      // Simple NLP-free extraction: split by sentences/paragraphs and create term/definition pairs
      const sentences = text
        .split(/[.!?]\s+|\n\n/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 10)

      const cards = sentences.slice(0, count).map((sentence: string, i: number) => {
        // Try to split on colon, dash, or "is/are/was/were" patterns
        const colonMatch = sentence.match(/^(.+?):\s*(.+)$/)
        const dashMatch = sentence.match(/^(.+?)\s*[-–—]\s*(.+)$/)
        const isMatch = sentence.match(/^(.+?)\s+(?:is|are|was|were|means)\s+(.+)$/i)

        if (colonMatch) return { term: colonMatch[1].trim(), definition: colonMatch[2].trim() }
        if (dashMatch) return { term: dashMatch[1].trim(), definition: dashMatch[2].trim() }
        if (isMatch) return { term: isMatch[1].trim(), definition: isMatch[2].trim() }

        // Fallback: first few words as term, rest as definition
        const words = sentence.split(" ")
        const termWords = words.slice(0, Math.min(4, Math.floor(words.length / 3)))
        const defWords = words.slice(termWords.length)
        return {
          term: termWords.join(" "),
          definition: defWords.join(" "),
        }
      })

      return Response.json({ cards, source: "local" })
    }

    // AI-powered card generation using OpenAI
    const { text, count = 10, subject } = await request.json()
    if (!text?.trim()) {
      return Response.json({ error: "Text is required" }, { status: 400 })
    }

    const prompt = `Generate ${count} flashcards from the following text${subject ? ` about ${subject}` : ""}. 
Return a JSON array where each object has "term" and "definition" fields.
Make the terms concise (key concepts, names, dates) and definitions clear and educational.
Only return the JSON array, no other text.

Text:
${text.slice(0, 8000)}`

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a study assistant that generates high-quality flashcards. Always respond with valid JSON arrays." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!aiRes.ok) {
      return Response.json({ error: "AI service unavailable" }, { status: 502 })
    }

    const aiData = await aiRes.json()
    const content = aiData.choices?.[0]?.message?.content || "[]"
    
    // Parse the AI response
    let cards
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      cards = jsonMatch ? JSON.parse(jsonMatch[0]) : []
    } catch {
      cards = []
    }

    return Response.json({ cards, source: "ai" })
  } catch (error) {
    console.error("AI generate error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
