// ============================================================================
// WHITEBOARD STORAGE & AUTH
// ============================================================================

import type { WBUser, WBBoard, WBStore, Announcement } from "./types"

const STORE_KEY = "wb_store_v3"
const AUTOSAVE_KEY = "wb_autosave_ts"

// Admin credentials - in production, use env vars
const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "QuizAdmin2026!"

// ---- Simple hash (not cryptographically secure - for localStorage demo) ----
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return btoa(String(hash) + "|" + str.split("").reverse().join(""))
}

function verifyHash(str: string, hash: string): boolean {
  return simpleHash(str) === hash
}

// ---- Store helpers ----
function getDefaultStore(): WBStore {
  return {
    users: {},
    boards: {},
    currentUserId: null,
    announcement: { text: "", color: "#3b82f6", enabled: false },
  }
}

export function loadStore(): WBStore {
  if (typeof window === "undefined") return getDefaultStore()
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        users: parsed.users || {},
        boards: parsed.boards || {},
        currentUserId: parsed.currentUserId || null,
        announcement: parsed.announcement || { text: "", color: "#3b82f6", enabled: false },
      }
    }
  } catch { /* ignore */ }
  return getDefaultStore()
}

export function saveStore(store: WBStore): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch { /* ignore */ }
}

export function setAutosaveTimestamp(): void {
  if (typeof window === "undefined") return
  localStorage.setItem(AUTOSAVE_KEY, new Date().toISOString())
}

export function getAutosaveTimestamp(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTOSAVE_KEY)
}

// ---- Auth ----
export function signUp(username: string, password: string, email?: string): { success: boolean; error?: string; user?: WBUser } {
  const store = loadStore()

  if (!username || username.length < 2) {
    return { success: false, error: "Username must be at least 2 characters" }
  }
  if (!password || password.length < 4) {
    return { success: false, error: "Password must be at least 4 characters" }
  }

  // Check if username exists
  const existing = Object.values(store.users).find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  )
  if (existing) {
    return { success: false, error: "Username already taken" }
  }

  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const user: WBUser = {
    id,
    username,
    passwordHash: simpleHash(password),
    email: email || "",
    joinDate: now,
    lastActive: now,
    banned: false,
    isAdmin: false,
  }

  store.users[id] = user
  store.currentUserId = id
  saveStore(store)

  return { success: true, user }
}

export function logIn(username: string, password: string): { success: boolean; error?: string; user?: WBUser } {
  const store = loadStore()

  // Admin login
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Create or find admin user
    let adminUser = Object.values(store.users).find((u) => u.isAdmin)
    if (!adminUser) {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      adminUser = {
        id,
        username: "admin",
        passwordHash: simpleHash(password),
        email: "admin@whiteboard.local",
        joinDate: now,
        lastActive: now,
        banned: false,
        isAdmin: true,
      }
      store.users[id] = adminUser
    }
    adminUser.lastActive = new Date().toISOString()
    store.currentUserId = adminUser.id
    saveStore(store)
    return { success: true, user: adminUser }
  }

  const user = Object.values(store.users).find(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  )
  if (!user) {
    return { success: false, error: "Invalid username or password" }
  }
  if (!verifyHash(password, user.passwordHash)) {
    return { success: false, error: "Invalid username or password" }
  }
  if (user.banned) {
    return { success: false, error: "Your account has been suspended" }
  }

  user.lastActive = new Date().toISOString()
  store.currentUserId = user.id
  saveStore(store)
  return { success: true, user }
}

export function logOut(): void {
  const store = loadStore()
  store.currentUserId = null
  saveStore(store)
}

export function getCurrentUser(): WBUser | null {
  const store = loadStore()
  if (!store.currentUserId) return null
  return store.users[store.currentUserId] || null
}

// ---- Board CRUD ----
export function createBoard(ownerId: string, title: string): WBBoard {
  const store = loadStore()
  const id = crypto.randomUUID()
  const frameId = crypto.randomUUID()
  const now = new Date().toISOString()
  const board: WBBoard = {
    id,
    ownerId,
    title: title || "Untitled Board",
    isPublic: false,
    flagged: false,
    frames: [{ id: frameId, name: "Frame 1", viewportTransform: [1, 0, 0, 1, 0, 0], canvasJSON: "" }],
    activeFrameId: frameId,
    background: "grid",
    customBgColor: "#ffffff",
    createdAt: now,
    updatedAt: now,
    canvasJSON: "",
  }
  store.boards[id] = board
  saveStore(store)
  return board
}

export function saveBoard(board: WBBoard): void {
  const store = loadStore()
  board.updatedAt = new Date().toISOString()
  store.boards[board.id] = board
  saveStore(store)
}

export function deleteBoard(boardId: string): void {
  const store = loadStore()
  delete store.boards[boardId]
  saveStore(store)
}

export function getUserBoards(userId: string): WBBoard[] {
  const store = loadStore()
  return Object.values(store.boards)
    .filter((b) => b.ownerId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getPublicBoards(): WBBoard[] {
  const store = loadStore()
  return Object.values(store.boards)
    .filter((b) => b.isPublic)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getBoardById(boardId: string): WBBoard | null {
  const store = loadStore()
  return store.boards[boardId] || null
}

// ---- Admin functions ----
export function getAllUsers(): WBUser[] {
  const store = loadStore()
  return Object.values(store.users).sort((a, b) =>
    new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime()
  )
}

export function getAllBoards(): WBBoard[] {
  const store = loadStore()
  return Object.values(store.boards).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
}

export function updateUsername(userId: string, newUsername: string): boolean {
  const store = loadStore()
  const user = store.users[userId]
  if (!user) return false
  const conflict = Object.values(store.users).find(
    (u) => u.id !== userId && u.username.toLowerCase() === newUsername.toLowerCase()
  )
  if (conflict) return false
  user.username = newUsername
  saveStore(store)
  return true
}

export function resetPassword(userId: string, newPassword: string): boolean {
  const store = loadStore()
  const user = store.users[userId]
  if (!user) return false
  user.passwordHash = simpleHash(newPassword)
  saveStore(store)
  return true
}

export function banUser(userId: string): boolean {
  const store = loadStore()
  const user = store.users[userId]
  if (!user || user.isAdmin) return false
  user.banned = true
  saveStore(store)
  return true
}

export function unbanUser(userId: string): boolean {
  const store = loadStore()
  const user = store.users[userId]
  if (!user) return false
  user.banned = false
  saveStore(store)
  return true
}

export function deleteUser(userId: string): boolean {
  const store = loadStore()
  const user = store.users[userId]
  if (!user || user.isAdmin) return false
  // Delete all their boards
  for (const boardId of Object.keys(store.boards)) {
    if (store.boards[boardId].ownerId === userId) {
      delete store.boards[boardId]
    }
  }
  delete store.users[userId]
  saveStore(store)
  return true
}

export function flagBoard(boardId: string, flagged: boolean): void {
  const store = loadStore()
  const board = store.boards[boardId]
  if (board) {
    board.flagged = flagged
    saveStore(store)
  }
}

export function makeBoardPrivate(boardId: string): void {
  const store = loadStore()
  const board = store.boards[boardId]
  if (board) {
    board.isPublic = false
    saveStore(store)
  }
}

export function getAnnouncement(): Announcement {
  const store = loadStore()
  return store.announcement
}

export function setAnnouncement(announcement: Announcement): void {
  const store = loadStore()
  store.announcement = announcement
  saveStore(store)
}

export function getStats(): { totalUsers: number; totalBoards: number; publicBoards: number; bannedUsers: number } {
  const store = loadStore()
  const users = Object.values(store.users)
  const boards = Object.values(store.boards)
  return {
    totalUsers: users.length,
    totalBoards: boards.length,
    publicBoards: boards.filter((b) => b.isPublic).length,
    bannedUsers: users.filter((u) => u.banned).length,
  }
}
