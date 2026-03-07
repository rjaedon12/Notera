import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/starred — list starred cards for the user
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json([])
    }
    const starred = await prisma.starredCard.findMany({
      where: { userId: session.user.id },
      include: {
        flashcard: {
          include: { set: { select: { id: true, title: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return Response.json(starred.map((s) => ({
      ...s.flashcard,
      isStarred: true,
    })))
  } catch (error) {
    console.error("Starred cards error:", error)
    return Response.json([], { status: 500 })
  }
}
