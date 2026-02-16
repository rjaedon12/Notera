import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateTagsSchema = z.object({
  tagIds: z.array(z.string())
})

// GET /api/sets/[setId]/tags - Get tags for a set
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params

    const setTags = await prisma.setTag.findMany({
      where: { setId },
      include: { tag: true }
    })

    return NextResponse.json(setTags.map((st: { tag: unknown }) => st.tag))
  } catch (error) {
    console.error("Get set tags error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/sets/[setId]/tags - Update tags for a set
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ setId: string }> }
) {
  try {
    const { setId } = await params
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check ownership
    const set = await prisma.studySet.findUnique({
      where: { id: setId }
    })

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 })
    }

    if (set.ownerId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateTagsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { tagIds } = parsed.data

    // Delete existing tags
    await prisma.setTag.deleteMany({
      where: { setId }
    })

    // Add new tags
    if (tagIds.length > 0) {
      await prisma.setTag.createMany({
        data: tagIds.map(tagId => ({ setId, tagId }))
      })
    }

    // Return updated tags
    const updatedTags = await prisma.setTag.findMany({
      where: { setId },
      include: { tag: true }
    })

    return NextResponse.json(updatedTags.map((st: { tag: unknown }) => st.tag))
  } catch (error) {
    console.error("Update set tags error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
