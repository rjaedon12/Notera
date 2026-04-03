import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyAdminAuth } from "@/lib/admin-auth"

// IDs of the seeded AP History DBQ prompts that should be removed
const PREMADE_PROMPT_IDS = [
  "dbq-qing-dynasty-collapse",
  "dbq-industrial-revolution",
  "dbq-imperialism-africa",
  "dbq-mongol-empire",
  "dbq-us-imperialism",
  "dbq-french-revolution",
]

/**
 * DELETE /api/dbq/cleanup-premade
 * 
 * Removes all pre-seeded AP History DBQ prompts from the database.
 * This is a one-time cleanup operation.
 */
// NOTE: Rate limiting — this mutation endpoint is unprotected
export async function DELETE() {
  try {
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // First, delete associated documents (due to foreign key constraints)
    const deletedDocs = await prisma.dBQDocument.deleteMany({
      where: {
        promptId: { in: PREMADE_PROMPT_IDS },
      },
    })

    // Then delete associated essays
    const deletedEssays = await prisma.dBQEssay.deleteMany({
      where: {
        promptId: { in: PREMADE_PROMPT_IDS },
      },
    })

    // Finally, delete the prompts themselves
    const deletedPrompts = await prisma.dBQPrompt.deleteMany({
      where: {
        id: { in: PREMADE_PROMPT_IDS },
      },
    })

    return NextResponse.json({
      success: true,
      deleted: {
        prompts: deletedPrompts.count,
        documents: deletedDocs.count,
        essays: deletedEssays.count,
      },
    })
  } catch (error) {
    console.error("Failed to cleanup premade DBQ prompts:", error)
    return NextResponse.json(
      { error: "Failed to cleanup premade prompts" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/dbq/cleanup-premade
 * 
 * Check how many premade prompts still exist (for verification).
 */
export async function GET() {
  try {
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const count = await prisma.dBQPrompt.count({
      where: {
        id: { in: PREMADE_PROMPT_IDS },
      },
    })

    return NextResponse.json({
      premadePromptsRemaining: count,
      ids: PREMADE_PROMPT_IDS,
    })
  } catch (error) {
    console.error("Failed to check premade DBQ prompts:", error)
    return NextResponse.json(
      { error: "Failed to check premade prompts" },
      { status: 500 }
    )
  }
}
