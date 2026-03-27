"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Lock, Loader2, Eye, EyeOff } from "lucide-react"
import toast from "react-hot-toast"

export default function ChangePasswordPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (!session?.user) {
    router.replace("/login")
    return null
  }

  if (!session.user.forcePasswordChange) {
    router.replace("/")
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed")

      toast.success("Password changed successfully!")
      await update()
      router.replace("/")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div
        className="w-full max-w-md rounded-2xl border p-8"
        style={{ borderColor: "var(--glass-border)", background: "var(--card-bg)" }}
      >
        <div className="flex items-center gap-3 mb-6">
          <div
            className="p-3 rounded-xl"
            style={{ background: "rgba(234, 179, 8, 0.15)" }}
          >
            <Lock className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-heading text-foreground">
              Password Change Required
            </h1>
            <p
              className="text-sm"
              style={{ color: "var(--muted-foreground)" }}
            >
              An administrator has reset your password. Please set a new one.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full rounded-xl border px-4 py-2.5 pr-10 text-sm bg-transparent text-foreground placeholder:text-[var(--muted-foreground)]"
                style={{ borderColor: "var(--glass-border)" }}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--muted-foreground)" }}
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter your new password"
              className="w-full rounded-xl border px-4 py-2.5 text-sm bg-transparent text-foreground placeholder:text-[var(--muted-foreground)]"
              style={{ borderColor: "var(--glass-border)" }}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #1D4ED8, #60A5FA)" }}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Set New Password
          </button>
        </form>
      </div>
    </div>
  )
}
