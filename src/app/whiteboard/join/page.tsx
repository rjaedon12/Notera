"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { joinBoardViaShareLink } from "@/lib/whiteboard/actions"
import toast from "react-hot-toast"

function JoinBoardContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "error">("loading")

  useEffect(() => {
    const token = searchParams.get("token")
    if (!token) {
      setStatus("error")
      return
    }

    async function join() {
      try {
        const boardId = await joinBoardViaShareLink(token!)
        toast.success("Joined board!")
        router.replace(`/whiteboard/${boardId}`)
      } catch (err) {
        setStatus("error")
        toast.error("Invalid or expired share link")
      }
    }
    join()
  }, [searchParams, router])

  return (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
      {status === "loading" ? (
        <div className="animate-pulse text-zinc-400">Joining board...</div>
      ) : (
        <div className="text-center">
          <p className="text-zinc-500 dark:text-zinc-400 mb-4">
            This share link is invalid or has expired.
          </p>
          <button
            onClick={() => router.push("/whiteboard")}
            className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
          >
            Go to Whiteboard
          </button>
        </div>
      )}
    </div>
  )
}

export default function JoinBoardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-4rem)]"><div className="animate-pulse text-zinc-400">Loading...</div></div>}>
      <JoinBoardContent />
    </Suspense>
  )
}
