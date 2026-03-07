"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Shield, Users, BookOpen, Brain, FileText, Ban, Trash2,
  LogOut, Loader2, ChevronRight, UserX, Crown, User,
} from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

type PanelType = "stats" | "users" | "sets" | "quizzes" | "resources" | "banned"

interface AdminUser {
  id: string
  name: string | null
  email: string
  role: string
  isBanned: boolean
  createdAt: string
  _count: { sets: number }
}

interface AdminSet {
  id: string
  title: string
  isPublic: boolean
  createdAt: string
  user: { id: string; name: string | null; email: string }
  _count: { cards: number }
}

interface AdminQuiz {
  id: string
  title: string
  subject: string
  isPublic: boolean
  createdAt: string
  user: { id: string; name: string | null; email: string }
  _count: { questions: number; attempts: number }
}

interface AdminResource {
  id: string
  title: string
  type: string
  createdAt: string
  user: { id: string; name: string | null; email: string }
}

export default function AdminDashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [activePanel, setActivePanel] = useState<PanelType>("stats")

  // Verify admin cookie
  useEffect(() => {
    fetch("/api/admin/verify")
      .then((res) => {
        if (res.ok) {
          setAuthenticated(true)
        } else {
          router.replace("/admin")
        }
      })
      .catch(() => router.replace("/admin"))
      .finally(() => setChecking(false))
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin")
  }

  // Fetch users
  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["admin-dash", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: authenticated && (activePanel === "users" || activePanel === "banned" || activePanel === "stats"),
  })

  // Fetch stats
  const { data: adminStats } = useQuery<{ totalUsers: number; totalSets: number; totalQuizzes: number; totalResources: number }>({
    queryKey: ["admin-dash", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: authenticated && activePanel === "stats",
  })

  // Fetch sets
  const { data: sets = [] } = useQuery<AdminSet[]>({
    queryKey: ["admin-dash", "sets"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sets")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: authenticated && activePanel === "sets",
  })

  // Fetch quizzes
  const { data: quizzes = [] } = useQuery<AdminQuiz[]>({
    queryKey: ["admin-dash", "quizzes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/quizzes")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: authenticated && activePanel === "quizzes",
  })

  // Fetch resources
  const { data: resources = [] } = useQuery<AdminResource[]>({
    queryKey: ["admin-dash", "resources"],
    queryFn: async () => {
      const res = await fetch("/api/admin/resources")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: authenticated && activePanel === "resources",
  })

  // Ban/Unban mutation
  const banMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isBanned }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: (_, { isBanned }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-dash", "users"] })
      toast.success(isBanned ? "User banned" : "User unbanned")
    },
    onError: () => toast.error("Failed to update ban status"),
  })

  // Delete set mutation
  const deleteSetMutation = useMutation({
    mutationFn: async (setId: string) => {
      const res = await fetch("/api/admin/sets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dash", "sets"] })
      toast.success("Set deleted")
    },
    onError: () => toast.error("Failed to delete set"),
  })

  // Delete quiz mutation
  const deleteQuizMutation = useMutation({
    mutationFn: async (bankId: string) => {
      const res = await fetch("/api/admin/quizzes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankId }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dash", "quizzes"] })
      toast.success("Quiz deleted")
    },
    onError: () => toast.error("Failed to delete quiz"),
  })

  // Delete resource mutation
  const deleteResourceMutation = useMutation({
    mutationFn: async (resourceId: string) => {
      const res = await fetch("/api/admin/resources", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resourceId }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dash", "resources"] })
      toast.success("Resource deleted")
    },
    onError: () => toast.error("Failed to delete resource"),
  })

  if (checking || !authenticated) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  const panels: { key: PanelType; label: string; icon: React.ReactNode }[] = [
    { key: "stats", label: "Overview", icon: <Shield className="h-4 w-4" /> },
    { key: "users", label: "Users", icon: <Users className="h-4 w-4" /> },
    { key: "sets", label: "Sets", icon: <BookOpen className="h-4 w-4" /> },
    { key: "quizzes", label: "Quizzes", icon: <Brain className="h-4 w-4" /> },
    { key: "resources", label: "Resources", icon: <FileText className="h-4 w-4" /> },
    { key: "banned", label: "Banned Users", icon: <UserX className="h-4 w-4" /> },
  ]

  const bannedUsers = users.filter((u) => u.isBanned)
  const activeUsers = users.filter((u) => !u.isBanned)

  return (
    <div className="min-h-[calc(100vh-4rem)] flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r p-4 space-y-1"
        style={{ borderColor: "var(--glass-border)", background: "var(--sidebar-bg)" }}>
        <div className="flex items-center gap-2 px-3 py-3 mb-4">
          <Shield className="h-5 w-5" style={{ color: "var(--primary)" }} />
          <span className="font-heading font-bold text-foreground">Admin Dashboard</span>
        </div>
        {panels.map((p) => (
          <button
            key={p.key}
            onClick={() => setActivePanel(p.key)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              activePanel === p.key
                ? "text-white"
                : "hover:bg-[var(--glass-fill)]"
            )}
            style={activePanel === p.key ? {
              background: "linear-gradient(135deg, #3B4FE8, #5B8FFF)",
            } : { color: "var(--muted-foreground)" }}
          >
            {p.icon}
            <span>{p.label}</span>
            {p.key === "banned" && bannedUsers.length > 0 && (
              <span className="ml-auto px-2 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                {bannedUsers.length}
              </span>
            )}
          </button>
        ))}
        <div className="pt-4 mt-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all hover:bg-[var(--glass-fill)]"
            style={{ color: "var(--destructive)" }}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Stats Overview Panel */}
        {activePanel === "stats" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6 font-heading">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Total Users", value: adminStats?.totalUsers ?? users.length, icon: <Users className="h-5 w-5" />, color: "#4F8EF7" },
                { label: "Study Sets", value: adminStats?.totalSets ?? sets.length, icon: <BookOpen className="h-5 w-5" />, color: "#42d9a0" },
                { label: "Quizzes", value: adminStats?.totalQuizzes ?? quizzes.length, icon: <Brain className="h-5 w-5" />, color: "#a050dc" },
                { label: "Resources", value: adminStats?.totalResources ?? resources.length, icon: <FileText className="h-5 w-5" />, color: "#f59e0b" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border p-5"
                  style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}20`, color: stat.color }}>
                      {stat.icon}
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>{stat.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border p-5" style={{ borderColor: "var(--glass-border)" }}>
              <h3 className="font-semibold text-foreground mb-3">Banned Users</h3>
              <p className="text-2xl font-bold" style={{ color: bannedUsers.length > 0 ? "var(--destructive)" : "var(--muted-foreground)" }}>
                {bannedUsers.length}
              </p>
            </div>
          </div>
        )}

        {/* Users Panel */}
        {activePanel === "users" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 font-heading">All Users</h2>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--glass-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--glass-fill)" }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>User</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Email</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Role</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Sets</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Joined</th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeUsers.map((user) => (
                    <tr key={user.id} className="border-t" style={{ borderColor: "var(--glass-border)" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {user.role === "ADMIN" ? (
                            <Crown className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <User className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                          )}
                          <span className="text-foreground font-medium">{user.name || "No name"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-0.5 text-xs rounded-full",
                          user.role === "ADMIN"
                            ? "bg-yellow-500/15 text-yellow-500"
                            : "bg-blue-500/15 text-blue-400"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{user._count.sets}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => banMutation.mutate({ userId: user.id, isBanned: true })}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-red-500/10 text-red-400"
                        >
                          <Ban className="h-3 w-3" />
                          Ban
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {activeUsers.length === 0 && (
                <p className="p-8 text-center" style={{ color: "var(--muted-foreground)" }}>No users found</p>
              )}
            </div>
          </div>
        )}

        {/* Sets Panel */}
        {activePanel === "sets" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 font-heading">All Flashcard Sets</h2>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--glass-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--glass-fill)" }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Title</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Owner</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Cards</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Created</th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sets.map((set) => (
                    <tr key={set.id} className="border-t" style={{ borderColor: "var(--glass-border)" }}>
                      <td className="px-4 py-3 text-foreground font-medium">{set.title}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{set.user?.name || set.user?.email}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{set._count.cards}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{new Date(set.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => {
                          if (confirm(`Delete "${set.title}"?`)) deleteSetMutation.mutate(set.id)
                        }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-red-500/10 text-red-400">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sets.length === 0 && (
                <p className="p-8 text-center" style={{ color: "var(--muted-foreground)" }}>No sets found</p>
              )}
            </div>
          </div>
        )}

        {/* Quizzes Panel */}
        {activePanel === "quizzes" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 font-heading">All Quizzes</h2>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--glass-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--glass-fill)" }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Title</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Subject</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Owner</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Questions</th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((quiz) => (
                    <tr key={quiz.id} className="border-t" style={{ borderColor: "var(--glass-border)" }}>
                      <td className="px-4 py-3 text-foreground font-medium">{quiz.title}</td>
                      <td className="px-4 py-3" style={{ color: "var(--primary)" }}>{quiz.subject}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{quiz.user?.name || quiz.user?.email}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{quiz._count.questions}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => {
                          if (confirm(`Delete "${quiz.title}"?`)) deleteQuizMutation.mutate(quiz.id)
                        }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-red-500/10 text-red-400">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {quizzes.length === 0 && (
                <p className="p-8 text-center" style={{ color: "var(--muted-foreground)" }}>No quizzes found</p>
              )}
            </div>
          </div>
        )}

        {/* Resources Panel */}
        {activePanel === "resources" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 font-heading">All Resources</h2>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--glass-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--glass-fill)" }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Title</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Type</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Owner</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Created</th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.map((resource) => (
                    <tr key={resource.id} className="border-t" style={{ borderColor: "var(--glass-border)" }}>
                      <td className="px-4 py-3 text-foreground font-medium">{resource.title}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/15 text-blue-400">
                          {resource.type}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{resource.user?.name || resource.user?.email}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{new Date(resource.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => {
                          if (confirm(`Delete "${resource.title}"?`)) deleteResourceMutation.mutate(resource.id)
                        }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-red-500/10 text-red-400">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {resources.length === 0 && (
                <p className="p-8 text-center" style={{ color: "var(--muted-foreground)" }}>No resources found</p>
              )}
            </div>
          </div>
        )}

        {/* Banned Users Panel */}
        {activePanel === "banned" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 font-heading">Banned Users</h2>
            {bannedUsers.length === 0 ? (
              <div className="rounded-xl border p-8 text-center" style={{ borderColor: "var(--glass-border)" }}>
                <UserX className="h-12 w-12 mx-auto mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
                <p style={{ color: "var(--muted-foreground)" }}>No banned users</p>
              </div>
            ) : (
              <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--glass-border)" }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--glass-fill)" }}>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>User</th>
                      <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Email</th>
                      <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bannedUsers.map((user) => (
                      <tr key={user.id} className="border-t" style={{ borderColor: "var(--glass-border)" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Ban className="h-4 w-4 text-red-500" />
                            <span className="text-foreground font-medium">{user.name || "No name"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{user.email}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => banMutation.mutate({ userId: user.id, isBanned: false })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-green-500/10 text-green-400"
                          >
                            Unban
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
