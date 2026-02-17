import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { StudySet, Card, Folder, Progress } from "@/types"

// Study Sets
export function useStudySets() {
  return useQuery<StudySet[]>({
    queryKey: ["studySets"],
    queryFn: async () => {
      const res = await fetch("/api/sets")
      if (!res.ok) throw new Error("Failed to fetch study sets")
      return res.json()
    },
  })
}

export function useStudySet(id: string) {
  return useQuery<StudySet>({
    queryKey: ["studySet", id],
    queryFn: async () => {
      const res = await fetch(`/api/sets/${id}`)
      if (!res.ok) throw new Error("Failed to fetch study set")
      return res.json()
    },
    enabled: !!id,
  })
}

export function usePublicSets(search?: string) {
  return useQuery<StudySet[]>({
    queryKey: ["publicSets", search],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/sets/public?${params}`)
      if (!res.ok) throw new Error("Failed to fetch public sets")
      return res.json()
    },
  })
}

export function useCreateStudySet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; isPublic?: boolean; cards?: { term: string; definition: string }[] }) => {
      const res = await fetch("/api/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create study set")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studySets"] })
    },
  })
}

export function useUpdateStudySet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; title?: string; description?: string; isPublic?: boolean }) => {
      const res = await fetch(`/api/sets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update study set")
      return res.json()
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["studySet", id] })
      queryClient.invalidateQueries({ queryKey: ["studySets"] })
    },
  })
}

export function useDeleteStudySet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sets/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete study set")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studySets"] })
    },
  })
}

export function useDuplicateStudySet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/sets/${id}/duplicate`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to duplicate study set")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studySets"] })
    },
  })
}

// Cards
export function useCreateCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { setId: string; term: string; definition: string; orderIndex: number }) => {
      const res = await fetch(`/api/sets/${data.setId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create card")
      return res.json()
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: ["studySet", setId] })
    },
  })
}

export function useUpdateCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cardId, setId, ...data }: { cardId: string; setId: string; term?: string; definition?: string; orderIndex?: number }) => {
      const res = await fetch(`/api/cards/${cardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update card")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["studySet", data.setId] })
    },
  })
}

export function useDeleteCard() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cardId, setId }: { cardId: string; setId: string }) => {
      const res = await fetch(`/api/cards/${cardId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete card")
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: ["studySet", setId] })
    },
  })
}

export function useReorderCards() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ setId, cardIds }: { setId: string; cardIds: string[] }) => {
      const res = await fetch(`/api/sets/${setId}/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIds }),
      })
      if (!res.ok) throw new Error("Failed to reorder cards")
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: ["studySet", setId] })
    },
  })
}

// Progress
export function useUpdateProgress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { cardId: string; correct: boolean }) => {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update progress")
      return res.json()
    },
  })
}

export function useCardProgress(setId: string) {
  return useQuery<Record<string, Progress>>({
    queryKey: ["progress", setId],
    queryFn: async () => {
      const res = await fetch(`/api/sets/${setId}/progress`)
      if (!res.ok) throw new Error("Failed to fetch progress")
      return res.json()
    },
    enabled: !!setId,
  })
}

// Starred
export function useToggleStar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cardId, starred }: { cardId: string; starred: boolean }) => {
      const res = await fetch(`/api/cards/${cardId}/star`, {
        method: starred ? "POST" : "DELETE",
      })
      if (!res.ok) throw new Error("Failed to toggle star")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studySet"] })
      queryClient.invalidateQueries({ queryKey: ["starredCards"] })
    },
  })
}

export function useStarredCards() {
  return useQuery<Card[]>({
    queryKey: ["starredCards"],
    queryFn: async () => {
      const res = await fetch("/api/starred")
      if (!res.ok) throw new Error("Failed to fetch starred cards")
      return res.json()
    },
  })
}

// Starred Sets (star study sets so they appear at top)
export function useStarredSets() {
  return useQuery<string[]>({
    queryKey: ["starredSets"],
    queryFn: async () => {
      const res = await fetch("/api/starred-sets")
      if (!res.ok) throw new Error("Failed to fetch starred sets")
      return res.json()
    },
  })
}

export function useToggleSetStar() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ setId, starred }: { setId: string; starred: boolean }) => {
      const res = await fetch(`/api/sets/${setId}/star`, {
        method: starred ? "POST" : "DELETE",
      })
      if (!res.ok) throw new Error("Failed to toggle set star")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["starredSets"] })
      queryClient.invalidateQueries({ queryKey: ["publicSets"] })
      queryClient.invalidateQueries({ queryKey: ["studySets"] })
    },
  })
}

// Folders
export function useFolders() {
  return useQuery<Folder[]>({
    queryKey: ["folders"],
    queryFn: async () => {
      const res = await fetch("/api/folders")
      if (!res.ok) throw new Error("Failed to fetch folders")
      return res.json()
    },
  })
}

export function useFolder(id: string) {
  return useQuery<Folder>({
    queryKey: ["folder", id],
    queryFn: async () => {
      const res = await fetch(`/api/folders/${id}`)
      if (!res.ok) throw new Error("Failed to fetch folder")
      return res.json()
    },
    enabled: !!id,
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      const res = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create folder")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}

export function useAddSetToFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ folderId, setId }: { folderId: string; setId: string }) => {
      const res = await fetch(`/api/folders/${folderId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setId }),
      })
      if (!res.ok) throw new Error("Failed to add set to folder")
    },
    onSuccess: (_, { folderId }) => {
      queryClient.invalidateQueries({ queryKey: ["folder", folderId] })
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}

// Saved Sets
export function useSavedSets() {
  return useQuery<StudySet[]>({
    queryKey: ["savedSets"],
    queryFn: async () => {
      const res = await fetch("/api/saved")
      if (!res.ok) throw new Error("Failed to fetch saved sets")
      return res.json()
    },
  })
}

export function useSaveSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ setId, save }: { setId: string; save: boolean }) => {
      const res = await fetch(`/api/sets/${setId}/save`, {
        method: save ? "POST" : "DELETE",
      })
      if (!res.ok) throw new Error("Failed to save/unsave set")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedSets"] })
      queryClient.invalidateQueries({ queryKey: ["studySet"] })
    },
  })
}

// Share Links
export function useCreateShareLink() {
  return useMutation({
    mutationFn: async (setId: string) => {
      const res = await fetch(`/api/sets/${setId}/share`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to create share link")
      return res.json()
    },
  })
}

// Sessions
export function useSaveSession() {
  return useMutation({
    mutationFn: async (data: { setId: string; mode: string; stats: Record<string, unknown> }) => {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to save session")
      return res.json()
    },
  })
}

// Match Scores
export function useMatchScores(setId: string) {
  return useQuery({
    queryKey: ["matchScores", setId],
    queryFn: async () => {
      const res = await fetch(`/api/sets/${setId}/match-scores`)
      if (!res.ok) throw new Error("Failed to fetch match scores")
      return res.json()
    },
    enabled: !!setId,
  })
}

export function useSaveMatchScore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ setId, time }: { setId: string; time: number }) => {
      const res = await fetch(`/api/sets/${setId}/match-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time }),
      })
      if (!res.ok) throw new Error("Failed to save match score")
      return res.json()
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: ["matchScores", setId] })
    },
  })
}

// Timed Scores
export function useTimedScores(setId: string) {
  return useQuery({
    queryKey: ["timedScores", setId],
    queryFn: async () => {
      const res = await fetch(`/api/sets/${setId}/timed-scores`)
      if (!res.ok) throw new Error("Failed to fetch timed scores")
      return res.json()
    },
    enabled: !!setId,
  })
}

export function useSaveTimedScore() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ setId, score, mode }: { setId: string; score: number; mode: string }) => {
      const res = await fetch(`/api/sets/${setId}/timed-scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, mode }),
      })
      if (!res.ok) throw new Error("Failed to save timed score")
      return res.json()
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: ["timedScores", setId] })
    },
  })
}
