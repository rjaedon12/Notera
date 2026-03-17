"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MessageSquare, Trash2, Pin } from "lucide-react"
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
}

interface ForumPostDetail {
  id: string
  title: string
  body: string
  pinned: boolean
  createdAt: string
  user: ForumUser
  replies: ForumReply[]
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
        body: JSON.stringify({ content: replyContent.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to post reply")
      }

      toast.success("Reply posted")
      setReplyContent("")
      fetchPost()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
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
  const canDelete = isAuthor || isAdmin

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
        className="rounded-xl border p-6 mb-8"
        style={{
          background: "var(--card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
              style={{
                background: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
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
            {post.pinned && (
              <Pin className="h-4 w-4" style={{ color: "var(--accent-color)" }} />
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--muted-foreground)" }}
                title="Delete post"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <h1
          className="text-xl font-heading font-bold mb-3"
          style={{ color: "var(--foreground)" }}
        >
          {post.title}
        </h1>

        <div
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: "var(--foreground)", opacity: 0.85 }}
        >
          {post.body}
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
          {post.replies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-xl border p-4"
              style={{
                background: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{
                    background: "var(--accent)",
                    color: "var(--accent-foreground)",
                  }}
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
                  <span>·</span>
                  <span>{formatDate(reply.createdAt)}</span>
                </div>
              </div>
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap pl-9"
                style={{ color: "var(--foreground)", opacity: 0.85 }}
              >
                {reply.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Reply form */}
      {session ? (
        <form
          onSubmit={handleReply}
          className="rounded-xl border p-4"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Write a reply..."
            rows={3}
            maxLength={5000}
            className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none border mb-3"
            style={{
              background: "var(--input)",
              color: "var(--foreground)",
              borderColor: "var(--border)",
            }}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {replyContent.length}/5,000
            </span>
            <button
              type="submit"
              disabled={submitting || !replyContent.trim()}
              className="rounded-full px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {submitting ? "Posting..." : "Reply"}
            </button>
          </div>
        </form>
      ) : (
        <div
          className="rounded-xl p-4 text-sm text-center"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          <Link href="/login" className="font-medium underline" style={{ color: "var(--foreground)" }}>
            Sign in
          </Link>{" "}
          to reply.
        </div>
      )}
    </div>
  )
}
