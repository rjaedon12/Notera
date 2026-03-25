"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function TeacherHomeworkLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isTeacherOrAdmin =
    session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.replace("/login")
    } else if (!isTeacherOrAdmin) {
      router.replace("/")
    }
  }, [session, status, isTeacherOrAdmin, router])

  if (status === "loading" || !isTeacherOrAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--primary)" }} />
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Verifying access…
        </p>
      </div>
    )
  }

  return <>{children}</>
}
