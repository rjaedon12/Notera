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
  BookOpen,
  Copy,
  Check,
  GraduationCap,
  Flame,
  ClipboardList,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Space {
  id: string
  name: string
  description: string | null
  type: "COLLABORATIVE" | "CLASSROOM"
  inviteCode: string
  createdAt: string
  _count: {
    members: number
    sets: number
    assignments: number
  }
  members: {
    role: string
    user: { id: string; name: string | null }
  }[]
  owner: {
    id: string
    name: string | null
    role: string
  }
}

export default function SpacesPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newSpaceName, setNewSpaceName] = useState("")
  const [newSpaceDesc, setNewSpaceDesc] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState("")

  const isTeacher =
    session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"

  // Fetch user's spaces
  const { data: spaces = [], isLoading } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: async () => {
      const res = await fetch("/api/spaces")
      if (!res.ok) throw new Error("Failed to fetch spaces")
      return res.json()
    },
    enabled: !!session?.user,
  })

  // Create space mutation
  const createSpace = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSpaceName,
          description: newSpaceDesc || null,
        }),
      })
      if (!res.ok) throw new Error("Failed to create space")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
      setShowCreateForm(false)
      setNewSpaceName("")
      setNewSpaceDesc("")
    },
  })

  // Join space mutation
  const joinSpace = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/spaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to join space")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
      setJoinCode("")
    },
  })

  const copyInviteCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Users
          className="h-12 w-12 mx-auto mb-4"
          style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
        />
        <h1 className="text-2xl font-bold mb-2 text-foreground font-heading">
          Spaces
        </h1>
        <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>
          Sign in to create or join study spaces and classrooms
        </p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  const classrooms = spaces.filter((s) => s.type === "CLASSROOM")
  const collaborative = spaces.filter((s) => s.type === "COLLABORATIVE")

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-heading tracking-tight">
              Spaces
            </h1>
            <p style={{ color: "var(--muted-foreground)" }}>
              {isTeacher
                ? "Manage classrooms and assign study materials"
                : "Collaborate with others in study spaces"}
            </p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {isTeacher ? "Create Classroom" : "Create Space"}
          </Button>
        </div>

        {/* Join by code */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (joinCode.trim()) {
                  joinSpace.mutate(joinCode.trim())
                }
              }}
              className="flex gap-3"
            >
              <Input
                placeholder="Enter invite code to join..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={joinSpace.isPending}
              >
                Join Space
              </Button>
            </form>
            {joinSpace.isError && (
              <p className="text-sm text-red-500 mt-2">
                {(joinSpace.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Create Space Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {isTeacher ? "Create New Classroom" : "Create New Space"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newSpaceName.trim()) {
                    createSpace.mutate()
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="spaceName">
                    {isTeacher ? "Classroom Name" : "Space Name"}
                  </Label>
                  <Input
                    id="spaceName"
                    placeholder={
                      isTeacher
                        ? "AP US History — Period 3"
                        : "My Study Space"
                    }
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="spaceDesc">Description (optional)</Label>
                  <Input
                    id="spaceDesc"
                    placeholder={
                      isTeacher
                        ? "Class description, section, semester..."
                        : "What is this space about?"
                    }
                    value={newSpaceDesc}
                    onChange={(e) => setNewSpaceDesc(e.target.value)}
                  />
                </div>
                {isTeacher && (
                  <div
                    className="flex items-start gap-3 rounded-xl border px-4 py-3"
                    style={{
                      borderColor: "rgba(99, 102, 241, 0.25)",
                      background: "rgba(99, 102, 241, 0.06)",
                    }}
                  >
                    <GraduationCap
                      className="h-4 w-4 mt-0.5 shrink-0"
                      style={{ color: "#6366f1" }}
                    />
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      As a teacher, this will be created as a <strong>Classroom</strong> space.
                      Students will join with a code and you can assign study sets, quizzes,
                      and DBQs.
                    </p>
                  </div>
                )}
                <div className="flex gap-3">
                  <Button type="submit" disabled={createSpace.isPending}>
                    {isTeacher ? "Create Classroom" : "Create Space"}
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

        {/* Spaces List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <Card className="p-8 text-center">
            <Users
              className="h-12 w-12 mx-auto mb-4"
              style={{ color: "var(--muted-foreground)", opacity: 0.4 }}
            />
            <h3 className="text-lg font-medium mb-2 text-foreground font-heading">
              No spaces yet
            </h3>
            <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>
              {isTeacher
                ? "Create a classroom to get started with your students"
                : "Create a study space or join one with an invite code"}
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Teacher Classrooms */}
            {classrooms.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                  <GraduationCap className="h-4 w-4" />
                  Classrooms
                </h2>
                <div className="space-y-3">
                  {classrooms.map((space) => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      session={session}
                      copiedCode={copiedCode}
                      onCopyCode={copyInviteCode}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Collaborative Spaces */}
            {collaborative.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                  <Users className="h-4 w-4" />
                  Study Spaces
                </h2>
                <div className="space-y-3">
                  {collaborative.map((space) => (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      session={session}
                      copiedCode={copiedCode}
                      onCopyCode={copyInviteCode}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function SpaceCard({
  space,
  session,
  copiedCode,
  onCopyCode,
}: {
  space: Space
  session: { user: { id: string } } | null
  copiedCode: string | null
  onCopyCode: (code: string) => void
}) {
  const isOwner = space.members.some(
    (m) => m.user.id === session?.user?.id && m.role === "OWNER"
  )

  return (
    <Link href={`/spaces/${space.id}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg text-card-foreground font-heading">
                  {space.name}
                </h3>
                <span
                  className={cn(
                    "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full",
                    space.type === "CLASSROOM"
                      ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                  )}
                >
                  {space.type === "CLASSROOM" ? "Classroom" : "Study Space"}
                </span>
              </div>
              {space.description && (
                <p className="text-muted-foreground text-sm mb-3">
                  {space.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {space._count.members} members
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {space._count.sets} sets
                </span>
                {space.type === "CLASSROOM" && (
                  <span className="flex items-center gap-1">
                    <ClipboardList className="h-4 w-4" />
                    {space._count.assignments} assignments
                  </span>
                )}
              </div>
            </div>

            {/* Invite code for owners */}
            {isOwner && space.inviteCode && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  onCopyCode(space.inviteCode)
                }}
                className="flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all"
                style={{
                  background: "var(--glass-fill)",
                  border: "1px solid var(--glass-border)",
                }}
              >
                {copiedCode === space.inviteCode ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    {space.inviteCode}
                  </>
                )}
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
