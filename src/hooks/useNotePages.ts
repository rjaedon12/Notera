"use client"

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"

export interface NotePageMeta {
  id: string
  title: string
  icon: string | null
  parentId: string | null
  sortOrder: number
  isFavorite: boolean
  isArchived: boolean
  isFullWidth: boolean
  coverImage: string | null
  spaceId: string | null
  createdAt: string
  updatedAt: string
}

export interface NotePage extends NotePageMeta {
  content: Record<string, unknown> | null
  isPublic: boolean
  userId: string
}

export interface NotePageNode extends NotePageMeta {
  children: NotePageNode[]
}

// Build tree from flat list
export function buildTree(pages: NotePageMeta[]): NotePageNode[] {
  const map = new Map<string, NotePageNode>()
  const roots: NotePageNode[] = []

  pages.forEach((p) => map.set(p.id, { ...p, children: [] }))
  pages.forEach((p) => {
    if (p.parentId && map.has(p.parentId)) {
      map.get(p.parentId)!.children.push(map.get(p.id)!)
    } else {
      roots.push(map.get(p.id)!)
    }
  })

  const sort = (nodes: NotePageNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    nodes.forEach((n) => sort(n.children))
  }
  sort(roots)
  return roots
}

// Fetch all pages (metadata only, for sidebar)
export function useNotePages(spaceId?: string) {
  return useQuery<NotePageMeta[]>({
    queryKey: ["note-pages", spaceId],
    queryFn: async () => {
      const params = spaceId ? `?spaceId=${spaceId}` : ""
      const res = await fetch(`/api/notes${params}`)
      if (!res.ok) throw new Error("Failed to fetch pages")
      return res.json()
    },
  })
}

// Fetch all archived pages (for trash)
export function useArchivedNotePages() {
  return useQuery<NotePageMeta[]>({
    queryKey: ["note-pages-archived"],
    queryFn: async () => {
      const res = await fetch("/api/notes?archived=true")
      if (!res.ok) throw new Error("Failed to fetch archived pages")
      return res.json()
    },
  })
}

// Fetch single page with content
export function useNotePage(pageId: string | undefined) {
  return useQuery<NotePage>({
    queryKey: ["note-page", pageId],
    queryFn: async () => {
      const res = await fetch(`/api/notes/${pageId}`)
      if (!res.ok) throw new Error("Failed to fetch page")
      return res.json()
    },
    enabled: !!pageId,
  })
}

// Create page
export function useCreateNotePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      title?: string
      parentId?: string | null
      spaceId?: string
      icon?: string
    }) => {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to create page")
      return res.json() as Promise<NotePage>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-pages"] })
    },
  })
}

// Update page (content, metadata)
export function useUpdateNotePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pageId,
      ...data
    }: {
      pageId: string
      title?: string
      content?: Record<string, unknown>
      icon?: string | null
      coverImage?: string | null
      isFullWidth?: boolean
      isFavorite?: boolean
      isArchived?: boolean
      isPublic?: boolean
    }) => {
      const res = await fetch(`/api/notes/${pageId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Failed to update page")
      return res.json() as Promise<NotePage>
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["note-pages"] })
      queryClient.invalidateQueries({ queryKey: ["note-page", data.id] })
    },
  })
}

// Delete page (archive or hard delete)
export function useDeleteNotePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pageId: string) => {
      const res = await fetch(`/api/notes/${pageId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete page")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-pages"] })
      queryClient.invalidateQueries({ queryKey: ["note-pages-archived"] })
    },
  })
}

// Move page (reparent or reorder)
export function useMoveNotePage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      pageId,
      parentId,
      sortOrder,
    }: {
      pageId: string
      parentId?: string | null
      sortOrder?: number
    }) => {
      const res = await fetch(`/api/notes/${pageId}/move`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parentId, sortOrder }),
      })
      if (!res.ok) throw new Error("Failed to move page")
      return res.json() as Promise<NotePage>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["note-pages"] })
    },
  })
}
