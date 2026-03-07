import { NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

// POST /api/sets/[setId]/share — generate a share link
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { setId } = await params

    // Ensure the set exists and make it public for sharing
    const set = await prisma.flashcardSet.findUnique({ where: { id: setId } })
    if (!set) {
      return Response.json({ error: "Set not found" }, { status: 404 })
    }

    // Build the share URL
    const headerList = await headers()
    const host = headerList.get("host") || "localhost:3000"
    const protocol = host.includes("localhost") ? "http" : "https"
    const url = `${protocol}://${host}/sets/${setId}`

    return Response.json({ url, setId })
  } catch (error) {
    console.error("Share set error:", error)
    return Response.json({ error: "Internal server error" }, { status: 500 })
  }
}
