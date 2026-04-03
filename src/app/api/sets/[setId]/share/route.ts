import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { buildRateLimitKey, createRateLimitResponse, takeRateLimit } from "@/lib/rate-limit"

// POST /api/sets/[setId]/share — generate a share link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { setId } = await params

    // Ensure the set exists and the user owns it or it's public
    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })
    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }
    if (set.userId !== session.user.id && !set.isPublic) {
      return Response.json({ error: "Forbidden" }, { status: 403 })
    }

    const rateLimit = takeRateLimit(buildRateLimitKey("sets-share", request, session.user.id), {
      limit: 30,
      windowMs: 60 * 1000,
    })
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit, "Too many share link requests. Please try again later.")
    }

    // Build the share URL
    const headerList = await headers()
    const host = headerList.get("host") || "localhost:3000" // dev-only fallback
    const protocol = host.includes("localhost") ? "http" : "https"
    const url = `${protocol}://${host}/sets/${setId}`

    return Response.json({ url, setId })
  } catch (error) {
    console.error("Share set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
