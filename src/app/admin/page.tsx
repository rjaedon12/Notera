"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Shield, Loader2 } from "lucide-react"

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "loading") return

    if (session?.user?.role === "ADMIN") {
      router.replace("/admin/dashboard")
    } else if (status === "authenticated") {
      // Logged in but not admin
      router.replace("/")
    } else {
      // Not logged in at all
      router.replace("/login")
    }
  }, [session, status, router])

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl"
        style={{ background: "linear-gradient(135deg, #1D4ED8, #60A5FA)" }}>
        <Shield className="h-8 w-8 text-white" />
      </div>
      <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
        Verifying admin access…
      </p>
    </div>
  )
}
