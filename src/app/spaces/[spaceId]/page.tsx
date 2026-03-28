"use client"

import { use, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  LogOut,
  Flame,
  Trophy,
  ClipboardList,
  Megaphone,
  GraduationCap,
  FileText,
  HelpCircle,
  Calendar,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ─── Types ─── */
interface SpaceMemberData {
  userId: string
  role: string
  joinedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
    streak: number
    longestStreak: number
    role: string
  }
}

interface SpaceSet {
  spaceId: string
  setId: string
  set: {
    id: string
    title: string
    description: string | null
    _count: { cards: number }
    user: { id: string; name: string | null }
  }
}

interface SpaceAssignment {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  assignedAt: string
  assignedBy: { id: string; name: string | null }
  flashcardSet: { id: string; title: string } | null
  questionBank: { id: string; title: string } | null
  dbqPrompt: { id: string; title: string } | null
}

interface SpaceAnnouncementData {
  id: string
  title: string
  message: string
  createdAt: string
  author: { id: string; name: string | null; image: string | null }
}

interface LeaderboardEntry {
  userId: string
  name: string
  image: string | null
  streak: number
  longestStreak: number
  role: string
}

interface SpaceData {
  id: string
  name: string
  description: string | null
  type: "COLLABORATIVE" | "CLASSROOM"
  inviteCode: string
  createdAt: string
  owner: { id: string; name: string | null; role: string }
  members: SpaceMemberData[]
  sets: SpaceSet[]
  assignments: SpaceAssignment[]
  announcements: SpaceAnnouncementData[]
  leaderboard: LeaderboardEntry[]
}

type TabKey = "sets" | "members" | "assignments" | "leaderboard" | "announcements"

interface PageProps {
  params: Promise<{ spaceId: string }>
}

export default function SpaceDetailPage({ params }: PageProps) {
  const { spaceId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [copiedCode, setCopiedCode] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("sets")
  const [joinCode, setJoinCode] = useState("")

  // Fetch space details
  const {
    data: space,
    isLoading,
    error,
  } = useQuery<SpaceData>({
    queryKey: ["space", spaceId],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}`)
      if (res.status === 403) throw new Error("NOT_MEMBER")
      if (!res.ok) throw new Error("Failed to fetch space")
      return res.json()
    },
    enabled: !!session?.user,
    retry: false,
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
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
      setJoinCode("")
    },
  })

  // Leave space mutation
  const leaveSpace = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/leave`, {
        method: "POST",
      })
      if (!res.ok) throw new Error("Failed to leave space")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
      router.push("/spaces")
    },
  })

  // Delete space mutation
  const deleteSpace = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete space")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
      router.push("/spaces")
    },
  })

  const copyInviteCode = async () => {
    if (space?.inviteCode) {
      await navigator.clipboard.writeText(space.inviteCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const currentMember = space?.members.find(
    (m) => m.user.id === session?.user?.id
  )
  const isOwner = currentMember?.role === "OWNER"
  const isModerator =
    currentMember?.role === "MODERATOR" || currentMember?.role === "OWNER"
  const isClassroom = space?.type === "CLASSROOM"

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-40 rounded-xl mb-6" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  // Not a member — show join gate
  const isNotMember = error?.message === "NOT_MEMBER"
  if (!space) {
    if (isNotMember) {
      return (
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Link
            href="/spaces"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Spaces
          </Link>
          <Card className="text-center">
            <CardContent className="p-8">
              <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2 text-foreground">
                Join this Space
              </h1>
              <p className="text-muted-foreground mb-6">
                Enter the invite code to join and view content.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (joinCode.trim()) joinSpace.mutate(joinCode.trim())
                }}
                className="space-y-4"
              >
                <Input
                  placeholder="Enter invite code..."
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={joinSpace.isPending}
                >
                  {joinSpace.isPending ? "Joining..." : "Join Space"}
                </Button>
              </form>
              {joinSpace.isError && (
                <p className="text-sm text-red-500 mt-4">
                  {(joinSpace.error as Error).message}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">
          Space not found
        </h1>
        <Link href="/spaces">
          <Button>Back to Spaces</Button>
        </Link>
      </div>
    )
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      key: "sets",
      label: "Study Sets",
      icon: <BookOpen className="h-4 w-4" />,
      count: space.sets.length,
    },
    {
      key: "members",
      label: "Members",
      icon: <Users className="h-4 w-4" />,
      count: space.members.length,
    },
    ...(isClassroom
      ? [
          {
            key: "assignments" as TabKey,
            label: "Assignments",
            icon: <ClipboardList className="h-4 w-4" />,
            count: space.assignments.length,
          },
        ]
      : []),
    {
      key: "leaderboard",
      label: "Leaderboard",
      icon: <Trophy className="h-4 w-4" />,
    },
    {
      key: "announcements",
      label: "Announcements",
      icon: <Megaphone className="h-4 w-4" />,
      count: space.announcements.length,
    },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Back link */}
        <Link
          href="/spaces"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Spaces
        </Link>

        {/* Space Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground font-heading">
                {space.name}
              </h1>
              <span
                className={cn(
                  "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full",
                  isClassroom
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                )}
              >
                {isClassroom ? "Classroom" : "Study Space"}
              </span>
            </div>
            {space.description && (
              <p className="text-muted-foreground">{space.description}</p>
            )}
          </div>

          <div className="flex gap-2">
            {isOwner && (
              <Button variant="outline" onClick={copyInviteCode}>
                {copiedCode ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    {space.inviteCode}
                  </>
                )}
              </Button>
            )}
            {isOwner ? (
              <Button
                variant="outline"
                className="text-red-500"
                onClick={() => {
                  if (
                    confirm("Are you sure you want to delete this space?")
                  ) {
                    deleteSpace.mutate()
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
                  if (
                    confirm("Are you sure you want to leave this space?")
                  ) {
                    leaveSpace.mutate()
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
        <div className="flex gap-4 border-b border-border mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "border-[var(--accent-color)] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && (
                  <span className="text-xs opacity-60">({tab.count})</span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "sets" && (
          <SetsTab space={space} isModerator={isModerator} spaceId={spaceId} />
        )}
        {activeTab === "members" && (
          <MembersTab space={space} session={session} />
        )}
        {activeTab === "assignments" && isClassroom && (
          <AssignmentsTab
            space={space}
            isModerator={isModerator}
            spaceId={spaceId}
          />
        )}
        {activeTab === "leaderboard" && (
          <LeaderboardTab space={space} session={session} />
        )}
        {activeTab === "announcements" && (
          <AnnouncementsTab
            space={space}
            isModerator={isModerator}
            spaceId={spaceId}
          />
        )}
      </div>
    </div>
  )
}

/* ─── Sets Tab ─── */
function SetsTab({
  space,
  isModerator,
  spaceId,
}: {
  space: SpaceData
  isModerator: boolean
  spaceId: string
}) {
  const queryClient = useQueryClient()
  const [addSetId, setAddSetId] = useState("")

  const addSet = useMutation({
    mutationFn: async (setId: string) => {
      const res = await fetch(`/api/spaces/${spaceId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add set")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
      setAddSetId("")
    },
  })

  return (
    <div>
      {isModerator && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (addSetId.trim()) addSet.mutate(addSetId.trim())
              }}
              className="flex gap-3"
            >
              <Input
                placeholder="Paste a set ID to add..."
                value={addSetId}
                onChange={(e) => setAddSetId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={addSet.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Add Set
              </Button>
            </form>
            {addSet.isError && (
              <p className="text-sm text-red-500 mt-2">
                {(addSet.error as Error).message}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {space.sets.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-foreground">
            No study sets yet
          </h3>
          <p className="text-muted-foreground">
            {isModerator
              ? "Add study sets by pasting their ID above"
              : "The space owner will add study sets soon"}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {space.sets.map((gs) => (
            <Link key={gs.setId} href={`/sets/${gs.set.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-4">
                  <h3 className="font-semibold line-clamp-1 text-card-foreground">
                    {gs.set.title}
                  </h3>
                  {gs.set.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {gs.set.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                    <span>{gs.set._count.cards} cards</span>
                    <span>by {gs.set.user.name || "Anonymous"}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── Members Tab ─── */
function MembersTab({
  space,
  session,
}: {
  space: SpaceData
  session: { user: { id: string } } | null
}) {
  const roleLabel = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Owner"
      case "MODERATOR":
        return "Moderator"
      case "STUDENT":
        return "Student"
      default:
        return "Member"
    }
  }

  const roleColor = (role: string) => {
    switch (role) {
      case "OWNER":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "MODERATOR":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "STUDENT":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {space.members.map((member) => (
            <div
              key={member.userId}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  {member.role === "OWNER" ? (
                    <Crown className="h-5 w-5 text-yellow-500" />
                  ) : member.user.image ? (
                    <img
                      src={member.user.image}
                      alt=""
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-card-foreground">
                    {member.user.name || "Anonymous"}
                    {member.user.id === session?.user?.id && (
                      <span className="text-muted-foreground/70 ml-1">
                        (you)
                      </span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{member.user.email}</span>
                    {member.user.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-orange-500">
                        <Flame className="h-3 w-3" />
                        {member.user.streak}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span
                className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  roleColor(member.role)
                )}
              >
                {roleLabel(member.role)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Assignments Tab (Classroom only) ─── */
function AssignmentsTab({
  space,
  isModerator,
  spaceId,
}: {
  space: SpaceData
  isModerator: boolean
  spaceId: string
}) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [contentType, setContentType] = useState<"flashcardSet" | "quiz" | "dbq">("flashcardSet")
  const [contentId, setContentId] = useState("")

  const createAssignment = useMutation({
    mutationFn: async () => {
      const body: Record<string, string | null> = {
        title,
        description: description || null,
        dueDate: dueDate || null,
      }
      if (contentType === "flashcardSet" && contentId)
        body.flashcardSetId = contentId
      if (contentType === "quiz" && contentId) body.questionBankId = contentId
      if (contentType === "dbq" && contentId) body.dbqPromptId = contentId

      const res = await fetch(`/api/spaces/${spaceId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create assignment")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
      setShowForm(false)
      setTitle("")
      setDescription("")
      setDueDate("")
      setContentId("")
    },
  })

  const deleteAssignment = useMutation({
    mutationFn: async (assignmentId: string) => {
      const res = await fetch(`/api/spaces/${spaceId}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId }),
      })
      if (!res.ok) throw new Error("Failed to delete assignment")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
    },
  })

  const getContentLink = (a: SpaceAssignment) => {
    if (a.flashcardSet) return `/sets/${a.flashcardSet.id}`
    if (a.questionBank) return `/quizzes/${a.questionBank.id}`
    if (a.dbqPrompt) return `/dbq/${a.dbqPrompt.id}`
    return null
  }

  const getContentLabel = (a: SpaceAssignment) => {
    if (a.flashcardSet)
      return { label: a.flashcardSet.title, type: "Flashcard Set" }
    if (a.questionBank)
      return { label: a.questionBank.title, type: "Quiz" }
    if (a.dbqPrompt) return { label: a.dbqPrompt.title, type: "DBQ" }
    return null
  }

  return (
    <div>
      {isModerator && (
        <div className="mb-4">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>New Assignment</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (title.trim()) createAssignment.mutate()
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="assignTitle">Title</Label>
                    <Input
                      id="assignTitle"
                      placeholder="Chapter 5 Vocabulary Review"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignDesc">
                      Description (optional)
                    </Label>
                    <Input
                      id="assignDesc"
                      placeholder="Instructions..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="assignDue">Due Date (optional)</Label>
                    <Input
                      id="assignDue"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Linked Content (optional)</Label>
                    <div className="flex gap-2 mt-1 mb-2">
                      {(
                        [
                          ["flashcardSet", "Flashcard Set"],
                          ["quiz", "Quiz"],
                          ["dbq", "DBQ"],
                        ] as const
                      ).map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setContentType(val)}
                          className={cn(
                            "px-3 py-1 text-xs rounded-full border transition-colors",
                            contentType === val
                              ? "bg-primary text-primary-foreground border-primary"
                              : "border-border text-muted-foreground hover:border-foreground"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <Input
                      placeholder={`Paste ${contentType === "flashcardSet" ? "set" : contentType === "quiz" ? "quiz bank" : "DBQ prompt"} ID...`}
                      value={contentId}
                      onChange={(e) => setContentId(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={createAssignment.isPending}
                    >
                      Create Assignment
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  {createAssignment.isError && (
                    <p className="text-sm text-red-500">
                      {(createAssignment.error as Error).message}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {space.assignments.length === 0 ? (
        <Card className="p-8 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-foreground">
            No assignments yet
          </h3>
          <p className="text-muted-foreground">
            {isModerator
              ? "Create assignments to share study materials with your class"
              : "Your teacher will post assignments here"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {space.assignments.map((a) => {
            const content = getContentLabel(a)
            const link = getContentLink(a)
            return (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-card-foreground">
                        {a.title}
                      </h3>
                      {a.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {a.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <span>
                          Assigned by {a.assignedBy.name || "Teacher"}
                        </span>
                        {a.dueDate && (
                          <span className="flex items-center gap-1 text-orange-500">
                            <Calendar className="h-3 w-3" />
                            Due{" "}
                            {new Date(a.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {content && (
                          <span className="flex items-center gap-1">
                            {content.type === "Flashcard Set" && (
                              <BookOpen className="h-3 w-3" />
                            )}
                            {content.type === "Quiz" && (
                              <HelpCircle className="h-3 w-3" />
                            )}
                            {content.type === "DBQ" && (
                              <FileText className="h-3 w-3" />
                            )}
                            {content.type}: {content.label}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {link && (
                        <Link href={link}>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open
                          </Button>
                        </Link>
                      )}
                      {isModerator && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500"
                          onClick={() => {
                            if (
                              confirm(
                                "Delete this assignment?"
                              )
                            )
                              deleteAssignment.mutate(a.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Leaderboard Tab ─── */
function LeaderboardTab({
  space,
  session,
}: {
  space: SpaceData
  session: { user: { id: string } } | null
}) {
  const leaderboard = space.leaderboard || []

  if (leaderboard.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2 text-foreground">
          No streak data yet
        </h3>
        <p className="text-muted-foreground">
          Start studying to appear on the leaderboard!
        </p>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {leaderboard.map((entry, i) => {
            const isMe = entry.userId === session?.user?.id
            return (
              <div
                key={entry.userId}
                className={cn(
                  "p-4 flex items-center gap-4",
                  isMe && "bg-[var(--glass-fill)]"
                )}
              >
                {/* Rank */}
                <div className="w-8 text-center">
                  {i === 0 ? (
                    <span className="text-xl">🥇</span>
                  ) : i === 1 ? (
                    <span className="text-xl">🥈</span>
                  ) : i === 2 ? (
                    <span className="text-xl">🥉</span>
                  ) : (
                    <span className="text-sm font-semibold text-muted-foreground">
                      #{i + 1}
                    </span>
                  )}
                </div>
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  {entry.image ? (
                    <img
                      src={entry.image}
                      alt=""
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                {/* Info */}
                <div className="flex-1">
                  <p className="font-medium text-card-foreground">
                    {entry.name}
                    {isMe && (
                      <span className="text-muted-foreground/70 ml-1">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Best: {entry.longestStreak} day streak
                  </p>
                </div>
                {/* Streak */}
                <div className="flex items-center gap-1.5">
                  <Flame
                    className={cn(
                      "h-5 w-5",
                      entry.streak > 0
                        ? "text-orange-500"
                        : "text-muted-foreground/30"
                    )}
                  />
                  <span
                    className={cn(
                      "text-lg font-bold",
                      entry.streak > 0
                        ? "text-orange-500"
                        : "text-muted-foreground"
                    )}
                  >
                    {entry.streak}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

/* ─── Announcements Tab ─── */
function AnnouncementsTab({
  space,
  isModerator,
  spaceId,
}: {
  space: SpaceData
  isModerator: boolean
  spaceId: string
}) {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to post announcement")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
      setShowForm(false)
      setTitle("")
      setMessage("")
    },
  })

  return (
    <div>
      {isModerator && (
        <div className="mb-4">
          {!showForm ? (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Post Announcement
            </Button>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>New Announcement</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (title.trim() && message.trim())
                      createAnnouncement.mutate()
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="annTitle">Title</Label>
                    <Input
                      id="annTitle"
                      placeholder="Announcement title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="annMsg">Message</Label>
                    <textarea
                      id="annMsg"
                      placeholder="Write your announcement..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={createAnnouncement.isPending}
                    >
                      Post
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                  {createAnnouncement.isError && (
                    <p className="text-sm text-red-500">
                      {(createAnnouncement.error as Error).message}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {space.announcements.length === 0 ? (
        <Card className="p-8 text-center">
          <Megaphone className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2 text-foreground">
            No announcements yet
          </h3>
          <p className="text-muted-foreground">
            {isModerator
              ? "Post an announcement to share updates with your space"
              : "Announcements from the space admin will appear here"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {space.announcements.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                    {a.author.image ? (
                      <img
                        src={a.author.image}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <Megaphone className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground">
                      {a.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                      {a.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {a.author.name || "Admin"} ·{" "}
                      {new Date(a.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
