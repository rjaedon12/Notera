"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { WhiteboardElement, BackgroundType, BoardMeta } from "./types"

// ─── Helpers ─────────────────────────────────────────────

async function requireUser() {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  return session.user
}

// ─── Board CRUD ──────────────────────────────────────────

export async function getBoards(): Promise<BoardMeta[]> {
  const user = await requireUser()

  const boards = await prisma.whiteboardBoard.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { members: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: { select: { name: true } },
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return boards.map((b) => ({
    id: b.id,
    title: b.title,
    thumbnail: b.thumbnail,
    background: b.background as BackgroundType,
    bgColor: b.bgColor,
    isPublic: b.isPublic,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
    ownerId: b.ownerId,
    ownerName: b.owner.name,
    memberCount: b._count.members,
  }))
}

export async function createBoard(title?: string): Promise<string> {
  const user = await requireUser()

  const board = await prisma.whiteboardBoard.create({
    data: {
      title: title || "Untitled Board",
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  })

  return board.id
}

export async function getBoard(boardId: string) {
  const user = await requireUser()

  const board = await prisma.whiteboardBoard.findUnique({
    where: { id: boardId },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  })

  if (!board) throw new Error("Board not found")

  // Check access
  const isMember = board.members.some((m) => m.userId === user.id)
  const isOwner = board.ownerId === user.id
  if (!isOwner && !isMember && !board.isPublic) {
    throw new Error("Access denied")
  }

  return {
    id: board.id,
    title: board.title,
    elements: board.elements as unknown as WhiteboardElement[],
    background: board.background as BackgroundType,
    bgColor: board.bgColor,
    isPublic: board.isPublic,
    ownerId: board.ownerId,
    owner: board.owner,
    members: board.members.map((m) => ({
      userId: m.userId,
      role: m.role,
      name: m.user.name,
      image: m.user.image,
    })),
  }
}

export async function updateBoard(
  boardId: string,
  data: {
    title?: string
    elements?: WhiteboardElement[]
    thumbnail?: string
    background?: BackgroundType
    bgColor?: string
    isPublic?: boolean
  }
) {
  const user = await requireUser()

  // Verify write access
  const board = await prisma.whiteboardBoard.findUnique({
    where: { id: boardId },
    include: { members: { where: { userId: user.id } } },
  })

  if (!board) throw new Error("Board not found")
  const member = board.members[0]
  if (board.ownerId !== user.id && (!member || member.role === "VIEWER")) {
    throw new Error("Permission denied")
  }

  await prisma.whiteboardBoard.update({
    where: { id: boardId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.elements !== undefined && { elements: data.elements as unknown as import("@prisma/client").Prisma.InputJsonValue }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
      ...(data.background !== undefined && { background: data.background }),
      ...(data.bgColor !== undefined && { bgColor: data.bgColor }),
      ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
    },
  })
}

export async function deleteBoard(boardId: string) {
  const user = await requireUser()

  const board = await prisma.whiteboardBoard.findUnique({ where: { id: boardId } })
  if (!board || board.ownerId !== user.id) throw new Error("Permission denied")

  await prisma.whiteboardBoard.delete({ where: { id: boardId } })
}

export async function duplicateBoard(boardId: string): Promise<string> {
  const user = await requireUser()

  const source = await prisma.whiteboardBoard.findUnique({ where: { id: boardId } })
  if (!source) throw new Error("Board not found")

  const newBoard = await prisma.whiteboardBoard.create({
    data: {
      title: `${source.title} (Copy)`,
      elements: source.elements as unknown as import("@prisma/client").Prisma.InputJsonValue,
      background: source.background,
      bgColor: source.bgColor,
      thumbnail: source.thumbnail,
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  })

  return newBoard.id
}

// ─── Share Links ─────────────────────────────────────────

export async function createShareLink(
  boardId: string,
  permission: "EDITOR" | "VIEWER" = "VIEWER"
) {
  const user = await requireUser()

  const board = await prisma.whiteboardBoard.findUnique({ where: { id: boardId } })
  if (!board || board.ownerId !== user.id) throw new Error("Permission denied")

  const link = await prisma.whiteboardShareLink.create({
    data: { boardId, permission },
  })

  return link.token
}

export async function joinBoardViaShareLink(token: string) {
  const user = await requireUser()

  const link = await prisma.whiteboardShareLink.findUnique({
    where: { token },
    include: { board: true },
  })

  if (!link) throw new Error("Invalid share link")
  if (link.expiresAt && link.expiresAt < new Date()) throw new Error("Share link expired")

  // Check if already a member
  const existing = await prisma.whiteboardMember.findUnique({
    where: { boardId_userId: { boardId: link.boardId, userId: user.id } },
  })

  if (!existing) {
    await prisma.whiteboardMember.create({
      data: {
        boardId: link.boardId,
        userId: user.id,
        role: link.permission,
      },
    })
  }

  return link.boardId
}

export async function removeShareLink(token: string) {
  const user = await requireUser()

  const link = await prisma.whiteboardShareLink.findUnique({
    where: { token },
    include: { board: true },
  })

  if (!link || link.board.ownerId !== user.id) throw new Error("Permission denied")

  await prisma.whiteboardShareLink.delete({ where: { id: link.id } })
}

export async function getBoardShareLinks(boardId: string) {
  const user = await requireUser()

  const board = await prisma.whiteboardBoard.findUnique({ where: { id: boardId } })
  if (!board || board.ownerId !== user.id) throw new Error("Permission denied")

  return prisma.whiteboardShareLink.findMany({
    where: { boardId },
    orderBy: { createdAt: "desc" },
  })
}
