"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useDebouncedCallback } from "use-debounce"
import { useUpdateNotePage } from "./useNotePages"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

export function useAutoSave(
  pageId: string | undefined,
  {
    debounceMs = 800,
  }: { debounceMs?: number } = {}
) {
  const updatePage = useUpdateNotePage()
  const [status, setStatus] = useState<SaveStatus>("idle")
  const lastSavedRef = useRef<string>("")

  const save = useCallback(
    async (data: { title?: string; content?: Record<string, unknown> }) => {
      if (!pageId) return

      // Skip if nothing changed
      const serialized = JSON.stringify(data)
      if (serialized === lastSavedRef.current) return

      setStatus("saving")
      try {
        await updatePage.mutateAsync({ pageId, ...data })
        lastSavedRef.current = serialized
        setStatus("saved")
      } catch {
        setStatus("error")
      }
    },
    [pageId, updatePage]
  )

  const debouncedSave = useDebouncedCallback(save, debounceMs)

  // Reset status after showing "Saved" for 2 seconds
  useEffect(() => {
    if (status === "saved") {
      const timer = setTimeout(() => setStatus("idle"), 2000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const retrySave = useCallback(() => {
    if (lastSavedRef.current) {
      save(JSON.parse(lastSavedRef.current))
    }
  }, [save])

  return {
    status,
    save: debouncedSave,
    saveImmediate: save,
    retrySave,
  }
}
