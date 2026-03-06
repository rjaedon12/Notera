"use client"

import React, { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import {
  Shield, Users, LayoutGrid, BarChart3, Megaphone,
  ArrowLeft, Search, Ban, Trash2, KeyRound, Edit2,
  Eye, EyeOff, Globe, GlobeLock, Flag, FlagOff,
  X, Check, RefreshCw,
} from "lucide-react"
import toast from "react-hot-toast"

import type { WBUser, WBBoard, Announcement } from "@/lib/whiteboard/types"
import {
  getAllUsers, getAllBoards, updateUsername, resetPassword,
  banUser, unbanUser, deleteUser, flagBoard, makeBoardPrivate,
  deleteBoard, getAnnouncement, setAnnouncement, getStats,
} from "@/lib/whiteboard/storage"
import { useWBAuth } from "@/components/whiteboard/WBAuthProvider"
import { LoginModal } from "@/components/whiteboard/LoginModal"
import { ConfirmDialog } from "@/components/whiteboard/ConfirmDialog"

// ============================================================================
// Admin Dashboard
// ============================================================================

export default function AdminPage() {
  const { user, isAdmin, login, signup } = useWBAuth()

  if (!user) {
    return <LoginModal onLogin={login} onSignup={signup} />
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-400/30" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          <a href="/whiteboard" className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Whiteboard
          </a>
        </div>
      </div>
    )
  }

  return <AdminDashboard />
}

// ============================================================================
// Admin Dashboard Body
// ============================================================================

type AdminTab = "users" | "boards" | "stats" | "announcements"

function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("users")
  const [refreshKey, setRefreshKey] = useState(0)
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  const tabs: { key: AdminTab; label: string; icon: React.ReactNode }[] = [
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { key: "boards", label: "Boards", icon: <LayoutGrid className="h-4 w-4" /> },
    { key: "stats", label: "Stats", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "announcements", label: "Announce", icon: <Megaphone className="h-4 w-4" /> },
  ]

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 bg-[#14162a] border-r border-white/10 flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-bold text-white">Admin Panel</h2>
          </div>
          <p className="text-xs text-gray-500">Whiteboard Management</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                tab === t.key ? "bg-red-600/20 text-red-400" : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <a href="/whiteboard" className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Whiteboard
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {tab === "users" && <UsersTab key={refreshKey} onRefresh={refresh} />}
        {tab === "boards" && <BoardsTab key={refreshKey} onRefresh={refresh} />}
        {tab === "stats" && <StatsTab key={refreshKey} />}
        {tab === "announcements" && <AnnouncementsTab />}
      </div>
    </div>
  )
}

// ============================================================================
// Users Tab
// ============================================================================

function UsersTab({ onRefresh }: { onRefresh: () => void }) {
  const [users, setUsers] = useState<WBUser[]>([])
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [newUsername, setNewUsername] = useState("")
  const [resetPwUser, setResetPwUser] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [confirmAction, setConfirmAction] = useState<{ open: boolean; title: string; message: string; action: () => void; destructive?: boolean }>({
    open: false, title: "", message: "", action: () => {},
  })

  useEffect(() => {
    setUsers(getAllUsers())
  }, [])

  const filtered = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const handleBan = (userId: string, username: string) => {
    setConfirmAction({
      open: true,
      title: "Ban User",
      message: `Ban "${username}"? They won't be able to log in.`,
      destructive: true,
      action: () => {
        banUser(userId)
        setUsers(getAllUsers())
        toast.success(`${username} banned`)
      },
    })
  }

  const handleUnban = (userId: string, username: string) => {
    unbanUser(userId)
    setUsers(getAllUsers())
    toast.success(`${username} unbanned`)
  }

  const handleDelete = (userId: string, username: string) => {
    setConfirmAction({
      open: true,
      title: "Delete User",
      message: `Permanently delete "${username}" and all their boards? This cannot be undone.`,
      destructive: true,
      action: () => {
        deleteUser(userId)
        setUsers(getAllUsers())
        toast.success(`${username} deleted`)
        onRefresh()
      },
    })
  }

  const handleSaveUsername = (userId: string) => {
    if (newUsername.trim()) {
      const ok = updateUsername(userId, newUsername.trim())
      if (ok) {
        setUsers(getAllUsers())
        toast.success("Username updated")
      } else {
        toast.error("Username taken or invalid")
      }
    }
    setEditingUser(null)
    setNewUsername("")
  }

  const handleResetPassword = (userId: string) => {
    if (newPassword.trim().length >= 4) {
      resetPassword(userId, newPassword.trim())
      setUsers(getAllUsers())
      toast.success("Password reset")
    } else {
      toast.error("Password must be at least 4 characters")
    }
    setResetPwUser(null)
    setNewPassword("")
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">User Management</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Username</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Email</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Joined</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3">
                  {editingUser === u.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        className="px-2 py-1 rounded bg-white/5 border border-white/10 text-foreground text-sm w-32 focus:outline-none"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleSaveUsername(u.id); if (e.key === "Escape") setEditingUser(null) }}
                      />
                      <button onClick={() => handleSaveUsername(u.id)} className="p-1 text-green-400 hover:text-green-300"><Check className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setEditingUser(null)} className="p-1 text-gray-400 hover:text-white"><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-medium">{u.username}</span>
                      {u.isAdmin && <span className="px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 text-[10px] font-bold uppercase">Admin</span>}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{u.email || "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(u.joinDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {u.banned ? (
                    <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 text-xs">Banned</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 text-xs">Active</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {!u.isAdmin && (
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditingUser(u.id); setNewUsername(u.username) }} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" title="Edit username"><Edit2 className="h-3.5 w-3.5" /></button>
                      <button onClick={() => setResetPwUser(u.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" title="Reset password"><KeyRound className="h-3.5 w-3.5" /></button>
                      {u.banned ? (
                        <button onClick={() => handleUnban(u.id, u.username)} className="p-1.5 rounded-lg text-green-400 hover:bg-green-500/10" title="Unban"><Check className="h-3.5 w-3.5" /></button>
                      ) : (
                        <button onClick={() => handleBan(u.id, u.username)} className="p-1.5 rounded-lg text-yellow-400 hover:bg-yellow-500/10" title="Ban"><Ban className="h-3.5 w-3.5" /></button>
                      )}
                      <button onClick={() => handleDelete(u.id, u.username)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Delete user"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reset password dialog */}
      {resetPwUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setResetPwUser(null)}>
          <div className="w-full max-w-sm mx-4 rounded-2xl bg-[#1e2133] border border-white/10 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-white mb-4">Reset Password</h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password..."
              className="w-full px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 mb-4"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleResetPassword(resetPwUser) }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setResetPwUser(null)} className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:bg-white/5">Cancel</button>
              <button onClick={() => handleResetPassword(resetPwUser)} className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700">Reset</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog
        open={confirmAction.open}
        title={confirmAction.title}
        message={confirmAction.message}
        confirmLabel="Confirm"
        destructive={confirmAction.destructive}
        onConfirm={() => { confirmAction.action(); setConfirmAction((c) => ({ ...c, open: false })) }}
        onCancel={() => setConfirmAction((c) => ({ ...c, open: false }))}
      />
    </div>
  )
}

// ============================================================================
// Boards Tab
// ============================================================================

function BoardsTab({ onRefresh }: { onRefresh: () => void }) {
  const [boards, setBoards] = useState<WBBoard[]>([])
  const [users, setUsers] = useState<Record<string, WBUser>>({})
  const [search, setSearch] = useState("")
  const [confirmAction, setConfirmAction] = useState<{ open: boolean; title: string; message: string; action: () => void; destructive?: boolean }>({
    open: false, title: "", message: "", action: () => {},
  })

  useEffect(() => {
    setBoards(getAllBoards())
    const userList = getAllUsers()
    const map: Record<string, WBUser> = {}
    for (const u of userList) map[u.id] = u
    setUsers(map)
  }, [])

  const filtered = boards.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (users[b.ownerId]?.username || "").toLowerCase().includes(search.toLowerCase())
  )

  const handleDeleteBoard = (boardId: string, title: string) => {
    setConfirmAction({
      open: true,
      title: "Delete Board",
      message: `Delete "${title}"? This cannot be undone.`,
      destructive: true,
      action: () => {
        deleteBoard(boardId)
        setBoards(getAllBoards())
        toast.success("Board deleted")
        onRefresh()
      },
    })
  }

  const handleToggleFlag = (boardId: string, currentlyFlagged: boolean) => {
    flagBoard(boardId, !currentlyFlagged)
    setBoards(getAllBoards())
    toast.success(currentlyFlagged ? "Board unflagged" : "Board flagged")
  }

  const handleMakePrivate = (boardId: string) => {
    makeBoardPrivate(boardId)
    setBoards(getAllBoards())
    toast.success("Board set to private")
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Board Moderation</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search boards..."
            className="pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
          />
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Title</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Owner</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Updated</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Visibility</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 text-foreground font-medium">{b.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{users[b.ownerId]?.username || "Unknown"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(b.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {b.isPublic ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 text-xs">
                      <Globe className="h-3 w-3" /> Public
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-600/20 text-gray-400 text-xs">
                      <GlobeLock className="h-3 w-3" /> Private
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {b.flagged ? (
                    <span className="px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-400 text-xs">Flagged</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">OK</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggleFlag(b.id, !!b.flagged)}
                      className={cn("p-1.5 rounded-lg hover:bg-white/5", b.flagged ? "text-yellow-400" : "text-gray-400")}
                      title={b.flagged ? "Unflag" : "Flag"}
                    >
                      {b.flagged ? <FlagOff className="h-3.5 w-3.5" /> : <Flag className="h-3.5 w-3.5" />}
                    </button>
                    {b.isPublic && (
                      <button onClick={() => handleMakePrivate(b.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5" title="Make private">
                        <EyeOff className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDeleteBoard(b.id, b.title)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10" title="Delete board">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No boards found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={confirmAction.open}
        title={confirmAction.title}
        message={confirmAction.message}
        confirmLabel="Confirm"
        destructive={confirmAction.destructive}
        onConfirm={() => { confirmAction.action(); setConfirmAction((c) => ({ ...c, open: false })) }}
        onCancel={() => setConfirmAction((c) => ({ ...c, open: false }))}
      />
    </div>
  )
}

// ============================================================================
// Stats Tab
// ============================================================================

function StatsTab({ key: _key }: { key?: number }) {
  const [stats, setStats] = useState({ totalUsers: 0, totalBoards: 0, publicBoards: 0, bannedUsers: 0 })

  useEffect(() => {
    setStats(getStats())
  }, [])

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, color: "bg-blue-600/20 text-blue-400", icon: <Users className="h-6 w-6" /> },
    { label: "Total Boards", value: stats.totalBoards, color: "bg-purple-600/20 text-purple-400", icon: <LayoutGrid className="h-6 w-6" /> },
    { label: "Public Boards", value: stats.publicBoards, color: "bg-green-600/20 text-green-400", icon: <Globe className="h-6 w-6" /> },
    { label: "Banned Users", value: stats.bannedUsers, color: "bg-red-600/20 text-red-400", icon: <Ban className="h-6 w-6" /> },
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Dashboard Stats</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-6">
            <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4", s.color)}>
              {s.icon}
            </div>
            <p className="text-3xl font-bold text-foreground tabular-nums">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setStats(getStats()); toast.success("Stats refreshed") }} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 transition-colors text-sm">
            <RefreshCw className="h-4 w-4" /> Refresh Stats
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Announcements Tab
// ============================================================================

function AnnouncementsTab() {
  const [announcement, setAnnouncementState] = useState<Announcement>({ text: "", color: "#3b82f6", enabled: false })
  const { refresh } = useWBAuth()

  useEffect(() => {
    setAnnouncementState(getAnnouncement())
  }, [])

  const handleSave = () => {
    setAnnouncement(announcement)
    refresh()
    toast.success("Announcement saved")
  }

  const handleClear = () => {
    const cleared = { text: "", color: "#3b82f6", enabled: false }
    setAnnouncementState(cleared)
    setAnnouncement(cleared)
    refresh()
    toast.success("Announcement cleared")
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">Announcement Banner</h2>

      <div className="max-w-2xl rounded-2xl border border-border bg-card p-6 space-y-4">
        {/* Preview */}
        {announcement.text && announcement.enabled && (
          <div className="rounded-lg px-4 py-3 text-center text-sm font-medium text-white" style={{ backgroundColor: announcement.color }}>
            <Megaphone className="inline h-4 w-4 mr-2" />
            {announcement.text}
          </div>
        )}

        {/* Text */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
          <textarea
            value={announcement.text}
            onChange={(e) => setAnnouncementState((a) => ({ ...a, text: e.target.value }))}
            placeholder="Type your announcement message..."
            className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-foreground placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-red-500/30"
            rows={3}
          />
        </div>

        {/* Color */}
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Banner Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={announcement.color}
                onChange={(e) => setAnnouncementState((a) => ({ ...a, color: e.target.value }))}
                className="w-10 h-10 rounded-lg cursor-pointer border-0"
              />
              <span className="text-sm text-muted-foreground font-mono">{announcement.color}</span>
            </div>
          </div>

          {/* Enabled */}
          <div className="ml-auto">
            <label className="block text-sm font-medium text-foreground mb-1.5">Enabled</label>
            <button
              onClick={() => setAnnouncementState((a) => ({ ...a, enabled: !a.enabled }))}
              className={cn(
                "relative w-12 h-6 rounded-full transition-colors",
                announcement.enabled ? "bg-green-500" : "bg-gray-600"
              )}
            >
              <div className={cn("absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform", announcement.enabled ? "left-6.5 translate-x-0" : "left-0.5")}
                style={{ left: announcement.enabled ? "26px" : "2px" }}
              />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors text-sm">
            Save Announcement
          </button>
          <button onClick={handleClear} className="px-5 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors text-sm">
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}
