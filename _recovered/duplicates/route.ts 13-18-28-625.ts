import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/tags/[slug] - Get tag by slug with sets
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const tag = await prisma.tag.findUnique({
      where: { slug },
      include: {
        sets: {
          include: {
            studySet: {
              include: {
                owner: { select: { id: true, name: true } },
                _count: { select: { cards: true } },
                tags: { include: { tag: true } }
              }
            }
          }
        },
        resources: {
          include: {
            resource: {
              include: {
                owner: { select: { id: true, name: true } },
                tags: { include: { tag: true } }
              }
            }
          },
          where: {
            resource: { visibility: "PUBLIC" }
          }
        }
      }
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // Filter to only public sets
    const publicSets = tag.sets
      .filter((st: { studySet: { isPublic: boolean } }) => st.studySet.isPublic)
      .map((st: { studySet: { tags: { tag: unknown }[] } & Record<string, unknown> }) => ({
        ...st.studySet,
        tags: st.studySet.tags.map((t: { tag: unknown }) => t.tag)
      }))

    const publicResources = tag.resources.map((rt: { resource: { tags: { tag: unknown }[] } & Record<string, unknown> }) => ({
      ...rt.resource,
      tags: rt.resource.tags.map((t: { tag: unknown }) => t.tag)
    }))

    return NextResponse.json({
      ...tag,
      sets: publicSets,
      resources: publicResources
    })
  } catch (error) {
    console.error("Get tag error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/[slug] - Delete a tag (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // Import auth dynamically to avoid circular deps
    const { auth } = await import("@/lib/auth")
    const session = await auth()
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { slug } = await params

    // Check if this is an ID or slug
    const tag = await prisma.tag.findFirst({
      where: {
        OR: [
          { id: slug },
          { slug: slug }
        ]
      }
    })

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 })
    }

    // Delete the tag (cascades to SetTag and ResourceTag)
    await prisma.tag.delete({
      where: { id: tag.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete tag error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
