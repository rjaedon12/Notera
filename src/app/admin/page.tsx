"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { 
  Users, 
  BookOpen, 
  Tag as TagIcon, 
  Shield, 
  Plus,
  Trash2,
  Crown,
  User,
  Key,
  Copy,
  Check,
  Ban,
  Edit,
  Brain,
  Layers,
} from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface AdminUser {
  id: string
  name: string | null
  email: string
  role: string
  isBanned: boolean
  createdAt: string
  _count: { sets: number }
}

interface Tag {
  id: string
  name: string
  slug: string
  category: string | null
  _count: { sets: number; resources: number }
}

interface AdminSet {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  tags: string[]
  createdAt: string
  user: { id: string; name: string | null; email: string }
  _count: { cards: number }
}

interface AdminStats {
  users: number
  sets: number
  cards: number
  tags: number
  quizBanks: number
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Protect route - redirect if not admin
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/")
    }
  }, [status, session, router])

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "sets" | "tags">("overview")
  const [newTagName, setNewTagName] = useState("")
  const [newTagCategory, setNewTagCategory] = useState("")
  const [resetPasswordDialog, setResetPasswordDialog] = useState<{ open: boolean; resetLink: string | null; userName: string | null }>({
    open: false,
    resetLink: null,
    userName: null
  })
  const [copied, setCopied] = useState(false)
  const [renameDialog, setRenameDialog] = useState<{ open: boolean; userId: string; currentName: string }>({
    open: false, userId: "", currentName: ""
  })
  const [newName, setNewName] = useState("")

  // Fetch admin stats
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/admin/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
    enabled: session?.user?.role === "ADMIN"
  })

  // Fetch users
  const { data: users = [] } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error("Failed to fetch users")
      return res.json()
    },
    enabled: activeTab === "users" && session?.user?.role === "ADMIN"
  })

  // Fetch tags
  const { data: tags = [] } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags")
      if (!res.ok) throw new Error("Failed to fetch tags")
      return res.json()
    },
    enabled: activeTab === "tags" && session?.user?.role === "ADMIN"
  })

  // Fetch sets (admin)
  const { data: sets = [] } = useQuery<AdminSet[]>({
    queryKey: ["admin", "sets"],
    queryFn: async () => {
      const res = await fetch("/api/admin/sets")
      if (!res.ok) throw new Error("Failed to fetch sets")
      return res.json()
    },
    enabled: activeTab === "sets" && session?.user?.role === "ADMIN"
  })

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTagName,
          category: newTagCategory || null
        })
      })
      if (!res.ok) throw new Error("Failed to create tag")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
      setNewTagName("")
      setNewTagCategory("")
    }
  })

  // Toggle user role mutation
  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      })
      if (!res.ok) throw new Error("Failed to update role")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success("Role updated")
    },
    onError: () => toast.error("Failed to update role")
  })

  // Ban/unban mutation
  const banMutation = useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string; isBanned: boolean }) => {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned })
      })
      if (!res.ok) throw new Error("Failed to update ban status")
      return res.json()
    },
    onSuccess: (_, { isBanned }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success(isBanned ? "User banned" : "User unbanned")
    },
    onError: () => toast.error("Failed to update ban status")
  })

  // Rename user mutation
  const renameMutation = useMutation({
    mutationFn: async ({ userId, name }: { userId: string; name: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/username`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })
      if (!res.ok) throw new Error("Failed to change username")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      setRenameDialog({ open: false, userId: "", currentName: "" })
      setNewName("")
      toast.success("Username updated")
    },
    onError: () => toast.error("Failed to change username")
  })

  // Delete tag mutation
  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      const res = await fetch(`/api/tags/${tagId}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete tag")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] })
    }
  })

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, userName }: { userId: string; userName: string }) => {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to generate reset link")
      const data = await res.json()
      return { ...data, userName }
    },
    onSuccess: (data) => {
      setResetPasswordDialog({
        open: true,
        resetLink: data.resetLink,
        userName: data.userName
      })
    }
  })

  const copyToClipboard = async () => {
    if (resetPasswordDialog.resetLink) {
      await navigator.clipboard.writeText(resetPasswordDialog.resetLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete user")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
      toast.success("User deleted")
    },
    onError: () => toast.error("Failed to delete user")
  })

  // Delete set mutation
  const deleteSetMutation = useMutation({
    mutationFn: async (setId: string) => {
      const res = await fetch("/api/admin/sets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId })
      })
      if (!res.ok) throw new Error("Failed to delete set")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sets"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] })
      toast.success("Set deleted")
    },
    onError: () => toast.error("Failed to delete set")
  })

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to view this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border mb-8">
          {(["overview", "users", "sets", "tags"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors",
                activeTab === tab
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Users</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.users || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Study Sets</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.sets || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Flashcards</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.cards || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <Brain className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quiz Banks</p>
                    <p className="text-2xl font-bold text-card-foreground">{stats?.quizBanks || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y dark:divide-gray-700">
                  {users.map((user) => (
                    <div key={user.id} className="py-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            {user.role === "ADMIN" ? (
                              <Crown className="h-5 w-5 text-yellow-500" />
                            ) : user.isBanned ? (
                              <Ban className="h-5 w-5 text-red-500" />
                            ) : (
                              <User className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">{user.name || "No name"}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{user._count.sets} sets</span>
                          <span className={cn(
                            "px-2 py-1 text-xs rounded-full",
                            user.isBanned
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : user.role === "ADMIN"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {user.isBanned ? "BANNED" : user.role}
                          </span>
                        </div>
                      </div>
                      {user.id !== session.user.id && (
                        <div className="flex items-center gap-2 pl-13 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => toggleRoleMutation.mutate({
                            userId: user.id, newRole: user.role === "ADMIN" ? "USER" : "ADMIN"
                          })}>
                            <Crown className="h-3 w-3 mr-1" />
                            {user.role === "ADMIN" ? "Demote" : "Promote"}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            setRenameDialog({ open: true, userId: user.id, currentName: user.name || "" })
                            setNewName(user.name || "")
                          }}>
                            <Edit className="h-3 w-3 mr-1" />
                            Rename
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => banMutation.mutate({
                            userId: user.id, isBanned: !user.isBanned
                          })}>
                            <Ban className="h-3 w-3 mr-1" />
                            {user.isBanned ? "Unban" : "Ban"}
                          </Button>
                          <Button size="sm" variant="outline"
                            onClick={() => resetPasswordMutation.mutate({ userId: user.id, userName: user.name || user.email })}
                            disabled={resetPasswordMutation.isPending}>
                            <Key className="h-3 w-3 mr-1" />
                            Reset Password
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => {
                            if (confirm(`Delete ${user.name || user.email}? This cannot be undone.`)) {
                              deleteUserMutation.mutate(user.id)
                            }
                          }}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sets Tab */}
        {activeTab === "sets" && (
          <Card>
            <CardHeader>
              <CardTitle>Study Set Management</CardTitle>
            </CardHeader>
            <CardContent>
              {sets.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No study sets found</p>
              ) : (
                <div className="divide-y dark:divide-gray-700">
                  {sets.map((set) => (
                    <div key={set.id} className="py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-card-foreground">{set.title}</h3>
                          {set.isPublic && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Public
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span>{set._count.cards} cards</span>
                          <span>by {set.user?.name || set.user?.email || "Unknown"}</span>
                          <span>{new Date(set.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button size="sm" variant="destructive" onClick={() => {
                        if (confirm(`Delete "${set.title}"? This cannot be undone.`)) {
                          deleteSetMutation.mutate(set.id)
                        }
                      }}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tags Tab */}
        {activeTab === "tags" && (
          <div className="space-y-6">
            {/* Create Tag */}
            <Card>
              <CardHeader>
                <CardTitle>Create New Tag</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (newTagName.trim()) {
                      createTagMutation.mutate()
                    }
                  }}
                  className="flex gap-3"
                >
                  <div className="flex-1">
                    <Label htmlFor="tagName" className="sr-only">Tag Name</Label>
                    <Input
                      id="tagName"
                      placeholder="Tag name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                    />
                  </div>
                  <div className="w-40">
                    <Label htmlFor="tagCategory" className="sr-only">Category</Label>
                    <Input
                      id="tagCategory"
                      placeholder="Category (optional)"
                      value={newTagCategory}
                      onChange={(e) => setNewTagCategory(e.target.value)}
                    />
                  </div>
                  <Button type="submit" disabled={createTagMutation.isPending}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Tag
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Tags List */}
            <Card>
              <CardHeader>
                <CardTitle>All Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y dark:divide-gray-700">
                  {tags.map((tag) => (
                    <div key={tag.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-full">
                          {tag.name}
                        </span>
                        {tag.category && (
                          <span className="text-sm text-muted-foreground">
                            {tag.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                          {tag._count.sets} sets, {tag._count.resources} resources
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteTagMutation.mutate(tag.id)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tags.length === 0 && (
                    <p className="py-8 text-center text-muted-foreground">No tags yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialog.open} onOpenChange={(open) => {
        if (!open) {
          setResetPasswordDialog({ open: false, resetLink: null, userName: null })
          setCopied(false)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password Reset Link Generated</DialogTitle>
            <DialogDescription>
              A secure password reset link has been created for {resetPasswordDialog.userName}. 
              This link will expire in 24 hours and can only be used once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={resetPasswordDialog.resetLink || ""}
                className="flex-1 text-sm"
              />
              <Button size="sm" onClick={copyToClipboard}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              <strong>Important:</strong> This link is only shown once. Copy it now and share it securely with the user.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialog.open} onOpenChange={(open) => {
        if (!open) setRenameDialog({ open: false, userId: "", currentName: "" })
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Username</DialogTitle>
            <DialogDescription>
              Current name: {renameDialog.currentName || "None"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newName">New Name</Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter new username"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenameDialog({ open: false, userId: "", currentName: "" })}>
                Cancel
              </Button>
              <Button
                onClick={() => renameMutation.mutate({ userId: renameDialog.userId, name: newName })}
                disabled={!newName.trim() || renameMutation.isPending}
              >
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
