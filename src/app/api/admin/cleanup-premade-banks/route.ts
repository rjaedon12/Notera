import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { verifyAdminAuth } from "@/lib/admin-auth"

/**
 * DELETE /api/admin/cleanup-premade-banks
 * 
 * Removes all premade AP quiz banks from the database.
 * These were originally seeded but should no longer be available.
 * 
 * Targets banks that:
 * - Have isPremade = true, OR
 * - Have subjects containing "AP World History", "AP US History", "AP Government"
 */
// NOTE: Rate limiting — this mutation endpoint is unprotected
export async function DELETE() {
  try {
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Find all premade AP-related question banks
    const premadeBanks = await prisma.questionBank.findMany({
      where: {
        OR: [
          { isPremade: true },
          { subject: { contains: "AP World History" } },
          { subject: { contains: "AP US History" } },
          { subject: { contains: "AP Government" } },
          { title: { contains: "AP World History" } },
          { title: { contains: "AP US History" } },
          { title: { contains: "AP US Government" } },
        ],
        // Only delete banks not owned by the current user
        NOT: { userId: session.user.id },
      },
      select: { id: true, title: true, subject: true },
    })

    if (premadeBanks.length === 0) {
      return NextResponse.json({
        message: "No premade AP banks found to delete",
        deletedCount: 0,
      })
    }

    // Delete in order: answers -> attempts -> choices -> questions -> banks
    for (const bank of premadeBanks) {
      // Delete all answers for attempts on this bank
      await prisma.attemptAnswer.deleteMany({
        where: { attempt: { bankId: bank.id } },
      })

      // Delete all attempts
      await prisma.quizAttempt.deleteMany({
        where: { bankId: bank.id },
      })

      // Delete all choices for questions in this bank
      await prisma.choice.deleteMany({
        where: { question: { bankId: bank.id } },
      })

      // Delete all questions
      await prisma.question.deleteMany({
        where: { bankId: bank.id },
      })

      // Delete the bank itself
      await prisma.questionBank.delete({
        where: { id: bank.id },
      })
    }

    return NextResponse.json({
      message: `Successfully deleted ${premadeBanks.length} premade AP question bank(s)`,
      deletedCount: premadeBanks.length,
      deletedBanks: premadeBanks.map((b) => ({ title: b.title, subject: b.subject })),
    })
  } catch (error) {
    console.error("Cleanup premade banks error:", error)
    return NextResponse.json(
      { error: "Failed to delete premade banks" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/cleanup-premade-banks
 * 
 * Preview which banks will be deleted without actually deleting them.
 */
export async function GET() {
  try {
    const isAdmin = await verifyAdminAuth()
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const premadeBanks = await prisma.questionBank.findMany({
      where: {
        OR: [
          { isPremade: true },
          { subject: { contains: "AP World History" } },
          { subject: { contains: "AP US History" } },
          { subject: { contains: "AP Government" } },
          { title: { contains: "AP World History" } },
          { title: { contains: "AP US History" } },
          { title: { contains: "AP US Government" } },
        ],
        NOT: { userId: session.user.id },
      },
      select: {
        id: true,
        title: true,
        subject: true,
        _count: { select: { questions: true, attempts: true } },
      },
    })

    return NextResponse.json({
      message: `Found ${premadeBanks.length} premade AP bank(s) that would be deleted`,
      banks: premadeBanks,
    })
  } catch (error) {
    console.error("Preview premade banks error:", error)
    return NextResponse.json(
      { error: "Failed to preview premade banks" },
      { status: 500 }
    )
  }
}
