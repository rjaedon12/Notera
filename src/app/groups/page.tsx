"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  Plus, 
  Lock, 
  Globe, 
  BookOpen,
  Settings,
  Copy,
  Check
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Group {
  id: string
  name: string
  description: string | null
  inviteToken: string
  createdAt: string
  _count: {
    members: number
    sets: number
  }
  members: {
    role: string
    user: { id: string; name: string | null }
  }[]
}

export default function GroupsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupDesc, setNewGroupDesc] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState("")

  // Fetch user's groups
  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups")
      if (!res.ok) throw new Error("Failed to fetch groups")
      return res.json()
    },
    enabled: !!session?.user
  })

  // Create group mutation
  const createGroup = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc || null
        })
      })
      if (!res.ok) throw new Error("Failed to create group")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      setShowCreateForm(false)
      setNewGroupName("")
      setNewGroupDesc("")
    }
  })

  // Join group mutation
  const joinGroup = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code })
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to join group")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      setJoinCode("")
    }
  })

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Users className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
        <h1 className="text-2xl font-bold mb-2 text-foreground font-heading">Study Groups</h1>
        <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>
          Sign in to create or join study groups
        </p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-heading tracking-tight">Study Groups</h1>
            <p style={{ color: "var(--muted-foreground)" }}>
              Collaborate with others on study sets
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>

        {/* Join by code */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (joinCode.trim()) {
                  joinGroup.mutate(joinCode.trim())
                }
              }}
              className="flex gap-3"
            >
              <Input
                placeholder="Enter invite code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" variant="outline" disabled={joinGroup.isPending}>
                Join Group
              </Button>
            </form>
            {joinGroup.isError && (
              <p className="text-sm text-red-500 mt-2">
                {(joinGroup.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Create Group Form */}
        {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newGroupName.trim()) {
                    createGroup.mutate()
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="My Study Group"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="groupDesc">Description (optional)</Label>
                  <Input
                    id="groupDesc"
                    placeholder="What is this group about?"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={createGroup.isPending}>
                    Create Group
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Groups List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
            <h3 className="text-lg font-medium mb-2 text-foreground font-heading">No groups yet</h3>
            <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>
              Create a group or join one with an invite code
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <Link key={group.id} href={`/groups/${group.id}`}>
                <Card className="cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-card-foreground font-heading">
                            {group.name}
                          </h3>
                        </div>
                        {group.description && (
                          <p className="text-muted-foreground text-sm mb-3">
                            {group.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {group._count.members} members
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {group._count.sets} sets
                          </span>
                        </div>
                      </div>
                      
                      {/* Invite code for owners */}
                      {group.inviteToken && group.members.some(
                        (m) => m.user.id === session.user.id && m.role === "OWNER"
                      ) && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            copyInviteCode(group.inviteToken)
                          }}
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all"
                          style={{ background: "var(--glass-fill)", border: "1px solid var(--glass-border)" }}
                        >
                          {copiedCode === group.inviteToken ? (
                            <>
                              <Check className="h-3 w-3 text-green-500" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              {group.inviteToken}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
