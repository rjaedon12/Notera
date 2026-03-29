import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/categories/[slug] — get category with content counts
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          include: {
            children: { orderBy: { order: "asc" } },
            _count: {
              select: { flashcardSets: true, questionBanks: true, dbqPrompts: true },
            },
          },
          orderBy: { order: "asc" },
        },
        _count: {
          select: { flashcardSets: true, questionBanks: true, dbqPrompts: true },
        },
      },
    })

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 })
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error("Failed to fetch category:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
