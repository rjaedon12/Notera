import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// ─── Types ───────────────────────────────────────────────

export interface DBQPrompt {
  id: string
  title: string
  question: string
  subject: string
  era: string
  createdAt: string
  _count?: { documents: number; essays: number }
  userEssayCount?: number
}

export interface DBQDocument {
  id: string
  docNumber: number
  title: string
  source: string
  content: string
  imageUrl: string | null
  imageAlt: string | null
  orderIndex: number
  promptId: string
}

export interface DBQPromptWithDocs extends DBQPrompt {
  documents: DBQDocument[]
}

export interface DBQEssay {
  id: string
  content: string
  highlights: string | null
  wordCount: number
  submittedAt: string
  userId: string
  promptId: string
  prompt?: {
    id: string
    title: string
    question: string
    documents?: DBQDocument[]
  }
}

// ─── Hooks ───────────────────────────────────────────────

export function useDBQPrompts() {
  return useQuery<DBQPrompt[]>({
    queryKey: ["dbqPrompts"],
    queryFn: async () => {
      const res = await fetch("/api/dbq/prompts")
      if (!res.ok) throw new Error("Failed to fetch DBQ prompts")
      return res.json()
    },
  })
}

export function useDBQPrompt(promptId: string) {
  return useQuery<DBQPromptWithDocs>({
    queryKey: ["dbqPrompt", promptId],
    queryFn: async () => {
      const res = await fetch(`/api/dbq/prompts/${promptId}`)
      if (!res.ok) throw new Error("Failed to fetch DBQ prompt")
      return res.json()
    },
    enabled: !!promptId,
  })
}

export function useDBQEssays(promptId?: string) {
  return useQuery<DBQEssay[]>({
    queryKey: ["dbqEssays", promptId],
    queryFn: async () => {
      const url = promptId
        ? `/api/dbq/essays?promptId=${promptId}`
        : "/api/dbq/essays"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Failed to fetch DBQ essays")
      return res.json()
    },
  })
}

export function useDBQEssay(essayId: string) {
  return useQuery<DBQEssay>({
    queryKey: ["dbqEssay", essayId],
    queryFn: async () => {
      const res = await fetch(`/api/dbq/essays/${essayId}`)
      if (!res.ok) throw new Error("Failed to fetch DBQ essay")
      return res.json()
    },
    enabled: !!essayId,
  })
}

export function useSubmitDBQEssay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      promptId: string
      content: string
      highlights?: Array<{
        docId: string
        text: string
        color: string
        startOffset: number
        endOffset: number
      }>
    }) => {
      const res = await fetch("/api/dbq/essays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        throw new Error(err.error || "Failed to submit essay")
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["dbqEssays", variables.promptId] })
      queryClient.invalidateQueries({ queryKey: ["dbqEssays", undefined] })
      queryClient.invalidateQueries({ queryKey: ["dbqPrompts"] })
    },
  })
}
