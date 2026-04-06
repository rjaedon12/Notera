import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/spaces/[spaceId]/units — list hub units
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params

    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      select: { hubSlug: true },
    })

    if (!space?.hubSlug) {
      return NextResponse.json({ error: "Not a hub space" }, { status: 404 })
    }

    const units = await prisma.hubUnit.findMany({
      where: { hubSlug: space.hubSlug },
      orderBy: { orderIndex: "asc" },
    })

    return NextResponse.json(units)
  } catch (error) {
    console.error("Error fetching hub units:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH /api/spaces/[spaceId]/units — update a unit's overview (admin/moderator only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ spaceId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { spaceId } = await params
    const { unitId, overview } = await request.json()

    if (!unitId || typeof overview !== "string") {
      return NextResponse.json({ error: "unitId and overview are required" }, { status: 400 })
    }

    // Check moderator role
    const membership = await prisma.spaceMember.findFirst({
      where: { spaceId, userId: session.user.id, role: { in: ["OWNER", "MODERATOR"] } },
    })
    if (!membership) {
      return NextResponse.json({ error: "Only teachers and admins can edit units" }, { status: 403 })
    }

    const updated = await prisma.hubUnit.update({
      where: { id: unitId },
      data: { overview },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Error updating hub unit:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
