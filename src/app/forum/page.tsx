"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Plus, MessageSquare, Pin, ChevronLeft, ChevronRight } from "lucide-react"
import toast from "react-hot-toast"

interface ForumUser {
  id: string
  name: string | null
  image: string | null
}

interface ForumPost {
  id: string
  title: string
  body: string
  pinned: boolean
  createdAt: string
  user: ForumUser
  _count: { replies: number }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function ForumPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewPost, setShowNewPost] = useState(false)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [page, setPage] = useState(1)

  const fetchPosts = useCallback(async (p: number) => {
    try {
      const res = await fetch(`/api/forum?page=${p}&limit=20`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setPosts(data.posts)
      setPagination(data.pagination)
    } catch {
      toast.error("Failed to load posts")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts(page)
  }, [page, fetchPosts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/forum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to create post")
      }

      toast.success("Post created")
      setTitle("")
      setContent("")
      setShowNewPost(false)
      setPage(1)
      fetchPosts(1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHrs = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHrs < 24) return `${diffHrs}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getInitial = (name: string | null) => {
    return (name || "?").charAt(0).toUpperCase()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-heading font-bold" style={{ color: "var(--foreground)" }}>
            Forum
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Discuss, ask questions, and share with the community.
          </p>
        </div>
        {session && (
          <button
            onClick={() => setShowNewPost(!showNewPost)}
            className="inline-flex items-center gap-2 rounded-full text-sm font-medium px-4 py-2 transition-colors"
            style={{
              background: "var(--primary)",
              color: "var(--primary-foreground)",
            }}
          >
            <Plus className="h-4 w-4" />
            New Post
          </button>
        )}
      </div>

      {/* Not signed in notice */}
      {!session && (
        <div
          className="rounded-xl p-4 mb-6 text-sm"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          <Link href="/login" className="font-medium underline" style={{ color: "var(--foreground)" }}>
            Sign in
          </Link>{" "}
          to create posts and reply.
        </div>
      )}

      {/* New Post Form */}
      {showNewPost && session && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border p-5 mb-6 space-y-4"
          style={{
            background: "var(--card)",
            borderColor: "var(--border)",
          }}
        >
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              maxLength={200}
              className="w-full rounded-lg px-3 py-2.5 text-sm font-medium outline-none transition-colors border"
              style={{
                background: "var(--input)",
                color: "var(--foreground)",
                borderColor: "var(--border)",
              }}
            />
          </div>
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your post..."
              rows={5}
              maxLength={10000}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors resize-none border"
              style={{
                background: "var(--input)",
                color: "var(--foreground)",
                borderColor: "var(--border)",
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {content.length}/10,000
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowNewPost(false); setTitle(""); setContent("") }}
                className="rounded-full px-4 py-2 text-sm font-medium transition-colors"
                style={{ color: "var(--muted-foreground)" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim() || !content.trim()}
                className="rounded-full px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
                style={{
                  background: "var(--primary)",
                  color: "var(--primary-foreground)",
                }}
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl border p-4 animate-pulse"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <div className="h-4 rounded w-2/3 mb-3" style={{ background: "var(--muted)" }} />
              <div className="h-3 rounded w-1/3" style={{ background: "var(--muted)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Posts list */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-16">
          <MessageSquare className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
          <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
            No posts yet. Be the first to start a discussion.
          </p>
        </div>
      )}

      {!loading && posts.length > 0 && (
        <div className="space-y-2">
          {posts.map((post) => (
            <Link key={post.id} href={`/forum/${post.id}`}>
              <div
                className="rounded-xl border p-4 transition-colors cursor-pointer group"
                style={{
                  background: "var(--card)",
                  borderColor: "var(--border)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--glass-fill-hover)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--card)"
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                    style={{
                      background: "var(--accent)",
                      color: "var(--accent-foreground)",
                    }}
                  >
                    {post.user.image ? (
                      <img src={post.user.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      getInitial(post.user.name)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.pinned && (
                        <Pin className="h-3 w-3 flex-shrink-0" style={{ color: "var(--accent-color)" }} />
                      )}
                      <h3
                        className="text-sm font-semibold truncate"
                        style={{ color: "var(--foreground)" }}
                      >
                        {post.title}
                      </h3>
                    </div>
                    <p
                      className="text-xs line-clamp-1 mb-2"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {post.body}
                    </p>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span>{post.user.name || "Anonymous"}</span>
                      <span>·</span>
                      <span>{formatDate(post.createdAt)}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post._count.replies}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-30"
            style={{ color: "var(--foreground)" }}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-30"
            style={{ color: "var(--foreground)" }}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
