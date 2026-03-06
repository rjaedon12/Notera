"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// Redirect to the site-wide admin panel
export default function WhiteboardAdminRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/admin?tab=whiteboards")
  }, [router])
  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      <p className="text-muted-foreground">Redirecting to admin panel...</p>
    </div>
  )
}
