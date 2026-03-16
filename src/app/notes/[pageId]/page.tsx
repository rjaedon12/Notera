"use client"

import { useParams, useRouter } from "next/navigation"
import { useRef, useCallback, useState } from "react"
import { useNotePage, useNotePages, useUpdateNotePage } from "@/hooks/useNotePages"
import { useAutoSave } from "@/hooks/useAutoSave"
import { NoteHeader } from "@/components/notes/NoteHeader"
import { NoteEditor } from "@/components/notes/NoteEditor"
import { NoteBreadcrumb } from "@/components/notes/NoteBreadcrumb"
import type { useEditor } from "@tiptap/react"

export default function NoteEditorPage() {
  const params = useParams()
  const router = useRouter()
  const pageId = params.pageId as string
  const { data: page, isLoading, error } = useNotePage(pageId)
  const { data: pages = [] } = useNotePages()
  const updatePage = useUpdateNotePage()
  const { status, save, retrySave } = useAutoSave(pageId)
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)
  const [wordCount, setWordCount] = useState(0)

  const handleTitleChange = useCallback(
    (title: string) => {
      save({ title, content: editorRef.current?.getJSON() as Record<string, unknown> })
    },
    [save]
  )

  const handleContentUpdate = useCallback(
    (content: Record<string, unknown>) => {
      save({ content })
      // Update word count from editor
      if (editorRef.current) {
        const words = editorRef.current.storage.characterCount?.words?.() ?? 0
        setWordCount(words)
      }
    },
    [save]
  )

  const handleIconChange = useCallback(
    (icon: string | null) => {
      if (pageId) {
        updatePage.mutate({ pageId, icon })
      }
    },
    [pageId, updatePage]
  )

  const handleCoverChange = useCallback(
    (coverImage: string | null) => {
      if (pageId) {
        updatePage.mutate({ pageId, coverImage })
      }
    },
    [pageId, updatePage]
  )

  const handleFullWidthChange = useCallback(
    (isFullWidth: boolean) => {
      if (pageId) {
        updatePage.mutate({ pageId, isFullWidth })
      }
    },
    [pageId, updatePage]
  )

  const handleTitleEnter = useCallback(() => {
    editorRef.current?.commands.focus("start")
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div
          className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--muted-foreground)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    )
  }

  if (error || !page) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
          Page not found
        </p>
        <button
          onClick={() => router.push("/notes")}
          className="text-sm underline"
          style={{ color: "var(--primary)" }}
        >
          Go back to Notes
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full">
      <NoteBreadcrumb pageId={pageId} pages={pages} />
      <NoteHeader
        title={page.title}
        icon={page.icon}
        coverImage={page.coverImage}
        isFullWidth={page.isFullWidth}
        updatedAt={page.updatedAt}
        saveStatus={status}
        wordCount={wordCount}
        onTitleChange={handleTitleChange}
        onIconChange={handleIconChange}
        onCoverChange={handleCoverChange}
        onFullWidthChange={handleFullWidthChange}
        onTitleEnter={handleTitleEnter}
        onRetrySave={retrySave}
      />

      <NoteEditor
        content={page.content}
        pageId={pageId}
        isFullWidth={page.isFullWidth}
        onUpdate={handleContentUpdate}
        editorRef={editorRef}
      />
    </div>
  )
}
