import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// GET /api/sets/discover — aggregated sections for discover page
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const setInclude = {
      _count: { select: { cards: true, starredBy: true, savedBy: true, ratings: true } },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
          parent: { select: { id: true, name: true, slug: true } },
        },
      },
    } as const

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Run queries in parallel for performance
    const [featured, recent, trending, forYouRaw] = await Promise.all([
      // Featured: admin-curated sets
      prisma.flashcardSet.findMany({
        where: { isPublic: true, isFeatured: true },
        include: setInclude,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),

      // Recent: newest public sets
      prisma.flashcardSet.findMany({
        where: { isPublic: true },
        include: setInclude,
        orderBy: { createdAt: "desc" },
        take: 8,
      }),

      // Trending: most engagement in last 30 days
      // Get sets that have recent stars/saves/ratings, then sort by total engagement
      prisma.flashcardSet.findMany({
        where: {
          isPublic: true,
          OR: [
            { starredBy: { some: { createdAt: { gte: thirtyDaysAgo } } } },
            { savedBy: { some: { createdAt: { gte: thirtyDaysAgo } } } },
            { ratings: { some: { createdAt: { gte: thirtyDaysAgo } } } },
          ],
        },
        include: setInclude,
        take: 20, // fetch more to sort client-side by engagement
      }),

      // For You: sets in categories the user has studied (if authenticated)
      userId
        ? prisma.studyProgress
            .findMany({
              where: { userId },
              select: { set: { select: { categoryId: true } } },
              orderBy: { lastStudied: "desc" },
              take: 50,
            })
            .then((progress) => {
              const categoryIds = [
                ...new Set(
                  progress
                    .map((p) => p.set.categoryId)
                    .filter((id): id is string => id !== null)
                ),
              ]
              if (categoryIds.length === 0) return null // no studied categories
              return prisma.flashcardSet.findMany({
                where: {
                  isPublic: true,
                  categoryId: { in: categoryIds },
                  userId: { not: userId }, // exclude own sets
                },
                include: setInclude,
                orderBy: { createdAt: "desc" },
                take: 8,
              })
            })
        : Promise.resolve(null),
    ])

    // Sort trending by total recent engagement count
    const trendingSorted = trending
      .map((set) => ({
        ...set,
        _engagementScore:
          set._count.starredBy + set._count.savedBy + set._count.ratings,
      }))
      .sort((a, b) => b._engagementScore - a._engagementScore)
      .slice(0, 8)
      .map(({ _engagementScore: _, ...set }) => set)

    // For You fallback: if unauthenticated or no study history, use popular sets
    let forYou = forYouRaw
    if (!forYou || forYou.length === 0) {
      forYou = await prisma.flashcardSet.findMany({
        where: { isPublic: true },
        include: setInclude,
        orderBy: { starredBy: { _count: "desc" } },
        take: 8,
      })
    }

    return NextResponse.json({
      featured,
      trending: trendingSorted,
      forYou,
      recent,
    })
  } catch (error) {
    console.error("Discover API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
