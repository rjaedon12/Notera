"use client"

import { use, useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useStudySet, useSaveSet, useDuplicateStudySet, useDeleteStudySet, useCreateShareLink } from "@/hooks/useStudy"
import { ModeTiles } from "@/components/study/mode-tiles"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Bookmark, 
  Share2, 
  Copy, 
  Trash2, 
  Edit, 
  MoreVertical,
  Globe,
  Lock,
  BookmarkCheck
} from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

interface PageProps {
  params: Promise<{ setId: string }>
}

export default function SetPage({ params }: PageProps) {
  const { setId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const { data: set, isLoading, error } = useStudySet(setId)
  const saveSet = useSaveSet()
  const duplicateSet = useDuplicateStudySet()
  const deleteSet = useDeleteStudySet()
  const createShareLink = useCreateShareLink()
  const [showMenu, setShowMenu] = useState(false)
  const [showAllCards, setShowAllCards] = useState(false)

  const isOwner = session?.user?.id === set?.ownerId

  const handleSave = async () => {
    if (!session) {
      router.push("/login")
      return
    }
    try {
      await saveSet.mutateAsync({ setId, save: true })
      toast.success("Set saved to your library")
    } catch {
      toast.error("Failed to save set")
    }
  }

  const handleDuplicate = async () => {
    if (!session) {
      router.push("/login")
      return
    }
    try {
      const newSet = await duplicateSet.mutateAsync(setId)
      toast.success("Set duplicated")
      router.push(`/sets/${newSet.id}`)
    } catch {
      toast.error("Failed to duplicate set")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this set?")) return
    try {
      await deleteSet.mutateAsync(setId)
      toast.success("Set deleted")
      router.push("/library")
    } catch {
      toast.error("Failed to delete set")
    }
  }

  const handleShare = async () => {
    try {
      const result = await createShareLink.mutateAsync(setId)
      await navigator.clipboard.writeText(result.url)
      toast.success("Link copied to clipboard!")
    } catch {
      toast.error("Failed to create share link")
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-32 mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !set) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Set not found</h1>
        <p className="text-muted-foreground mb-4">This study set doesn't exist or you don't have access to it.</p>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{set.title}</h1>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1">
              {set.isPublic ? (
                <>
                  <Globe className="h-4 w-4" />
                  Public
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Private
                </>
              )}
            </span>
            <span>•</span>
            <span>{set.cards?.length || 0} cards</span>
            {set.owner && (
              <>
                <span>•</span>
                <span>by {set.owner.name || "Anonymous"}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOwner && (
            <Button variant="outline" onClick={handleSave}>
              <Bookmark className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <div className="relative">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-lg shadow-lg border border-border py-2 z-10">
                {isOwner && (
                  <Link
                    href={`/sets/${setId}/edit`}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setShowMenu(false)}
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                )}
                <button
                  onClick={() => { handleDuplicate(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                >
                  <Copy className="h-4 w-4" />
                  Duplicate
                </button>
                {isOwner && (
                  <button
                    onClick={() => { handleDelete(); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {set.description && (
        <p className="text-muted-foreground mb-6">{set.description}</p>
      )}

      {/* Mode Tiles */}
      <ModeTiles setId={setId} className="mb-8" />

      {/* Cards Preview */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          Terms in this set ({set.cards?.length || 0})
        </h2>
        <div className="space-y-3">
          {set.cards?.slice(0, showAllCards ? undefined : 10).map((card) => (
            <Card key={card.id}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Term</p>
                    <p className="font-medium">{card.term}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-1">Definition</p>
                    <p>{card.definition}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {set.cards && set.cards.length > 10 && !showAllCards && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                onClick={() => setShowAllCards(true)}
              >
                Load remaining {set.cards.length - 10} cards
              </Button>
            </div>
          )}
          {showAllCards && set.cards && set.cards.length > 10 && (
            <div className="text-center py-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllCards(false)}
              >
                Show fewer cards
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
