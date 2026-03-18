"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Shield, Users, BookOpen, Brain, FileText, Ban, Trash2,
  LogOut, Loader2, ChevronRight, UserX, Crown, User, Megaphone,
  Plus, ToggleLeft, ToggleRight, Clock, Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

type PanelType = "stats" | "users" | "sets" | "quizzes" | "resources" | "dbq" | "banned" | "announcements"

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
  isFeatured: boolean
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

interface AdminDBQPrompt {
  id: string
  title: string
  subject: string
  era: string
  createdAt: string
  _count: { documents: number; essays: number }
}

interface AdminAnnouncement {
  id: string
  title: string
  message: string
  type: string
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  createdBy: { name: string | null; email: string }
  _count: { dismissals: number }
}

export default function AdminDashboard() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session, status } = useSession()
  const [activePanel, setActivePanel] = useState<PanelType>("stats")

  // Check admin role via NextAuth session
  const authenticated = status === "authenticated" && session?.user?.role === "ADMIN"

  useEffect(() => {
    if (status === "loading") return
    if (!authenticated) {
      router.replace("/admin")
    }
  }, [status, authenticated, router])

  const handleLogout = () => {
    router.push("/")
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

  // Fetch DBQ prompts
  const { data: dbqPrompts = [] } = useQuery<AdminDBQPrompt[]>({
    queryKey: ["admin-dash", "dbq"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dbq")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: authenticated && activePanel === "dbq",
  })

  // Fetch announcements
  const { data: announcements = [] } = useQuery<AdminAnnouncement[]>({
    queryKey: ["admin-dash", "announcements"],
    queryFn: async () => {
      const res = await fetch("/api/admin/announcements")
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    enabled: authenticated && activePanel === "announcements",
  })

  // Announcement form state
  const [annTitle, setAnnTitle] = useState("")
  const [annMessage, setAnnMessage] = useState("")
  const [annType, setAnnType] = useState("INFO")
  const [annExpiry, setAnnExpiry] = useState("")

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          message: annMessage,
          type: annType,
          expiresAt: annExpiry || null,
        }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dash", "announcements"] })
      setAnnTitle("")
      setAnnMessage("")
      setAnnType("INFO")
      setAnnExpiry("")
      toast.success("Announcement created")
    },
    onError: () => toast.error("Failed to create announcement"),
  })

  // Toggle announcement active status
  const toggleAnnouncementMutation = useMutation({
    mutationFn: async ({ announcementId, isActive }: { announcementId: string; isActive: boolean }) => {
      const res = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId, isActive }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dash", "announcements"] })
      toast.success("Announcement updated")
    },
    onError: () => toast.error("Failed to update announcement"),
  })

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      const res = await fetch("/api/admin/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dash", "announcements"] })
      toast.success("Announcement deleted")
    },
    onError: () => toast.error("Failed to delete announcement"),
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

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ setId, isFeatured }: { setId: string; isFeatured: boolean }) => {
      const res = await fetch("/api/admin/sets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId, isFeatured }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dash", "sets"] })
      toast.success("Featured status updated")
    },
    onError: () => toast.error("Failed to update featured status"),
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

  // Delete DBQ prompt mutation
  const deleteDBQMutation = useMutation({
    mutationFn: async (promptId: string) => {
      const res = await fetch("/api/admin/dbq", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptId }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-dash", "dbq"] })
      toast.success("DBQ deleted")
    },
    onError: () => toast.error("Failed to delete DBQ"),
  })

  if (status === "loading" || !authenticated) {
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
    { key: "dbq", label: "DBQs", icon: <BookOpen className="h-4 w-4" /> },
    { key: "banned", label: "Banned Users", icon: <UserX className="h-4 w-4" /> },
    { key: "announcements", label: "Announcements", icon: <Megaphone className="h-4 w-4" /> },
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
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Featured</th>
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
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleFeaturedMutation.mutate({ setId: set.id, isFeatured: !set.isFeatured })}
                          className="p-1 rounded transition-colors hover:bg-yellow-500/10"
                          title={set.isFeatured ? "Remove from featured" : "Feature this set"}
                        >
                          <Star className={cn("h-4 w-4", set.isFeatured ? "fill-yellow-400 text-yellow-400" : "text-gray-400")} />
                        </button>
                      </td>
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

        {/* DBQ Panel */}
        {activePanel === "dbq" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 font-heading">DBQ Prompts</h2>
            <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--glass-border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--glass-fill)" }}>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Title</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Subject</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Era</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Docs</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Essays</th>
                    <th className="text-left px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Created</th>
                    <th className="text-right px-4 py-3 font-medium" style={{ color: "var(--muted-foreground)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dbqPrompts.map((prompt) => (
                    <tr key={prompt.id} className="border-t" style={{ borderColor: "var(--glass-border)" }}>
                      <td className="px-4 py-3 text-foreground font-medium max-w-[220px] truncate">{prompt.title}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/15 text-blue-400">
                          {prompt.subject}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{prompt.era}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{prompt._count.documents}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{prompt._count.essays}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{new Date(prompt.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => {
                          if (confirm(`Delete "${prompt.title}" and all its documents and essays?`)) deleteDBQMutation.mutate(prompt.id)
                        }} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-red-500/10 text-red-400">
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {dbqPrompts.length === 0 && (
                <p className="p-8 text-center" style={{ color: "var(--muted-foreground)" }}>No DBQ prompts found</p>
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

        {/* Announcements Panel */}
        {activePanel === "announcements" && (
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6 font-heading">Announcements</h2>

            {/* Create Announcement Form */}
            <div className="rounded-xl border p-5 mb-6" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Plus className="h-4 w-4" style={{ color: "var(--primary)" }} />
                New Announcement
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Title"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:ring-2 focus:ring-[var(--primary)]/30 text-foreground"
                  style={{ borderColor: "var(--glass-border)" }}
                />
                <textarea
                  placeholder="Message"
                  value={annMessage}
                  onChange={(e) => setAnnMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm bg-transparent border outline-none focus:ring-2 focus:ring-[var(--primary)]/30 text-foreground resize-none"
                  style={{ borderColor: "var(--glass-border)" }}
                />
                <div className="flex flex-wrap gap-3">
                  <select
                    value={annType}
                    onChange={(e) => setAnnType(e.target.value)}
                    className="px-3 py-2 rounded-lg text-sm bg-transparent border outline-none text-foreground"
                    style={{ borderColor: "var(--glass-border)" }}
                  >
                    <option value="INFO">ℹ️ Info</option>
                    <option value="UPDATE">✨ Update</option>
                    <option value="WARNING">⚠️ Warning</option>
                    <option value="MAINTENANCE">🔧 Maintenance</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" style={{ color: "var(--muted-foreground)" }} />
                    <input
                      type="datetime-local"
                      value={annExpiry}
                      onChange={(e) => setAnnExpiry(e.target.value)}
                      className="px-3 py-2 rounded-lg text-sm bg-transparent border outline-none text-foreground"
                      style={{ borderColor: "var(--glass-border)" }}
                      placeholder="Expiry (optional)"
                    />
                  </div>
                  <button
                    onClick={() => createAnnouncementMutation.mutate()}
                    disabled={!annTitle.trim() || !annMessage.trim() || createAnnouncementMutation.isPending}
                    className="ml-auto px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
                    style={{ background: "linear-gradient(135deg, #3B4FE8, #5B8FFF)" }}
                  >
                    {createAnnouncementMutation.isPending ? "Creating..." : "Publish"}
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Announcements */}
            {announcements.length === 0 ? (
              <div className="rounded-xl border p-8 text-center" style={{ borderColor: "var(--glass-border)" }}>
                <Megaphone className="h-12 w-12 mx-auto mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
                <p style={{ color: "var(--muted-foreground)" }}>No announcements yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="rounded-xl border p-4"
                    style={{
                      borderColor: ann.isActive ? "var(--glass-border)" : "rgba(239,68,68,0.2)",
                      background: ann.isActive ? "var(--glass-fill)" : "rgba(239,68,68,0.04)",
                      opacity: ann.isActive ? 1 : 0.7,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full",
                            ann.type === "INFO" && "bg-blue-500/15 text-blue-400",
                            ann.type === "UPDATE" && "bg-green-500/15 text-green-400",
                            ann.type === "WARNING" && "bg-yellow-500/15 text-yellow-400",
                            ann.type === "MAINTENANCE" && "bg-red-500/15 text-red-400",
                          )}>
                            {ann.type}
                          </span>
                          {!ann.isActive && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-red-500/15 text-red-400">
                              Inactive
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">{ann.title}</h4>
                        <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{ann.message}</p>
                        <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                          <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>{ann._count.dismissals} dismissed</span>
                          {ann.expiresAt && (
                            <>
                              <span>•</span>
                              <span>Expires {new Date(ann.expiresAt).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => toggleAnnouncementMutation.mutate({ announcementId: ann.id, isActive: !ann.isActive })}
                          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--glass-fill)]"
                          title={ann.isActive ? "Deactivate" : "Activate"}
                        >
                          {ann.isActive
                            ? <ToggleRight className="h-5 w-5 text-green-400" />
                            : <ToggleLeft className="h-5 w-5" style={{ color: "var(--muted-foreground)" }} />
                          }
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete announcement "${ann.title}"?`)) deleteAnnouncementMutation.mutate(ann.id)
                          }}
                          className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10 text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
