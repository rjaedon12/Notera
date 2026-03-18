"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MessageSquare, Trash2, Pin, ThumbsUp, ThumbsDown, Reply, CornerDownRight } from "lucide-react"
import toast from "react-hot-toast"

interface ForumUser {
  id: string
  name: string | null
  image: string | null
}

interface ForumReply {
  id: string
  body: string
  createdAt: string
  user: ForumUser
  parentReplyId: string | null
}

interface ReactionData {
  likes: number
  dislikes: number
  userReaction: "LIKE" | "DISLIKE" | null
}

interface ForumPostDetail {
  id: string
  title: string
  body: string
  pinned: boolean
  createdAt: string
  user: ForumUser
  replies: ForumReply[]
  reactions: ReactionData
}

export default function ForumPostPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string

  const [post, setPost] = useState<ForumPostDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyContent, setReplyContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null)
  const [reactingPost, setReactingPost] = useState(false)

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/forum/${postId}`)
      if (!res.ok) {
        if (res.status === 404) {
          toast.error("Post not found")
          router.push("/forum")
          return
        }
        throw new Error("Failed to fetch")
      }
      const data = await res.json()
      setPost(data)
    } catch {
      toast.error("Failed to load post")
    } finally {
      setLoading(false)
    }
  }, [postId, router])

  useEffect(() => {
    if (postId) fetchPost()
  }, [postId, fetchPost])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyContent.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/forum/${postId}/replies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyContent.trim(),
          parentReplyId: replyingTo?.id || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to post reply")
      }

      toast.success("Reply posted")
      setReplyContent("")
      setReplyingTo(null)
      fetchPost()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!confirm("Delete this post? This cannot be undone.")) return
    try {
      const res = await fetch(`/api/forum/${postId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Post deleted")
      router.push("/forum")
    } catch {
      toast.error("Failed to delete post")
    }
  }

  const handleDeleteReply = async (replyId: string) => {
    if (!confirm("Delete this reply?")) return
    try {
      const res = await fetch(`/api/forum/${postId}/replies/${replyId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete reply")
      toast.success("Reply deleted")
      fetchPost()
    } catch {
      toast.error("Failed to delete reply")
    }
  }

  const handleReaction = async (type: "LIKE" | "DISLIKE") => {
    if (!session?.user) {
      toast.error("Sign in to react")
      return
    }
    if (reactingPost) return
    setReactingPost(true)
    try {
      const res = await fetch(`/api/forum/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      })
      if (!res.ok) throw new Error("Failed to react")
      const data = await res.json()
      if (post) {
        setPost({ ...post, reactions: data })
      }
    } catch {
      toast.error("Failed to react")
    } finally {
      setReactingPost(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })
  }

  const getInitial = (name: string | null) => {
    return (name || "?").charAt(0).toUpperCase()
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 rounded w-24" style={{ background: "var(--muted)" }} />
          <div className="h-6 rounded w-2/3" style={{ background: "var(--muted)" }} />
          <div className="h-4 rounded w-full" style={{ background: "var(--muted)" }} />
          <div className="h-4 rounded w-5/6" style={{ background: "var(--muted)" }} />
        </div>
      </div>
    )
  }

  if (!post) return null

  const isAuthor = session?.user?.id === post.user.id
  const isAdmin = session?.user?.role === "ADMIN"
  const canDeletePost = isAuthor || isAdmin

  // Build nested reply tree
  const topLevelReplies = post.replies.filter((r) => !r.parentReplyId)
  const childMap = new Map<string, ForumReply[]>()
  post.replies.forEach((r) => {
    if (r.parentReplyId) {
      const existing = childMap.get(r.parentReplyId) || []
      existing.push(r)
      childMap.set(r.parentReplyId, existing)
    }
  })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href="/forum"
        className="inline-flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors"
        style={{ color: "var(--muted-foreground)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Forum
      </Link>

      {/* Post */}
      <article
        className="rounded-xl border p-6 mb-6"
        style={{ background: "var(--card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              {post.user.image ? (
                <img src={post.user.image} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                getInitial(post.user.name)
              )}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {post.user.name || "Anonymous"}
              </p>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.pinned && <Pin className="h-4 w-4" style={{ color: "var(--accent-color)" }} />}
            {canDeletePost && (
              <button onClick={handleDeletePost} className="p-1.5 rounded-lg transition-colors" style={{ color: "var(--muted-foreground)" }} title="Delete post">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <h1 className="text-xl font-heading font-bold mb-3" style={{ color: "var(--foreground)" }}>
          {post.title}
        </h1>

        <div className="text-sm leading-relaxed whitespace-pre-wrap mb-4" style={{ color: "var(--foreground)", opacity: 0.85 }}>
          {post.body}
        </div>

        {/* Like / Dislike buttons */}
        <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => handleReaction("LIKE")}
            disabled={reactingPost}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: post.reactions.userReaction === "LIKE" ? "var(--primary)" : "var(--muted)",
              color: post.reactions.userReaction === "LIKE" ? "var(--primary-foreground)" : "var(--muted-foreground)",
            }}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{post.reactions.likes}</span>
          </button>
          <button
            onClick={() => handleReaction("DISLIKE")}
            disabled={reactingPost}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: post.reactions.userReaction === "DISLIKE" ? "#ef4444" : "var(--muted)",
              color: post.reactions.userReaction === "DISLIKE" ? "#fff" : "var(--muted-foreground)",
            }}
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{post.reactions.dislikes}</span>
          </button>
        </div>
      </article>

      {/* Replies section */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold flex items-center gap-2 mb-4" style={{ color: "var(--foreground)" }}>
          <MessageSquare className="h-4 w-4" />
          {post.replies.length} {post.replies.length === 1 ? "Reply" : "Replies"}
        </h2>

        {post.replies.length === 0 && (
          <p className="text-sm py-6 text-center" style={{ color: "var(--muted-foreground)" }}>
            No replies yet. Be the first to respond.
          </p>
        )}

        <div className="space-y-3">
          {topLevelReplies.map((reply) => (
            <ReplyCard
              key={reply.id}
              reply={reply}
              childMap={childMap}
              session={session}
              isAdmin={isAdmin}
              onDelete={handleDeleteReply}
              onReplyTo={(id, name) => setReplyingTo({ id, name: name || "Anonymous" })}
              depth={0}
            />
          ))}
        </div>
      </div>

      {/* Reply form */}
      {session ? (
        <form
          onSubmit={handleReply}
          className="rounded-xl border p-4"
          style={{ background: "var(--card)", borderColor: "var(--border)" }}
        >
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <CornerDownRight className="h-3.5 w-3.5" style={{ color: "var(--muted-foreground)" }} />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                Replying to <span className="font-medium" style={{ color: "var(--foreground)" }}>{replyingTo.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-xs underline"
                style={{ color: "var(--muted-foreground)" }}
              >
                Cancel
              </button>
            </div>
          )}
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Write a reply..."}
            rows={3}
            maxLength={5000}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none border mb-3"
            style={{ background: "var(--input)", color: "var(--foreground)", borderColor: "var(--border)" }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {replyContent.length}/5,000
            </span>
            <button
              type="submit"
              disabled={submitting || !replyContent.trim()}
              className="rounded-full px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {submitting ? "Posting..." : "Reply"}
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl p-4 text-sm text-center" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
          <Link href="/login" className="font-medium underline" style={{ color: "var(--foreground)" }}>
            Sign in
          </Link>{" "}
          to reply.
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Reply Card (supports nesting)
// ============================================================================

interface ReplyCardProps {
  reply: {
    id: string
    body: string
    createdAt: string
    user: { id: string; name: string | null; image: string | null }
    parentReplyId: string | null
  }
  childMap: Map<string, { id: string; body: string; createdAt: string; user: { id: string; name: string | null; image: string | null }; parentReplyId: string | null }[]>
  session: ReturnType<typeof useSession>["data"]
  isAdmin: boolean
  onDelete: (id: string) => void
  onReplyTo: (id: string, name: string | null) => void
  depth: number
}

function ReplyCard({ reply, childMap, session, isAdmin, onDelete, onReplyTo, depth }: ReplyCardProps) {
  const canDelete = session?.user?.id === reply.user.id || isAdmin
  const children = childMap.get(reply.id) || []

  const getInitial = (name: string | null) => (name || "?").charAt(0).toUpperCase()
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
  }

  return (
    <div style={{ marginLeft: depth > 0 ? "1.5rem" : 0 }}>
      <div
        className="rounded-xl border p-4"
        style={{ background: "var(--card)", borderColor: depth > 0 ? "var(--border)" : "var(--border)" }}
      >
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
              style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
            >
              {reply.user.image ? (
                <img src={reply.user.image} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                getInitial(reply.user.name)
              )}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <span className="font-medium" style={{ color: "var(--foreground)" }}>
                {reply.user.name || "Anonymous"}
              </span>
              <span>&middot;</span>
              <span>{formatDate(reply.createdAt)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {session && depth < 2 && (
              <button
                onClick={() => onReplyTo(reply.id, reply.user.name)}
                className="p-1 rounded transition-colors"
                style={{ color: "var(--muted-foreground)" }}
                title="Reply to this comment"
              >
                <Reply className="h-3.5 w-3.5" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => onDelete(reply.id)}
                className="p-1 rounded transition-colors"
                style={{ color: "var(--muted-foreground)" }}
                title="Delete reply"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap pl-9" style={{ color: "var(--foreground)", opacity: 0.85 }}>
          {reply.body}
        </p>
      </div>
      {children.length > 0 && (
        <div className="mt-2 space-y-2">
          {children.map((child) => (
            <ReplyCard
              key={child.id}
              reply={child}
              childMap={childMap}
              session={session}
              isAdmin={isAdmin}
              onDelete={onDelete}
              onReplyTo={onReplyTo}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
