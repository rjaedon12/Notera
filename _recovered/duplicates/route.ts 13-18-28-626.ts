import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const tagSchema = z.object({
  name: z.string().min(1).max(50),
  category: z.string().optional(),
})

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// GET /api/tags - Get all tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}
    
    if (category) {
      where.category = category
    }
    
    if (search) {
      where.name = { contains: search }
    }

    const tags = await prisma.tag.findMany({
      where,
      include: {
        _count: { select: { sets: true, resources: true } }
      },
      orderBy: { name: "asc" }
    })

    return NextResponse.json(tags)
  } catch (error) {
    console.error("Get tags error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/tags - Create a new tag (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only admins can create tags
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = tagSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { name, category } = parsed.data
    const slug = slugify(name)

    // Check if tag already exists
    const existing = await prisma.tag.findFirst({
      where: { OR: [{ name }, { slug }] }
    })

    if (existing) {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      )
    }

    const tag = await prisma.tag.create({
      data: { name, slug, category }
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("Create tag error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
