"use client"

import { use, useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Users, BookOpen, Copy, Check, ArrowLeft, Plus, Crown, User,
  Trash2, LogOut, Flame, Trophy, ClipboardList, Megaphone,
  FileText, HelpCircle, Calendar, ExternalLink, Search, X,
  MoreVertical, Settings, UserPlus, Pencil, Palette, MessageCircle,
  Reply, Send, Image as ImageIcon, CheckCircle2,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ─── Types ─── */
interface SpaceComment {
  id: string; message: string; createdAt: string
  authorId: string
  author: { id: string; name: string | null; image: string | null }
  parentId: string | null
  replies?: SpaceComment[]
}

interface SpaceMemberData {
  userId: string
  role: string
  joinedAt: string
  user: {
    id: string; name: string | null; email: string
    image: string | null; streak: number; longestStreak: number; role: string
  }
}

interface SpaceSet {
  spaceId: string; setId: string
  set: {
    id: string; title: string; description: string | null
    _count: { cards: number }; user: { id: string; name: string | null }
  }
}

interface SpaceAssignment {
  id: string; title: string; description: string | null
  dueDate: string | null; assignedAt: string
  assignedBy: { id: string; name: string | null }
  flashcardSet: { id: string; title: string } | null
  questionBank: { id: string; title: string } | null
  dbqPrompt: { id: string; title: string } | null
}

interface SpaceAnnouncementData {
  id: string; title: string; message: string; createdAt: string
  author: { id: string; name: string | null; image: string | null }
  comments?: SpaceComment[]
}

interface LeaderboardEntry {
  userId: string; name: string; image: string | null
  streak: number; longestStreak: number; role: string
}

interface SpaceData {
  id: string; name: string; description: string | null
  type: "COLLABORATIVE" | "CLASSROOM"; inviteCode: string; createdAt: string
  bannerColor: string | null; bannerImage: string | null
  owner: { id: string; name: string | null; role: string }
  members: SpaceMemberData[]; sets: SpaceSet[]
  assignments: SpaceAssignment[]; announcements: SpaceAnnouncementData[]
  leaderboard: LeaderboardEntry[]
}

type TabKey = "stream" | "classwork" | "people" | "leaderboard"

/* ── Nice banner presets (name + gradient) ── */
const BANNER_PRESETS = [
  { name: "Ocean",    value: "linear-gradient(135deg, #0f172a 0%, #1e40af 50%, #3b82f6 100%)" },
  { name: "Forest",   value: "linear-gradient(135deg, #052e16 0%, #15803d 50%, #22c55e 100%)" },
  { name: "Violet",   value: "linear-gradient(135deg, #2e1065 0%, #7c3aed 50%, #a78bfa 100%)" },
  { name: "Ember",    value: "linear-gradient(135deg, #450a0a 0%, #dc2626 50%, #f87171 100%)" },
  { name: "Sunset",   value: "linear-gradient(135deg, #431407 0%, #ea580c 50%, #fdba74 100%)" },
  { name: "Teal",     value: "linear-gradient(135deg, #042f2e 0%, #0d9488 50%, #5eead4 100%)" },
  { name: "Orchid",   value: "linear-gradient(135deg, #3b0764 0%, #a855f7 50%, #d8b4fe 100%)" },
  { name: "Sky",      value: "linear-gradient(135deg, #0c4a6e 0%, #0284c7 50%, #38bdf8 100%)" },
  { name: "Slate",    value: "linear-gradient(135deg, #0f172a 0%, #475569 50%, #94a3b8 100%)" },
  { name: "Rose",     value: "linear-gradient(135deg, #4c0519 0%, #e11d48 50%, #fb7185 100%)" },
  { name: "Midnight", value: "linear-gradient(135deg, #020617 0%, #1e293b 50%, #334155 100%)" },
  { name: "Emerald",  value: "linear-gradient(135deg, #064e3b 0%, #059669 50%, #6ee7b7 100%)" },
]

function getDefaultBannerColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return BANNER_PRESETS[Math.abs(hash) % BANNER_PRESETS.length].value
}

interface PageProps { params: Promise<{ spaceId: string }> }

export default function SpaceDetailPage({ params }: PageProps) {
  const { spaceId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [copiedCode, setCopiedCode] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>("stream")
  const [joinCode, setJoinCode] = useState("")
  const [showMenu, setShowMenu] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const { data: space, isLoading, error } = useQuery<SpaceData>({
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

  const joinSpace = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/spaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed to join") }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
      setJoinCode("")
    },
  })

  const leaveSpace = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/leave`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to leave")
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["spaces"] }); router.push("/spaces") },
  })

  const deleteSpace = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["spaces"] }); router.push("/spaces") },
  })

  const copyInviteCode = async () => {
    if (space?.inviteCode) {
      await navigator.clipboard.writeText(space.inviteCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const currentMember = space?.members.find((m) => m.user.id === session?.user?.id)
  const isOwner = currentMember?.role === "OWNER"
  const isModerator = currentMember?.role === "MODERATOR" || currentMember?.role === "OWNER"
  const isClassroom = space?.type === "CLASSROOM"
  const bannerColor = space?.bannerColor || getDefaultBannerColor(spaceId)
  const bannerImage = space?.bannerImage

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-44 rounded-xl mb-6" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  /* ── Not a member ── */
  if (!space) {
    if (error?.message === "NOT_MEMBER") {
      return (
        <div className="max-w-md mx-auto px-4 py-12">
          <Link href="/spaces" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-7 w-7 text-muted-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground mb-2">Join this space</h1>
            <p className="text-sm text-muted-foreground mb-6">Enter the invite code to join.</p>
            <form onSubmit={(e) => { e.preventDefault(); if (joinCode.trim()) joinSpace.mutate(joinCode.trim()) }} className="space-y-3">
              <Input
                placeholder="Enter code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="font-mono tracking-wider text-center text-lg"
                autoFocus
              />
              <Button type="submit" className="w-full" disabled={joinSpace.isPending}>
                {joinSpace.isPending ? "Joining..." : "Join"}
              </Button>
            </form>
            {joinSpace.isError && <p className="text-sm text-red-500 mt-3">{(joinSpace.error as Error).message}</p>}
          </div>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h1 className="text-xl font-semibold text-foreground mb-2">Space not found</h1>
        <Link href="/spaces"><Button variant="outline">Back to Spaces</Button></Link>
      </div>
    )
  }

  /* ── Tab config ── */
  const tabs: { key: TabKey; label: string }[] = [
    { key: "stream", label: "Stream" },
    { key: "classwork", label: isClassroom ? "Classwork" : "Materials" },
    { key: "people", label: "People" },
    { key: "leaderboard", label: "Leaderboard" },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6">
      {/* Back link */}
      <Link href="/spaces" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Spaces
      </Link>

      {/* ── Banner ── */}
      <div
        className="relative rounded-xl overflow-hidden mb-1"
        style={{
          background: bannerImage ? undefined : bannerColor,
        }}
      >
        {bannerImage && (
          <img src={bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className={cn("relative px-6 pt-14 pb-5", bannerImage && "bg-black/40")}>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{space.name}</h1>
          {space.description && (
            <p className="text-white/70 text-sm mt-1">{space.description}</p>
          )}
        </div>
        {/* Actions in banner */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          {isOwner && (
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
            >
              {copiedCode
                ? <><Check className="h-3.5 w-3.5" /> Copied</>
                : <><Copy className="h-3.5 w-3.5" /> {space.inviteCode}</>}
            </button>
          )}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-white transition-all"
              style={{ background: "rgba(255,255,255,0.15)" }}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-52 rounded-lg border border-border bg-card shadow-xl z-40 py-1">
                  {isModerator && (
                    <button
                      onClick={() => { setShowMenu(false); setShowSettings(true) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Settings className="h-4 w-4" /> Class settings
                    </button>
                  )}
                  {isOwner ? (
                    <button
                      onClick={() => { setShowMenu(false); if (confirm("Delete this space and all its data?")) deleteSpace.mutate() }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-muted transition-colors"
                    >
                      <Trash2 className="h-4 w-4" /> Delete space
                    </button>
                  ) : (
                    <button
                      onClick={() => { setShowMenu(false); if (confirm("Leave this space?")) leaveSpace.mutate() }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Leave space
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Settings modal */}
      {showSettings && space && (
        <SpaceSettingsModal
          space={space}
          spaceId={spaceId}
          bannerColor={bannerColor}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Tabs ── */}
      <div className="flex gap-1 border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative",
              activeTab === tab.key
                ? "text-[var(--accent-color)]"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-[3px] rounded-t-full bg-[var(--accent-color)]" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === "stream" && (
        <StreamTab space={space} isModerator={isModerator} spaceId={spaceId} isClassroom={!!isClassroom} userId={session?.user?.id || ""} />
      )}
      {activeTab === "classwork" && (
        <ClassworkTab space={space} isModerator={isModerator} spaceId={spaceId} isClassroom={!!isClassroom} />
      )}
      {activeTab === "people" && (
        <PeopleTab space={space} session={session} isOwner={!!isOwner} />
      )}
      {activeTab === "leaderboard" && (
        <LeaderboardTab space={space} session={session} />
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Stream Tab — Google Classroom style: announcements + activity
   ═══════════════════════════════════════════════════════════════ */
function StreamTab({
  space, isModerator, spaceId, isClassroom, userId,
}: {
  space: SpaceData; isModerator: boolean; spaceId: string; isClassroom: boolean; userId: string
}) {
  const queryClient = useQueryClient()
  const [showAnnounce, setShowAnnounce] = useState(false)
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")

  const createAnnouncement = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/announcements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed") }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
      setShowAnnounce(false); setTitle(""); setMessage("")
    },
  })

  /* Merge announcements + assignments into a single timeline */
  const feed = [
    ...space.announcements.map((a) => ({
      type: "announcement" as const,
      id: a.id,
      title: a.title,
      body: a.message,
      author: a.author.name || "Admin",
      authorImage: a.author.image,
      date: new Date(a.createdAt),
      comments: a.comments || [],
    })),
    ...space.assignments.map((a) => ({
      type: "assignment" as const,
      id: a.id,
      title: a.title,
      body: a.description,
      author: a.assignedBy.name || "Teacher",
      authorImage: null as string | null,
      date: new Date(a.assignedAt),
      dueDate: a.dueDate ? new Date(a.dueDate) : null,
      link: a.flashcardSet ? `/sets/${a.flashcardSet.id}`
        : a.questionBank ? `/quizzes/${a.questionBank.id}`
          : a.dbqPrompt ? `/dbq/${a.dbqPrompt.id}` : null,
      contentLabel: a.flashcardSet?.title || a.questionBank?.title || a.dbqPrompt?.title || null,
      comments: [] as SpaceComment[],
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  /* Upcoming assignments */
  const upcoming = space.assignments
    .filter((a) => a.dueDate && new Date(a.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
      {/* Main feed */}
      <div className="space-y-4">
        {/* Announce something (moderators) */}
        {isModerator && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {!showAnnounce ? (
              <button
                onClick={() => setShowAnnounce(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Megaphone className="h-4 w-4" />
                </div>
                Announce something to your {isClassroom ? "class" : "space"}...
              </button>
            ) : (
              <div className="p-4 space-y-3">
                <Input
                  placeholder="Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
                <textarea
                  placeholder="Share with your class..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="ghost" size="sm" onClick={() => { setShowAnnounce(false); setTitle(""); setMessage("") }}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!title.trim() || !message.trim() || createAnnouncement.isPending}
                    onClick={() => createAnnouncement.mutate()}
                  >
                    Post
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feed items */}
        {feed.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {isModerator
                ? "Post an announcement or create an assignment to get started."
                : "Nothing here yet. Check back soon!"}
            </p>
          </div>
        ) : (
          feed.map((item) => (
            <FeedCard key={`${item.type}-${item.id}`} item={item} spaceId={spaceId} userId={userId} isModerator={isModerator} />
          ))
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Upcoming */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-sm text-foreground mb-3">Upcoming</h3>
          {upcoming.length === 0 ? (
            <p className="text-xs text-muted-foreground">No work due soon!</p>
          ) : (
            <div className="space-y-2">
              {upcoming.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-xs">
                  <ClipboardList className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-foreground">{a.title}</p>
                    <p className="text-muted-foreground">
                      Due {new Date(a.dueDate!).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="font-semibold text-sm text-foreground mb-3">Overview</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> Members</span>
              <span className="font-medium text-foreground">{space.members.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5" /> Study sets</span>
              <span className="font-medium text-foreground">{space.sets.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><ClipboardList className="h-3.5 w-3.5" /> Assignments</span>
              <span className="font-medium text-foreground">{space.assignments.length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   FeedCard — single announcement / assignment with comments
   ═══════════════════════════════════════════════════════════════ */
function FeedCard({
  item,
  spaceId,
  userId,
  isModerator,
}: {
  item: {
    type: "announcement" | "assignment"; id: string; title: string
    body: string | null; author: string; authorImage: string | null
    date: Date; comments: SpaceComment[]
    dueDate?: Date | null; link?: string | null; contentLabel?: string | null
  }
  spaceId: string; userId: string; isModerator: boolean
}) {
  const queryClient = useQueryClient()
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")

  const postComment = useMutation({
    mutationFn: async ({ message, parentId }: { message: string; parentId?: string }) => {
      const res = await fetch(`/api/spaces/${spaceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId: item.id, message, parentId }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed") }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
      setCommentText(""); setReplyText(""); setReplyTo(null)
    },
  })

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/spaces/${spaceId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["space", spaceId] }) },
  })

  const totalComments = item.comments.reduce((n, c) => n + 1 + (c.replies?.length || 0), 0)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Main content */}
      <div className="px-4 py-3 flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          item.type === "assignment" ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-muted"
        )}>
          {item.type === "assignment" ? (
            <ClipboardList className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          ) : item.authorImage ? (
            <img src={item.authorImage} alt="" className="w-8 h-8 rounded-full" />
          ) : (
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-medium text-sm text-foreground">{item.author}</span>
            <span className="text-xs text-muted-foreground">
              {item.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          </div>
          {item.type === "assignment" ? (
            <p className="text-sm text-muted-foreground mt-0.5">
              Posted a new assignment: <span className="font-medium text-foreground">{item.title}</span>
            </p>
          ) : (
            <>
              <p className="font-medium text-foreground text-sm mt-1">{item.title}</p>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{item.body}</p>
            </>
          )}
          {item.type === "assignment" && (
            <div className="flex flex-wrap items-center gap-3 mt-2">
              {"dueDate" in item && item.dueDate && (
                <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
                  <Calendar className="h-3 w-3" />
                  Due {item.dueDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              )}
              {"link" in item && item.link && (
                <Link
                  href={item.link}
                  className="flex items-center gap-1 text-xs font-medium hover:underline"
                  style={{ color: "var(--accent-color)" }}
                >
                  <ExternalLink className="h-3 w-3" /> Open
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comment toggle bar */}
      {item.type === "announcement" && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowComments(!showComments)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {totalComments > 0
              ? `${totalComments} comment${totalComments !== 1 ? "s" : ""}`
              : "Add a comment"}
          </button>
        </div>
      )}

      {/* Comments section */}
      {showComments && item.type === "announcement" && (
        <div className="border-t border-border px-4 py-3 space-y-3">
          {/* Comment list */}
          {item.comments.map((c) => (
            <div key={c.id} className="space-y-2">
              {/* Top-level comment */}
              <div className="flex items-start gap-2 group">
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                  {c.author.image ? (
                    <img src={c.author.image} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <User className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-medium text-foreground">{c.author.name || "Anonymous"}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.message}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => { setReplyTo(replyTo === c.id ? null : c.id); setReplyText("") }}
                      className="text-[10px] font-medium hover:underline"
                      style={{ color: "var(--accent-color)" }}
                    >
                      Reply
                    </button>
                    {(c.authorId === userId || isModerator) && (
                      <button
                        onClick={() => deleteComment.mutate(c.id)}
                        className="text-[10px] text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Replies */}
              {c.replies && c.replies.length > 0 && (
                <div className="ml-8 space-y-2 border-l-2 border-border pl-3">
                  {c.replies.map((r) => (
                    <div key={r.id} className="flex items-start gap-2 group">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5 overflow-hidden">
                        {r.author.image ? (
                          <img src={r.author.image} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                          <User className="h-2.5 w-2.5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-medium text-foreground">{r.author.name || "Anonymous"}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{r.message}</p>
                        {(r.authorId === userId || isModerator) && (
                          <button
                            onClick={() => deleteComment.mutate(r.id)}
                            className="text-[10px] text-red-500 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyTo === c.id && (
                <div className="ml-8 flex items-center gap-2">
                  <Input
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="h-8 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && replyText.trim()) {
                        postComment.mutate({ message: replyText.trim(), parentId: c.id })
                      }
                      if (e.key === "Escape") { setReplyTo(null); setReplyText("") }
                    }}
                  />
                  <Button
                    size="sm"
                    className="h-8 px-2"
                    disabled={!replyText.trim() || postComment.isPending}
                    onClick={() => postComment.mutate({ message: replyText.trim(), parentId: c.id })}
                  >
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          ))}

          {/* New top-level comment input */}
          <div className="flex items-center gap-2 pt-1">
            <Input
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === "Enter" && commentText.trim()) {
                  postComment.mutate({ message: commentText.trim() })
                }
              }}
            />
            <Button
              size="sm"
              className="h-8 px-2"
              disabled={!commentText.trim() || postComment.isPending}
              onClick={() => postComment.mutate({ message: commentText.trim() })}
            >
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Space Settings Modal — Rename, banner color, image
   ═══════════════════════════════════════════════════════════════ */
function SpaceSettingsModal({
  space, spaceId, bannerColor, onClose,
}: {
  space: SpaceData; spaceId: string; bannerColor: string; onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(space.name)
  const [description, setDescription] = useState(space.description || "")
  const [selectedBanner, setSelectedBanner] = useState(space.bannerColor || bannerColor)
  const [imageUrl, setImageUrl] = useState(space.bannerImage || "")
  const [useImage, setUseImage] = useState(!!space.bannerImage)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/spaces/${spaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || space.name,
          description: description.trim() || null,
          bannerColor: useImage ? space.bannerColor : selectedBanner,
          bannerImage: useImage && imageUrl.trim() ? imageUrl.trim() : null,
        }),
      })
      if (!res.ok) throw new Error("Failed to update")
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
      onClose()
    } catch {
      alert("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Class Settings</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Class name" />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>

            {/* Banner section */}
            <div>
              <label className="text-sm font-medium text-foreground mb-3 block">Banner</label>

              {/* Toggle: gradient or image */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUseImage(false)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all",
                    !useImage
                      ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)]"
                      : "border-border text-muted-foreground hover:border-foreground"
                  )}
                >
                  <Palette className="h-3 w-3" /> Color
                </button>
                <button
                  onClick={() => setUseImage(true)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all",
                    useImage
                      ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)]"
                      : "border-border text-muted-foreground hover:border-foreground"
                  )}
                >
                  <ImageIcon className="h-3 w-3" /> Image URL
                </button>
              </div>

              {!useImage ? (
                /* Banner color grid */
                <div className="grid grid-cols-4 gap-2">
                  {BANNER_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setSelectedBanner(preset.value)}
                      className={cn(
                        "relative rounded-lg h-16 transition-all border-2",
                        selectedBanner === preset.value
                          ? "border-[var(--accent-color)] ring-2 ring-[var(--accent-color)]/30 scale-105"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ background: preset.value }}
                    >
                      <span className="absolute bottom-1 left-0 right-0 text-[10px] font-medium text-white/80 text-center drop-shadow-sm">
                        {preset.name}
                      </span>
                      {selectedBanner === preset.value && (
                        <CheckCircle2 className="absolute top-1 right-1 h-4 w-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                /* Image URL input */
                <div className="space-y-3">
                  <Input
                    placeholder="Paste an image URL…"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                  />
                  {imageUrl.trim() && (
                    <div className="rounded-lg overflow-hidden border border-border h-32 relative">
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Save */}
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Classwork / Materials Tab — Sets + Assignments with search
   ═══════════════════════════════════════════════════════════════ */
function ClassworkTab({
  space, isModerator, spaceId, isClassroom,
}: {
  space: SpaceData; isModerator: boolean; spaceId: string; isClassroom: boolean
}) {
  const queryClient = useQueryClient()
  const [showAddSet, setShowAddSet] = useState(false)
  const [showCreateAssignment, setShowCreateAssignment] = useState(false)

  return (
    <div className="space-y-8">
      {/* Actions bar */}
      {isModerator && (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAddSet(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add study set
          </Button>
          {isClassroom && (
            <Button size="sm" onClick={() => setShowCreateAssignment(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Create assignment
            </Button>
          )}
        </div>
      )}

      {/* Add set (search-based) */}
      {showAddSet && (
        <AddSetPanel spaceId={spaceId} onClose={() => setShowAddSet(false)} />
      )}

      {/* Create assignment (search-based) */}
      {showCreateAssignment && (
        <CreateAssignmentPanel spaceId={spaceId} onClose={() => setShowCreateAssignment(false)} />
      )}

      {/* Assignments */}
      {isClassroom && space.assignments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
            Assignments
          </h2>
          <div className="space-y-2">
            {space.assignments.map((a) => (
              <AssignmentRow key={a.id} assignment={a} isModerator={isModerator} spaceId={spaceId} />
            ))}
          </div>
        </section>
      )}

      {/* Study Sets */}
      <section>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Study Sets
        </h2>
        {space.sets.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {isModerator ? "Add study sets for your members to use." : "No study sets have been added yet."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {space.sets.map((gs) => (
              <SetCard key={gs.setId} gs={gs} isModerator={isModerator} spaceId={spaceId} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ── Set Card with optional delete ── */
function SetCard({ gs, isModerator, spaceId }: { gs: SpaceSet; isModerator: boolean; spaceId: string }) {
  const queryClient = useQueryClient()
  const deleteSet = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/sets`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId: gs.setId }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["space", spaceId] }) },
  })

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow group relative">
      <Link href={`/sets/${gs.set.id}`} className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
          <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-foreground truncate">{gs.set.title}</h3>
          {gs.set.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{gs.set.description}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {gs.set._count.cards} cards · by {gs.set.user.name || "Anonymous"}
          </p>
        </div>
      </Link>
      {isModerator && (
        <button
          onClick={(e) => {
            e.preventDefault(); e.stopPropagation()
            if (confirm("Remove this study set from the space?")) deleteSet.mutate()
          }}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
          title="Remove set"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

/* ── Add Set Panel (search-based) ── */
function AddSetPanel({ spaceId, onClose }: { spaceId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [query, setQuery] = useState("")

  const { data: results = [] } = useQuery<{ id: string; title: string; subtitle: string }[]>({
    queryKey: ["content-search", spaceId, "flashcardSet", query],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/content-search?q=${encodeURIComponent(query)}&type=flashcardSet`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: query.length >= 2,
  })

  const addSet = useMutation({
    mutationFn: async (setId: string) => {
      const res = await fetch(`/api/spaces/${spaceId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId }),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed") }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
      onClose()
    },
  })

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-foreground">Add a study set</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for a study set..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
          autoFocus
        />
      </div>
      {results.length > 0 && (
        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => addSet.mutate(r.id)}
              disabled={addSet.isPending}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
            >
              <BookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
              </div>
            </button>
          ))}
        </div>
      )}
      {query.length >= 2 && results.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2 text-center py-2">No sets found for &ldquo;{query}&rdquo;</p>
      )}
      {addSet.isError && <p className="text-xs text-red-500 mt-2">{(addSet.error as Error).message}</p>}
    </div>
  )
}

/* ── Create Assignment Panel (with content search) ── */
function CreateAssignmentPanel({ spaceId, onClose }: { spaceId: string; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [contentType, setContentType] = useState<"flashcardSet" | "quiz" | "dbq">("flashcardSet")
  const [contentSearch, setContentSearch] = useState("")
  const [selectedContent, setSelectedContent] = useState<{ id: string; title: string } | null>(null)

  const { data: searchResults = [] } = useQuery<{ id: string; title: string; subtitle: string }[]>({
    queryKey: ["content-search", spaceId, contentType, contentSearch],
    queryFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/content-search?q=${encodeURIComponent(contentSearch)}&type=${contentType}`)
      if (!res.ok) return []
      return res.json()
    },
    enabled: contentSearch.length >= 2 && !selectedContent,
  })

  const createAssignment = useMutation({
    mutationFn: async () => {
      const body: Record<string, string | null> = {
        title,
        description: description || null,
        dueDate: dueDate || null,
      }
      if (selectedContent) {
        if (contentType === "flashcardSet") body.flashcardSetId = selectedContent.id
        if (contentType === "quiz") body.questionBankId = selectedContent.id
        if (contentType === "dbq") body.dbqPromptId = selectedContent.id
      }
      const res = await fetch(`/api/spaces/${spaceId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || "Failed") }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["space", spaceId] })
      onClose()
    },
  })

  const typeLabels = [
    { key: "flashcardSet" as const, label: "Study Set", icon: BookOpen },
    { key: "quiz" as const, label: "Quiz", icon: HelpCircle },
    { key: "dbq" as const, label: "DBQ", icon: FileText },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-5 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Create assignment</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (title.trim()) createAssignment.mutate() }}
        className="space-y-4"
      >
        <div>
          <Input placeholder="Assignment title" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus />
        </div>
        <div>
          <Input placeholder="Instructions (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Due date (optional)</label>
          <Input type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        {/* Content type selector */}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Link content (optional)</label>
          <div className="flex gap-1.5 mb-3">
            {typeLabels.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setContentType(key); setSelectedContent(null); setContentSearch("") }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-all",
                  contentType === key
                    ? "bg-[var(--accent-color)] text-white border-[var(--accent-color)]"
                    : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" /> {label}
              </button>
            ))}
          </div>

          {/* Selected content badge or search */}
          {selectedContent ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
              <span className="flex-1 truncate">{selectedContent.title}</span>
              <button
                type="button"
                onClick={() => { setSelectedContent(null); setContentSearch("") }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search for a ${contentType === "flashcardSet" ? "study set" : contentType === "quiz" ? "quiz" : "DBQ"}...`}
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                className="pl-9"
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-48 overflow-y-auto rounded-lg border border-border bg-card shadow-lg divide-y divide-border">
                  {searchResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { setSelectedContent({ id: r.id, title: r.title }); setContentSearch("") }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{r.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {contentSearch.length >= 2 && searchResults.length === 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-lg border border-border bg-card shadow-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">No results</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button type="submit" size="sm" disabled={!title.trim() || createAssignment.isPending}>
            Create
          </Button>
        </div>
        {createAssignment.isError && <p className="text-xs text-red-500">{(createAssignment.error as Error).message}</p>}
      </form>
    </div>
  )
}

/* ── Assignment Row ── */
function AssignmentRow({
  assignment: a, isModerator, spaceId,
}: {
  assignment: SpaceAssignment; isModerator: boolean; spaceId: string
}) {
  const queryClient = useQueryClient()
  const deleteAssignment = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/spaces/${spaceId}/assignments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: a.id }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["space", spaceId] }) },
  })

  const link = a.flashcardSet ? `/sets/${a.flashcardSet.id}`
    : a.questionBank ? `/quizzes/${a.questionBank.id}`
      : a.dbqPrompt ? `/dbq/${a.dbqPrompt.id}` : null
  const contentTitle = a.flashcardSet?.title || a.questionBank?.title || a.dbqPrompt?.title || null
  const contentIcon = a.flashcardSet ? BookOpen
    : a.questionBank ? HelpCircle
      : a.dbqPrompt ? FileText : ClipboardList

  const Icon = contentIcon

  return (
    <div className="rounded-xl border border-border bg-card hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-foreground">{a.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
            <span>{a.assignedBy.name || "Teacher"}</span>
            {a.dueDate && (
              <span className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
                <Calendar className="h-3 w-3" />
                Due {new Date(a.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </span>
            )}
            {contentTitle && <span className="truncate">{contentTitle}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {link && (
            <Link href={link}>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
          {isModerator && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-red-500 hover:text-red-600"
              onClick={() => { if (confirm("Delete this assignment?")) deleteAssignment.mutate() }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   People Tab
   ═══════════════════════════════════════════════════════════════ */
function PeopleTab({
  space, session, isOwner,
}: {
  space: SpaceData; session: { user: { id: string } } | null; isOwner: boolean
}) {
  const teachers = space.members.filter((m) => m.role === "OWNER" || m.role === "MODERATOR")
  const students = space.members.filter((m) => m.role === "MEMBER" || m.role === "STUDENT")

  return (
    <div className="space-y-6">
      {/* Teachers / Owners */}
      <section>
        <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
          <h2 className="text-base font-semibold text-foreground" style={{ color: "var(--accent-color)" }}>
            {space.type === "CLASSROOM" ? "Teachers" : "Owners"}
          </h2>
          <span className="text-xs text-muted-foreground">{teachers.length}</span>
        </div>
        <div className="space-y-1">
          {teachers.map((m) => (
            <PersonRow key={m.userId} member={m} isMe={m.user.id === session?.user?.id} />
          ))}
        </div>
      </section>

      {/* Students / Members */}
      {students.length > 0 && (
        <section>
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <h2 className="text-base font-semibold text-foreground" style={{ color: "var(--accent-color)" }}>
              {space.type === "CLASSROOM" ? "Students" : "Members"}
            </h2>
            <span className="text-xs text-muted-foreground">{students.length}</span>
          </div>
          <div className="space-y-1">
            {students.map((m) => (
              <PersonRow key={m.userId} member={m} isMe={m.user.id === session?.user?.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function PersonRow({ member: m, isMe }: { member: SpaceMemberData; isMe: boolean }) {
  return (
    <div className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg", isMe && "bg-muted/50")}>
      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
        {m.user.image ? (
          <img src={m.user.image} alt="" className="w-9 h-9 rounded-full" />
        ) : m.role === "OWNER" ? (
          <Crown className="h-4 w-4 text-yellow-500" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {m.user.name || "Anonymous"}
          {isMe && <span className="text-muted-foreground ml-1">(you)</span>}
        </p>
      </div>
      {m.user.streak > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-orange-500">
          <Flame className="h-3 w-3" /> {m.user.streak}
        </span>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   Leaderboard Tab
   ═══════════════════════════════════════════════════════════════ */
function LeaderboardTab({
  space, session,
}: {
  space: SpaceData; session: { user: { id: string } } | null
}) {
  const lb = space.leaderboard || []

  if (lb.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center">
        <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Start studying to appear on the leaderboard!</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {lb.map((entry, i) => {
        const isMe = entry.userId === session?.user?.id
        return (
          <div
            key={entry.userId}
            className={cn(
              "flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0",
              isMe && "bg-muted/50"
            )}
          >
            <div className="w-8 text-center shrink-0">
              {i === 0 ? <span className="text-lg">🥇</span>
                : i === 1 ? <span className="text-lg">🥈</span>
                  : i === 2 ? <span className="text-lg">🥉</span>
                    : <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>}
            </div>
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 overflow-hidden">
              {entry.image ? (
                <img src={entry.image} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {entry.name}
                {isMe && <span className="text-muted-foreground ml-1">(you)</span>}
              </p>
              <p className="text-xs text-muted-foreground">Best: {entry.longestStreak} days</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Flame className={cn("h-5 w-5", entry.streak > 0 ? "text-orange-500" : "text-muted-foreground/30")} />
              <span className={cn("text-lg font-bold", entry.streak > 0 ? "text-orange-500" : "text-muted-foreground")}>
                {entry.streak}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
