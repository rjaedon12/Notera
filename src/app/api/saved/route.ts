import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/saved — list sets the user has saved
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json([])
    }
    const saved = await prisma.savedSet.findMany({
      where: { userId: session.user.id },
      include: {
        set: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            _count: { select: { cards: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    // Return sets with owner alias for UI compatibility
    return Response.json(saved.map((s) => ({
      ...s.set,
      owner: s.set.user,
    })))
  } catch (error) {
    console.error("Saved sets error:", error)
    return Response.json([], { status: 500 })
  }
}
