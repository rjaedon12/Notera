"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useNotePages, useCreateNotePage } from "@/hooks/useNotePages"
import { FileText, Plus } from "lucide-react"

export default function NotesIndexPage() {
  const router = useRouter()
  const { data: pages = [], isLoading } = useNotePages()
  const createPage = useCreateNotePage()

  useEffect(() => { document.title = "Notera | Notes" }, [])

  // If there are pages, redirect to the first one
  useEffect(() => {
    if (!isLoading && pages.length > 0) {
      // Find first root-level page
      const rootPages = pages
        .filter((p) => !p.parentId && !p.isArchived)
        .sort((a, b) => a.sortOrder - b.sortOrder)
      if (rootPages.length > 0) {
        router.replace(`/notes/${rootPages[0].id}`)
      }
    }
  }, [pages, isLoading, router])

  const handleNewPage = async () => {
    const result = await createPage.mutateAsync({})
    router.push(`/notes/${result.id}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--muted-foreground)", borderTopColor: "transparent" }} />
      </div>
    )
  }

  // Empty state
  if (pages.length === 0 || pages.every((p) => p.isArchived)) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <FileText className="h-16 w-16" style={{ color: "var(--muted-foreground)", opacity: 0.3 }} />
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--foreground)" }}>
            No notes yet
          </h2>
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
            Create your first page to get started
          </p>
        </div>
        <button
          onClick={handleNewPage}
          disabled={createPage.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: "var(--primary)",
            color: "var(--primary-foreground)",
          }}
        >
          <Plus className="h-4 w-4" />
          New page
        </button>
      </div>
    )
  }

  return null
}
