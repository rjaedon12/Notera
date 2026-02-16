"use client"

import { use, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Users, 
  BookOpen, 
  Copy, 
  Check, 
  ArrowLeft, 
  Plus,
  Crown,
  User,
  Trash2,
  LogOut
} from "lucide-react"
import { cn } from "@/lib/utils"

interface GroupMember {
  id: string
  role: string
  joinedAt: string
  user: { id: string; name: string | null; email: string }
}

interface GroupSet {
  id: string
  addedAt: string
  studySet: {
    id: string
    title: string
    description: string | null
    _count: { cards: number }
    owner: { id: string; name: string | null }
  }
}

interface Group {
  id: string
  name: string
  description: string | null
  inviteToken: string | null
  createdAt: string
  members: GroupMember[]
  sets: GroupSet[]
}

interface PageProps {
  params: Promise<{ groupId: string }>
}

export default function GroupDetailPage({ params }: PageProps) {
  const { groupId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [copiedCode, setCopiedCode] = useState(false)
  const [activeTab, setActiveTab] = useState<"sets" | "members">("sets")
  const [joinCode, setJoinCode] = useState("")

  // Fetch group details
  const { data: group, isLoading, error } = useQuery<Group>({
    queryKey: ["group", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupId}`)
      if (res.status === 403) {
        throw new Error("NOT_MEMBER")
      }
      if (!res.ok) throw new Error("Failed to fetch group")
      return res.json()
    },
    enabled: !!session?.user,
    retry: false
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
      queryClient.invalidateQueries({ queryKey: ["group", groupId] })
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      setJoinCode("")
    }
  })

  // Leave group mutation
  const leaveGroup = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST"
      })
      if (!res.ok) throw new Error("Failed to leave group")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      router.push("/groups")
    }
  })

  // Delete group mutation
  const deleteGroup = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete group")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      router.push("/groups")
    }
  })

  const copyInviteCode = async () => {
    if (group?.inviteToken) {
      await navigator.clipboard.writeText(group.inviteToken)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const currentMember = group?.members.find(
    (m) => m.user.id === session?.user?.id
  )
  const isOwner = currentMember?.role === "OWNER"

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-40 rounded-xl mb-6" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  // Check if user is not a member
  const isNotMember = error?.message === "NOT_MEMBER"

  if (!group) {
    if (isNotMember) {
      // Show join gate for non-members
      return (
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Link 
            href="/groups" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Groups
          </Link>
          
          <Card className="text-center">
            <CardContent className="p-8">
              <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2 text-foreground">Join this Group</h1>
              <p className="text-muted-foreground mb-6">
                You need to join this group to view its content. Enter the invite code below.
              </p>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (joinCode.trim()) {
                    joinGroup.mutate(joinCode.trim())
                  }
                }}
                className="space-y-4"
              >
                <Input
                  placeholder="Enter invite code..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <Button type="submit" className="w-full" disabled={joinGroup.isPending}>
                  {joinGroup.isPending ? "Joining..." : "Join Group"}
                </Button>
              </form>
              
              {joinGroup.isError && (
                <p className="text-sm text-red-500 mt-4">
                  {(joinGroup.error as Error).message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }
    
    // Regular not found
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">Group not found</h1>
        <Link href="/groups">
          <Button>Back to Groups</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link 
          href="/groups" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Groups
        </Link>

        {/* Group Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            </div>
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            {isOwner && group.inviteToken && (
              <Button variant="outline" onClick={copyInviteCode}>
                {copiedCode ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    {group.inviteToken}
                  </>
                )}
              </Button>
            )}
            {isOwner ? (
              <Button 
                variant="outline" 
                className="text-red-500"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this group?")) {
                    deleteGroup.mutate()
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            ) : (
              <Button 
                variant="outline"
                onClick={() => {
                  if (confirm("Are you sure you want to leave this group?")) {
                    leaveGroup.mutate()
                  }
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave
              </Button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("sets")}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              activeTab === "sets"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Study Sets ({group.sets.length})
            </span>
          </button>
          <button
            onClick={() => setActiveTab("members")}
            className={cn(
              "pb-3 px-1 text-sm font-medium border-b-2 transition-colors",
              activeTab === "members"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Members ({group.members.length})
            </span>
          </button>
        </div>

        {/* Study Sets Tab */}
        {activeTab === "sets" && (
          <div>
            {group.sets.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2 text-foreground">
                  No study sets yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Share your study sets with this group
                </p>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {group.sets.map((gs) => (
                  <Link key={gs.id} href={`/sets/${gs.studySet.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-1 text-card-foreground">
                          {gs.studySet.title}
                        </h3>
                        {gs.studySet.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {gs.studySet.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                          <span>{gs.studySet._count.cards} cards</span>
                          <span>by {gs.studySet.owner.name || "Anonymous"}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Members Tab */}
        {activeTab === "members" && (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {group.members.map((member) => (
                  <div key={member.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        {member.role === "OWNER" ? (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-card-foreground">
                          {member.user.name || "Anonymous"}
                          {member.user.id === session?.user?.id && (
                            <span className="text-muted-foreground/70 ml-1">(you)</span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-2 py-1 text-xs rounded-full",
                      member.role === "OWNER"
                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
