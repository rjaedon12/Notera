import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const DISCOVER_SET_INCLUDE = {
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
} satisfies Prisma.FlashcardSetInclude

type DiscoverSet = Prisma.FlashcardSetGetPayload<{
  include: typeof DISCOVER_SET_INCLUDE
}>

type StudySignal = Prisma.StudyProgressGetPayload<{
  include: {
    set: {
      include: typeof DISCOVER_SET_INCLUDE
    }
  }
}>

function getEngagementScore(set: DiscoverSet) {
  return set._count.starredBy + set._count.savedBy + set._count.ratings
}

function getCategorySignalWeight(lastStudied: Date) {
  const ageInDays = (Date.now() - lastStudied.getTime()) / (1000 * 60 * 60 * 24)

  if (ageInDays <= 7) return 2
  if (ageInDays <= 30) return 1.5
  return 1
}

function blendRecommendations(primary: DiscoverSet[], secondary: DiscoverSet[], limit: number) {
  const blended: DiscoverSet[] = []
  const seen = new Set<string>()
  let primaryIndex = 0
  let secondaryIndex = 0

  while (
    blended.length < limit &&
    (primaryIndex < primary.length || secondaryIndex < secondary.length)
  ) {
    if (primaryIndex < primary.length) {
      const candidate = primary[primaryIndex++]
      if (!seen.has(candidate.id)) {
        seen.add(candidate.id)
        blended.push(candidate)
      }
    }

    if (blended.length >= limit) break

    if (secondaryIndex < secondary.length) {
      const candidate = secondary[secondaryIndex++]
      if (!seen.has(candidate.id)) {
        seen.add(candidate.id)
        blended.push(candidate)
      }
    }
  }

  return blended
}

async function buildForYouRecommendations(userId: string): Promise<DiscoverSet[] | null> {
  const studySignals: StudySignal[] = await prisma.studyProgress.findMany({
    where: { userId },
    include: {
      set: {
        include: DISCOVER_SET_INCLUDE,
      },
    },
    orderBy: { lastStudied: "desc" },
    take: 120,
  })

  if (studySignals.length === 0) {
    return null
  }

  const recurringSetSignals = new Map<
    string,
    {
      set: DiscoverSet
      frequency: number
      lastStudiedMs: number
    }
  >()
  const categorySignals = new Map<string, number>()

  for (const signal of studySignals) {
    const existing = recurringSetSignals.get(signal.setId)
    const lastStudiedMs = signal.lastStudied.getTime()

    recurringSetSignals.set(signal.setId, {
      set: signal.set,
      frequency: (existing?.frequency ?? 0) + 1,
      lastStudiedMs: Math.max(existing?.lastStudiedMs ?? 0, lastStudiedMs),
    })

    if (signal.set.categoryId) {
      categorySignals.set(
        signal.set.categoryId,
        (categorySignals.get(signal.set.categoryId) ?? 0) + getCategorySignalWeight(signal.lastStudied)
      )
    }
  }

  const recurringSets = Array.from(recurringSetSignals.values())
    .sort((left, right) => {
      if (right.frequency !== left.frequency) {
        return right.frequency - left.frequency
      }

      if (right.lastStudiedMs !== left.lastStudiedMs) {
        return right.lastStudiedMs - left.lastStudiedMs
      }

      return getEngagementScore(right.set) - getEngagementScore(left.set)
    })
    .map((entry) => entry.set)
    .slice(0, 4)

  const rankedCategories = Array.from(categorySignals.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)

  const relatedTopicCandidates = rankedCategories.length
    ? await prisma.flashcardSet.findMany({
        where: {
          isPublic: true,
          userId: { not: userId },
          categoryId: { in: rankedCategories.map(([categoryId]) => categoryId) },
          id: { notIn: recurringSets.map((set) => set.id) },
        },
        include: DISCOVER_SET_INCLUDE,
        take: 24,
      })
    : []

  const categoryWeightById = new Map(rankedCategories)

  const relatedTopicSets = relatedTopicCandidates
    .sort((left, right) => {
      const rightCategoryWeight = right.categoryId ? (categoryWeightById.get(right.categoryId) ?? 0) : 0
      const leftCategoryWeight = left.categoryId ? (categoryWeightById.get(left.categoryId) ?? 0) : 0

      if (rightCategoryWeight !== leftCategoryWeight) {
        return rightCategoryWeight - leftCategoryWeight
      }

      const engagementDiff = getEngagementScore(right) - getEngagementScore(left)
      if (engagementDiff !== 0) {
        return engagementDiff
      }

      return right.createdAt.getTime() - left.createdAt.getTime()
    })
    .slice(0, 8)

  const blended = blendRecommendations(recurringSets, relatedTopicSets, 8)
  return blended.length > 0 ? blended : null
}

// GET /api/sets/discover — aggregated sections for discover page
export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Run queries in parallel for performance
    const [featured, recent, trending, forYouRaw] = await Promise.all([
      // Featured: admin-curated sets
      prisma.flashcardSet.findMany({
        where: { isPublic: true, isFeatured: true },
        include: DISCOVER_SET_INCLUDE,
        orderBy: { createdAt: "desc" },
        take: 6,
      }),

      // Recent: newest public sets
      prisma.flashcardSet.findMany({
        where: { isPublic: true },
        include: DISCOVER_SET_INCLUDE,
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
        include: DISCOVER_SET_INCLUDE,
        take: 20, // fetch more to sort client-side by engagement
      }),

      // For You: blend each user's recurring sets with related-topic recommendations.
      userId ? buildForYouRecommendations(userId) : Promise.resolve(null),
    ])

    // Sort trending by total recent engagement count
    const trendingSorted = [...trending]
      .sort((a, b) => getEngagementScore(b) - getEngagementScore(a))
      .slice(0, 8)

    // For You fallback: if unauthenticated or no study history, use popular sets
    let forYou = forYouRaw
    if (!forYou || forYou.length === 0) {
      forYou = await prisma.flashcardSet.findMany({
        where: { isPublic: true },
        include: DISCOVER_SET_INCLUDE,
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
