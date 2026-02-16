"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

// /sets redirects to /library since that's where all user sets are displayed
export default function SetsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/library")
  }, [router])

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <p className="text-muted-foreground">Redirecting to library...</p>
    </div>
  )
}
