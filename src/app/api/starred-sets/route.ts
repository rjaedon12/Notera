import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/starred-sets — list IDs of sets the user has starred
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json([])
    }
    const starred = await prisma.starredSet.findMany({
      where: { userId: session.user.id },
      select: { setId: true },
    })
    return Response.json(starred.map((s) => s.setId))
  } catch (error) {
    console.error("Starred sets error:", error)
    return Response.json([], { status: 500 })
  }
}
