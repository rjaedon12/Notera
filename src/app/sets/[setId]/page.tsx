"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useStudySet, useSaveSet, useDuplicateStudySet, useDeleteStudySet, useCreateShareLink } from "@/hooks/useStudy"
import { ModeTiles } from "@/components/study/mode-tiles"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Bookmark, 
  Share2, 
  Copy, 
  Trash2, 
  Edit, 
  MoreVertical,
  Globe,
  Lock,
  BookmarkCheck,
  Star,
  MessageSquare,
  Send,
  Download,
} from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface PageProps {
  params: Promise<{ setId: string }>
}

export default function SetPage({ params }: PageProps) {
  const { setId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const { data: set, isLoading, error } = useStudySet(setId)
  const saveSet = useSaveSet()
  const duplicateSet = useDuplicateStudySet()
  const deleteSet = useDeleteStudySet()
  const createShareLink = useCreateShareLink()
  const [showMenu, setShowMenu] = useState(false)
  const [showAllCards, setShowAllCards] = useState(false)

  const isOwner = session?.user?.id === set?.userId || session?.user?.id === set?.user?.id

  const handleSave = async () => {
    if (!session) {
      router.push("/login")
      return
    }
    try {
      await saveSet.mutateAsync({ setId, save: true })
      toast.success("Set saved to your library")
    } catch {
      toast.error("Failed to save set")
    }
  }

  const handleDuplicate = async () => {
    if (!session) {
      router.push("/login")
      return
    }
    try {
      const newSet = await duplicateSet.mutateAsync(setId)
      toast.success("Set duplicated")
      router.push(`/sets/${newSet.id}`)
    } catch {
      toast.error("Failed to duplicate set")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this set?")) return
    try {
      await deleteSet.mutateAsync(setId)
      toast.success("Set deleted")
      router.push("/library")
    } catch {
      toast.error("Failed to delete set")
    }
  }

  const handleShare = async () => {
    try {
      const result = await createShareLink.mutateAsync(setId)
      await navigator.clipboard.writeText(result.url)
      toast.success("Link copied to clipboard!")
    } catch {
      toast.error("Failed to create share link")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !set) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Set not found</h1>
        <p className="text-muted-foreground mb-4">This study set doesn't exist or you don't have access to it.</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{set.title}</h1>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              {set.isPublic ? (
                <>
                  <Globe className="h-4 w-4" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Private
                </>
              )}
            </span>
            <span>•</span>
            <span>{set.cards?.length || 0} cards</span>
            {set.owner && (
              <>
                <span>•</span>
                <span>by {set.owner.name || "Anonymous"}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOwner && (
            <Button variant="outline" onClick={handleSave}>
              <Bookmark className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <div className="relative">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-2 z-10">
                {isOwner && (
                  <Link
                    href={`/sets/${setId}/edit`}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setShowMenu(false)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                )}
                <button
                  onClick={() => { handleDuplicate(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                {isOwner && (
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {set.description && (
        <p className="text-muted-foreground mb-6">{set.description}</p>
      )}

      {/* Mode Tiles */}
      <ModeTiles setId={setId} className="mb-8" />

      {/* Cards Preview */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Terms in this set ({set.cards?.length || 0})
        </h2>
        <div className="space-y-3">
          {set.cards?.slice(0, showAllCards ? undefined : 10).map((card) => (
            <Card key={card.id}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Term</p>
                    <p className="font-medium">{card.term}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Definition</p>
                    <p>{card.definition}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {set.cards && set.cards.length > 10 && !showAllCards && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={() => setShowAllCards(true)}
              >
                Load remaining {set.cards.length - 10} cards
              </Button>
            </div>
          )}
          {showAllCards && set.cards && set.cards.length > 10 && (
            <div className="text-center py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllCards(false)}
              >
                Show fewer cards
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Export */}
      <div className="mt-6 flex gap-2">
        <Button variant="outline" size="sm" onClick={() => window.open(`/api/sets/${setId}/export?format=csv`, "_blank")}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.open(`/api/sets/${setId}/export?format=json`, "_blank")}>
          <Download className="h-4 w-4 mr-2" /> Export JSON
        </Button>
      </div>

      {/* Ratings & Comments */}
      <SetRatingsComments setId={setId} session={session} />
    </div>
  )
}

// Ratings & Comments sub-component
function SetRatingsComments({ setId, session }: { setId: string; session: ReturnType<typeof useSession>["data"] }) {
  const queryClient = useQueryClient()
  const [comment, setComment] = useState("")
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)

  const { data: ratingsData } = useQuery<{ average: number; count: number; userRating: number | null }>({
    queryKey: ["ratings", setId],
    queryFn: async () => {
      const res = await fetch(`/api/sets/${setId}/ratings`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const { data: comments = [] } = useQuery<{ id: string; text: string; createdAt: string; user: { name: string; id: string } }[]>({
    queryKey: ["comments", setId],
    queryFn: async () => {
      const res = await fetch(`/api/sets/${setId}/comments`)
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
  })

  const rateMutation = useMutation({
    mutationFn: async (score: number) => {
      const res = await fetch(`/api/sets/${setId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", setId] })
      toast.success("Rating submitted!")
    },
  })

  const commentMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch(`/api/sets/${setId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", setId] })
      setComment("")
      toast.success("Comment added!")
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const res = await fetch(`/api/sets/${setId}/comments?commentId=${commentId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", setId] })
    },
  })

  return (
    <div className="mt-10 space-y-6">
      {/* Rating */}
      <div className="rounded-xl border p-6" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" /> Rate this set
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => { setUserRating(n); rateMutation.mutate(n) }}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className="h-7 w-7"
                  fill={(hoverRating || userRating || ratingsData?.userRating || 0) >= n ? "#f59e0b" : "none"}
                  stroke={(hoverRating || userRating || ratingsData?.userRating || 0) >= n ? "#f59e0b" : "var(--muted-foreground)"}
                />
              </button>
            ))}
          </div>
          <span className="text-sm text-muted-foreground">
            {ratingsData?.average?.toFixed(1) ?? "–"} avg · {ratingsData?.count ?? 0} rating{ratingsData?.count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Comments */}
      <div className="rounded-xl border p-6" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> Comments ({comments.length})
        </h3>

        {session && (
          <form
            className="flex gap-2 mb-4"
            onSubmit={(e) => { e.preventDefault(); if (comment.trim()) commentMutation.mutate(comment.trim()) }}
          >
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg px-4 py-2 text-sm border bg-transparent text-foreground placeholder:text-muted-foreground"
              style={{ borderColor: "var(--glass-border)" }}
            />
            <Button size="sm" type="submit" disabled={!comment.trim() || commentMutation.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3 group">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: "var(--primary)" }}>
                {(c.user.name || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{c.user.name || "Anonymous"}</span>
                  <span className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-foreground mt-0.5">{c.text}</p>
              </div>
              {session?.user?.id === c.user.id && (
                <button
                  onClick={() => deleteCommentMutation.mutate(c.id)}
                  className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-destructive"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  )
}
