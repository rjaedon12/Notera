"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
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
} from "lucide-react"

interface Space {
  id: string
  name: string
  description: string | null
  type: "COLLABORATIVE" | "CLASSROOM"
  inviteCode: string
  createdAt: string
  _count: { members: number; sets: number; assignments: number }
  members: { role: string; user: { id: string; name: string | null } }[]
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
  const [desc, setDesc] = useState("")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState("")
  const [showJoin, setShowJoin] = useState(false)

  const isTeacher = session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"

  const { data: spaces = [], isLoading } = useQuery<Space[]>({
    queryKey: ["spaces"],
    queryFn: async () => {
      const res = await fetch("/api/spaces")
      if (!res.ok) throw new Error("Failed to fetch spaces")
      return res.json()
    },
    enabled: !!session?.user,
  })

  const createSpace = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc || null }),
      })
      if (!res.ok) throw new Error("Failed to create space")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spaces"] })
      setShowCreate(false)
      setName("")
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
            <Plus className="h-4 w-4 mr-1.5" /> Join
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            {isTeacher ? "Create class" : "Create space"}
          </Button>
        </div>
      </div>

      {/* Join inline dialog */}
      {showJoin && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-foreground">Join with code</h2>
            <button onClick={() => setShowJoin(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (joinCode.trim()) joinSpace.mutate(joinCode.trim()) }}
            className="flex gap-3"
          >
            <Input
              placeholder="Enter class code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="flex-1 font-mono tracking-wider text-center text-lg"
              maxLength={8}
              autoFocus
            />
            <Button type="submit" disabled={joinSpace.isPending || !joinCode.trim()}>Join</Button>
          </form>
          {joinSpace.isError && (
            <p className="text-sm text-red-500 mt-2">{(joinSpace.error as Error).message}</p>
          )}
        </div>
      )}

      {/* Create inline dialog */}
      {showCreate && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              {isTeacher ? "Create a class" : "Create a space"}
            </h2>
            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form
            onSubmit={(e) => { e.preventDefault(); if (name.trim()) createSpace.mutate() }}
            className="space-y-3"
          >
            <Input
              placeholder={isTeacher ? "Class name (e.g. AP US History — Period 3)" : "Space name"}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <Input
              placeholder="Description (optional)"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
            <div className="flex gap-2 pt-1">
              <Button type="submit" disabled={createSpace.isPending}>
                {isTeacher ? "Create class" : "Create space"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : spaces.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
            {isTeacher
              ? <GraduationCap className="h-10 w-10 text-muted-foreground" />
              : <Users className="h-10 w-10 text-muted-foreground" />}
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">
            {isTeacher ? "No classes yet" : "No spaces yet"}
          </h2>
          <p className="text-muted-foreground max-w-sm mb-6">
            {isTeacher
              ? "Create your first class to start assigning study materials to your students."
              : "Create a study space or join one with a code from your teacher or classmate."}
          </p>
          <div className="flex gap-3">
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> {isTeacher ? "Create class" : "Create space"}
            </Button>
            <Button variant="outline" onClick={() => setShowJoin(true)}>Join with code</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
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

/* ─── Google Classroom–style Card ─── */
function SpaceCard({
  space, userId, copiedCode, onCopy,
}: {
  space: Space
  userId: string
  copiedCode: string | null
  onCopy: (code: string, e: React.MouseEvent) => void
}) {
  const color = getCardColor(space.id)
  const isOwner = space.members.some((m) => m.user.id === userId && m.role === "OWNER")
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
