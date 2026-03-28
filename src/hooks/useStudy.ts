import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { StudySet, Card, Folder, Progress, SetComment, AppNotification, UserAnalytics, Achievement, UserAchievement } from "@/types"

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

export function usePublicSets(search?: string, options?: { featured?: boolean; limit?: number }) {
  return useQuery<StudySet[]>({
    queryKey: ["publicSets", search, options?.featured, options?.limit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (options?.featured) params.set("featured", "true")
      if (options?.limit) params.set("limit", String(options.limit))
      const res = await fetch(`/api/sets/public?${params}`)
      if (!res.ok) throw new Error("Failed to fetch public sets")
      return res.json()
    },
  })
}

export function useCreateStudySet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { title: string; description?: string; isPublic?: boolean; tags?: string[]; cards?: { term: string; definition: string }[] }) => {
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
  return useMutation({
    mutationFn: async (data: { cardId: string; correct: boolean }) => {
      const res = await fetch("/api/progress/card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flashcardId: data.cardId, correct: data.correct }),
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
      queryClient.invalidateQueries({ queryKey: ["savedSets"] })
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
  const queryClient = useQueryClient()
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      queryClient.invalidateQueries({ queryKey: ["progress"] })
      queryClient.invalidateQueries({ queryKey: ["dailyReview"] })
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
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      queryClient.invalidateQueries({ queryKey: ["progress"] })
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
      queryClient.invalidateQueries({ queryKey: ["analytics"] })
      queryClient.invalidateQueries({ queryKey: ["progress"] })
    },
  })
}

// Comments
export function useSetComments(setId: string) {
  return useQuery<SetComment[]>({
    queryKey: ["comments", setId],
    queryFn: async () => {
      const res = await fetch(`/api/sets/${setId}/comments`)
      if (!res.ok) throw new Error("Failed to fetch comments")
      return res.json()
    },
    enabled: !!setId,
  })
}

export function useAddComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ setId, text }: { setId: string; text: string }) => {
      const res = await fetch(`/api/sets/${setId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      })
      if (!res.ok) throw new Error("Failed to add comment")
      return res.json()
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", setId] })
    },
  })
}

// Ratings
export function useSetRatings(setId: string) {
  return useQuery<{ average: number; count: number; userRating: number | null }>({
    queryKey: ["ratings", setId],
    queryFn: async () => {
      const res = await fetch(`/api/sets/${setId}/ratings`)
      if (!res.ok) throw new Error("Failed to fetch ratings")
      return res.json()
    },
    enabled: !!setId,
  })
}

export function useRateSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ setId, score }: { setId: string; score: number }) => {
      const res = await fetch(`/api/sets/${setId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      })
      if (!res.ok) throw new Error("Failed to rate set")
    },
    onSuccess: (_, { setId }) => {
      queryClient.invalidateQueries({ queryKey: ["ratings", setId] })
    },
  })
}

// Notifications
export function useNotifications() {
  return useQuery<{ notifications: AppNotification[]; unreadCount: number }>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Failed to fetch notifications")
      return res.json()
    },
    refetchInterval: 30000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id?: string) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? { notificationId: id } : { markAllRead: true }),
      })
      if (!res.ok) throw new Error("Failed")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] })
    },
  })
}

// Analytics
export function useAnalytics() {
  return useQuery<UserAnalytics>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics")
      if (!res.ok) throw new Error("Failed to fetch analytics")
      return res.json()
    },
  })
}

// Achievements
export function useAchievements() {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const res = await fetch("/api/achievements")
      if (!res.ok) throw new Error("Failed to fetch achievements")
      return res.json()
    },
  })
}

export function useCheckAchievements() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/achievements", { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements"] })
    },
  })
}

// Daily Review (Spaced Repetition)
export function useDailyReview() {
  return useQuery({
    queryKey: ["dailyReview"],
    queryFn: async () => {
      const res = await fetch("/api/daily-review")
      if (!res.ok) throw new Error("Failed to fetch review cards")
      return res.json()
    },
  })
}

export function useSubmitReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cardId, quality }: { cardId: string; quality: number }) => {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId, quality }),
      })
      if (!res.ok) throw new Error("Failed to submit review")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dailyReview"] })
      queryClient.invalidateQueries({ queryKey: ["progress"] })
    },
  })
}

// AI Features
export function useAIGenerateCards() {
  return useMutation({
    mutationFn: async ({ topic, count }: { topic: string; count?: number }) => {
      const res = await fetch("/api/ai/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, count }),
      })
      if (!res.ok) throw new Error("Failed to generate cards")
      return res.json()
    },
  })
}

export function useAIExplain() {
  return useMutation({
    mutationFn: async ({ term, definition, question }: { term: string; definition: string; question?: string }) => {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ term, definition, question }),
      })
      if (!res.ok) throw new Error("Failed to get explanation")
      return res.json()
    },
  })
}

// Import/Export
export function useImportSet() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, content, format }: { title: string; content: string; format?: string }) => {
      const res = await fetch("/api/sets/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, format }),
      })
      if (!res.ok) throw new Error("Failed to import set")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["studySets"] })
    },
  })
}

// Delete Folder
export function useDeleteFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (folderId: string) => {
      const res = await fetch(`/api/folders/${folderId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete folder")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] })
    },
  })
}
