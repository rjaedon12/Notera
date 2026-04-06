"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import {
  Users,
  Plus,
  BookOpen,
  Copy,
  Check,
  GraduationCap,
  ClipboardList,
  ChevronRight,
  X,
  Hash,
  AlignLeft,
  LogIn,
  Sparkles,
  Globe,
} from "lucide-react"

interface Space {
  id: string
  name: string
  description: string | null
  type: "COLLABORATIVE" | "CLASSROOM"
  inviteCode: string
  bannerColor: string | null
  bannerImage: string | null
  hubSlug?: string | null
  isPublic?: boolean
  createdAt: string
  _count: { members: number; sets: number; assignments: number }
  members: { role?: string; userId?: string; user?: { id: string; name: string | null } }[]
  owner: { id: string; name: string | null; role: string }
}

/* ── Color palette per space card (Google Classroom style) ── */
const CARD_COLORS = [
  { bg: "linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)", text: "#fff" },
  { bg: "linear-gradient(135deg, #064e3b 0%, #059669 100%)", text: "#fff" },
  { bg: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)", text: "#fff" },
  { bg: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)", text: "#fff" },
  { bg: "linear-gradient(135deg, #713f12 0%, #d97706 100%)", text: "#fff" },
  { bg: "linear-gradient(135deg, #134e4a 0%, #0d9488 100%)", text: "#fff" },
  { bg: "linear-gradient(135deg, #581c87 0%, #a855f7 100%)", text: "#fff" },
  { bg: "linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)", text: "#fff" },
]

function getCardColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash)
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length]
}

export default function SpacesPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState("")
  const [section, setSection] = useState("")
  const [desc, setDesc] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [showJoin, setShowJoin] = useState(false)

  const isTeacher = session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"

  const { data, isLoading } = useQuery<{ spaces: Space[]; hubs: Space[] }>({
    queryKey: ["spaces"],
    queryFn: async () => {
      const res = await fetch("/api/spaces")
      if (!res.ok) throw new Error("Failed to fetch spaces")
      return res.json()
    },
    enabled: !!session?.user,
  })

  const spaces = data?.spaces ?? []
  const hubs = data?.hubs ?? []

  const createSpace = useMutation({
    mutationFn: async () => {
      const fullName = isTeacher && section.trim() ? `${name.trim()} — ${section.trim()}` : name.trim()
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, description: desc || null }),
      })
      if (!res.ok) throw new Error("Failed to create space")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
      setShowCreate(false)
      setName("")
      setSection("")
      setDesc("")
    },
  })

  const joinSpace = useMutation({
    mutationFn: async (code: string) => {
      const res = await fetch("/api/spaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: code }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to join")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
      setJoinCode("")
      setShowJoin(false)
    },
  })

  const joinHub = useMutation({
    mutationFn: async (spaceId: string) => {
      const res = await fetch("/api/spaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to join")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
    },
  })

  const copyCode = async (code: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">Spaces</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Sign in to create or join study spaces and classrooms.
        </p>
        <Link href="/login"><Button size="lg">Sign In</Button></Link>
      </div>
    )
  }

  const classrooms = spaces.filter((s) => s.type === "CLASSROOM")
  const collaborative = spaces.filter((s) => s.type === "COLLABORATIVE")

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {isTeacher ? "Your classes" : "Your spaces"}
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowJoin(true)}>
            <LogIn className="h-4 w-4 mr-1.5" /> Join
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {isTeacher ? "Create class" : "Create space"}
          </Button>
        </div>
      </div>

      {/* Modal dialogs */}
      <JoinModal
        open={showJoin}
        onClose={() => { setShowJoin(false); setJoinCode("") }}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        onJoin={() => { if (joinCode.trim()) joinSpace.mutate(joinCode.trim()) }}
        isPending={joinSpace.isPending}
        error={joinSpace.isError ? (joinSpace.error as Error).message : null}
      />
      <CreateModal
        open={showCreate}
        isTeacher={isTeacher}
        onClose={() => { setShowCreate(false); setName(""); setSection(""); setDesc("") }}
        name={name}
        setName={setName}
        section={section}
        setSection={setSection}
        desc={desc}
        setDesc={setDesc}
        onCreate={() => { if (name.trim()) createSpace.mutate() }}
        isPending={createSpace.isPending}
        error={createSpace.isError ? (createSpace.error as Error).message : null}
      />

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : spaces.length === 0 && hubs.length === 0 ? (
        <EmptyState isTeacher={isTeacher} onCreate={() => setShowCreate(true)} onJoin={() => setShowJoin(true)} />
      ) : (
        <div className="space-y-8">
          {/* Featured Public Hubs */}
          {hubs.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                <Globe className="h-3.5 w-3.5" /> Featured Hubs
              </h2>
              <div className="space-y-3">
                {hubs.map((hub) => {
                  const isMember = hub.members.length > 0
                  return (
                    <div
                      key={hub.id}
                      className="rounded-xl border border-border overflow-hidden bg-card"
                    >
                      <div
                        className="relative px-6 py-5 flex items-center justify-between"
                        style={{ background: hub.bannerColor || "linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)" }}
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
                            🌍
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg text-white truncate">{hub.name}</h3>
                            {hub.description && (
                              <p className="text-sm text-white/70 truncate mt-0.5">{hub.description}</p>
                            )}
                            <p className="text-xs text-white/50 mt-1">
                              {hub._count.members} member{hub._count.members !== 1 ? "s" : ""} · {hub._count.sets} set{hub._count.sets !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4 shrink-0">
                          {isMember ? (
                            <Link href={`/spaces/${hub.id}`}>
                              <Button size="sm" variant="secondary" className="gap-1.5 font-medium">
                                Open <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          ) : (
                            <Button
                              size="sm"
                              className="gap-1.5 font-medium bg-white text-gray-900 hover:bg-white/90"
                              onClick={() => joinHub.mutate(hub.id)}
                              disabled={joinHub.isPending}
                            >
                              <LogIn className="h-3.5 w-3.5" />
                              {joinHub.isPending ? "Joining…" : "Join"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {classrooms.length > 0 && (
            <section>
              {collaborative.length > 0 && (
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5" /> Classes
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classrooms.map((s) => (
                  <SpaceCard key={s.id} space={s} userId={session.user.id} copiedCode={copiedCode} onCopy={copyCode} />
                ))}
              </div>
            </section>
          )}
          {collaborative.length > 0 && (
            <section>
              {classrooms.length > 0 && (
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" /> Study Spaces
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {collaborative.map((s) => (
                  <SpaceCard key={s.id} space={s} userId={session.user.id} copiedCode={copiedCode} onCopy={copyCode} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

/* ─── Modal backdrop wrapper ─── */
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handleKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKey)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
        {children}
      </div>
    </div>
  )
}

/* ─── Join Modal ─── */
function JoinModal({
  open, onClose, joinCode, setJoinCode, onJoin, isPending, error,
}: {
  open: boolean; onClose: () => void; joinCode: string
  setJoinCode: (v: string) => void; onJoin: () => void
  isPending: boolean; error: string | null
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "var(--accent-color)", opacity: 0.9 }}>
              <Hash className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Join with class code</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Ask your teacher for the 6–8 character code</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-2 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-4">
          <form onSubmit={(e) => { e.preventDefault(); onJoin() }}>
            {/* Code input */}
            <div className="rounded-xl border-2 border-border focus-within:border-[var(--accent-color)] transition-colors overflow-hidden">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="e.g. ABC12345"
                maxLength={8}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="w-full px-5 py-4 text-2xl font-mono tracking-[0.35em] text-center bg-transparent text-foreground placeholder:text-muted-foreground/40 focus:outline-none uppercase"
              />
            </div>

            {error && <p className="text-sm text-red-500 text-center pt-1">{error}</p>}

            <div className="flex gap-2 mt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="flex-1" disabled={isPending || !joinCode.trim()}>
                {isPending ? "Joining…" : "Join class"}
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            The class code is case-insensitive and provided by your teacher.
          </p>
        </div>
      </div>
    </Modal>
  )
}

/* ─── Create Modal ─── */
function CreateModal({
  open, isTeacher, onClose, name, setName, section, setSection, desc, setDesc, onCreate, isPending, error,
}: {
  open: boolean; isTeacher: boolean; onClose: () => void
  name: string; setName: (v: string) => void
  section: string; setSection: (v: string) => void
  desc: string; setDesc: (v: string) => void
  onCreate: () => void; isPending: boolean; error: string | null
}) {
  return (
    <Modal open={open} onClose={onClose}>
      <div className="rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* Decorative top strip */}
        <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, var(--accent-color), #7c3aed)" }} />

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, var(--accent-color) 0%, #7c3aed 100%)" }}>
              {isTeacher ? <GraduationCap className="h-5 w-5 text-white" /> : <Sparkles className="h-5 w-5 text-white" />}
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {isTeacher ? "Create a class" : "Create a space"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isTeacher
                  ? "Set up a classroom to manage students and assignments"
                  : "Start a collaborative space for studying together"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-2 mt-0.5">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onCreate() }}
          className="px-6 pb-6 pt-4 space-y-4"
        >
          {/* Name field */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isTeacher ? "Class name" : "Space name"} <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder={isTeacher ? "e.g. AP US History" : "e.g. Study Group"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="h-10"
            />
          </div>

          {/* Section (teacher only) */}
          {isTeacher && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Section / Period</label>
              <Input
                placeholder="e.g. Period 3 · Fall 2026"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="h-10"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
              <span className="ml-1 text-muted-foreground/60 normal-case tracking-normal font-normal">(optional)</span>
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <textarea
                placeholder={isTeacher ? "Let students know what this class covers…" : "What will you study here?"}
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={2}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] resize-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isPending || !name.trim()}
            >
              {isPending
                ? (isTeacher ? "Creating…" : "Creating…")
                : (isTeacher ? "Create class" : "Create space")}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  )
}

/* ─── Empty state ─── */
function EmptyState({ isTeacher, onCreate, onJoin }: { isTeacher: boolean; onCreate: () => void; onJoin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
        {isTeacher
          ? <GraduationCap className="h-10 w-10 text-muted-foreground" />
          : <Users className="h-10 w-10 text-muted-foreground" />}
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {isTeacher ? "No classes yet" : "No spaces yet"}
      </h2>
      <p className="text-muted-foreground max-w-sm mb-6 text-sm">
        {isTeacher
          ? "Create your first class to start assigning study materials and tracking your students."
          : "Create a study space or join one with a code from your teacher or classmate."}
      </p>
      <div className="flex gap-3">
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-1.5" /> {isTeacher ? "Create class" : "Create space"}
        </Button>
        <Button variant="outline" onClick={onJoin}>
          <LogIn className="h-4 w-4 mr-1.5" /> Join with code
        </Button>
      </div>
    </div>
  )
}

/* ─── Google Classroom–style Card ─── */
function SpaceCard({
  space, userId, copiedCode, onCopy,
}: {
  space: Space
  userId: string
  copiedCode: string | null
  onCopy: (code: string, e: React.MouseEvent) => void
}) {
  const fallbackColor = getCardColor(space.id)
  // Use the user-selected banner color if available, otherwise fall back to hash-based color
  const color = space.bannerColor
    ? { bg: space.bannerColor, text: "#fff" }
    : fallbackColor
  const isOwner = space.members.some((m) => m.user?.id === userId && m.role === "OWNER")
  const ownerName = space.owner.name || "Unknown"

  return (
    <Link href={`/spaces/${space.id}`} className="block group">
      <div className="rounded-xl border border-border overflow-hidden bg-card transition-shadow hover:shadow-lg">
        {/* Colored banner */}
        <div className="relative px-5 pt-5 pb-4" style={{ background: color.bg }}>
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:underline" style={{ color: color.text }}>
                {space.name}
              </h3>
              {space.description && (
                <p className="text-sm truncate mt-0.5 opacity-80" style={{ color: color.text }}>
                  {space.description}
                </p>
              )}
              <p className="text-xs mt-2 opacity-70" style={{ color: color.text }}>
                {ownerName}
              </p>
            </div>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ml-3"
              style={{ background: "rgba(255,255,255,0.2)", color: color.text }}
            >
              {ownerName.charAt(0).toUpperCase()}
            </div>
          </div>
          {isOwner && space.inviteCode && (
            <button
              onClick={(e) => onCopy(space.inviteCode, e)}
              className="absolute bottom-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono transition-all"
              style={{ background: "rgba(255,255,255,0.15)", color: color.text, backdropFilter: "blur(4px)" }}
            >
              {copiedCode === space.inviteCode
                ? <><Check className="h-3 w-3" /> Copied</>
                : <><Copy className="h-3 w-3" /> {space.inviteCode}</>}
            </button>
          )}
        </div>
        {/* Stats footer */}
        <div className="px-5 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {space._count.members}</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {space._count.sets}</span>
            {space.type === "CLASSROOM" && space._count.assignments > 0 && (
              <span className="flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" /> {space._count.assignments}</span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </Link>
  )
}
