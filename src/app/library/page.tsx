"use client"

import { useState } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useStudySets, useSavedSets, useFolders, useDeleteStudySet, useCreateFolder, useStarredSets, useToggleSetStar } from "@/hooks/useStudy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { SetCardSkeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { 
  Plus, 
  Folder, 
  BookOpen, 
  Bookmark, 
  Trash2, 
  MoreVertical,
  FolderPlus,
  Star
} from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

type Tab = "my-sets" | "saved" | "folders"

export default function LibraryPage() {
  const { status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>("my-sets")
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const { data: mySets, isLoading: loadingSets } = useStudySets()
  const { data: savedSets, isLoading: loadingSaved } = useSavedSets()
  const { data: folders, isLoading: loadingFolders } = useFolders()
  const { data: starredSetIds = [] } = useStarredSets()
  const deleteSet = useDeleteStudySet()
  const createFolder = useCreateFolder()
  const toggleStar = useToggleSetStar()

  // Sort starred sets to the top
  const sortedMySets = mySets
    ? [...mySets].sort((a, b) => {
        const aStarred = starredSetIds.includes(a.id) ? 1 : 0
        const bStarred = starredSetIds.includes(b.id) ? 1 : 0
        return bStarred - aStarred
      })
    : []

  const sortedSavedSets = savedSets
    ? [...savedSets].sort((a, b) => {
        const aStarred = starredSetIds.includes(a.id) ? 1 : 0
        const bStarred = starredSetIds.includes(b.id) ? 1 : 0
        return bStarred - aStarred
      })
    : []

  const handleToggleStar = (setId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const isStarred = starredSetIds.includes(setId)
    toggleStar.mutate(
      { setId, starred: !isStarred },
      {
        onSuccess: () => {
          toast.success(isStarred ? "Removed from starred" : "Added to starred")
        },
        onError: () => {
          toast.error("Failed to update star")
        },
      }
    )
  }

  if (status === "unauthenticated") {
    router.push("/login")
    return null
  }

  const handleDeleteSet = async (setId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this set?")) {
      try {
        await deleteSet.mutateAsync(setId)
        toast.success("Set deleted")
      } catch {
        toast.error("Failed to delete set")
      }
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    try {
      await createFolder.mutateAsync({ name: newFolderName })
      toast.success("Folder created")
      setNewFolderName("")
      setShowNewFolderDialog(false)
    } catch {
      toast.error("Failed to create folder")
    }
  }

  const tabs = [
    { id: "my-sets" as Tab, label: "My Sets", icon: BookOpen },
    { id: "saved" as Tab, label: "Saved", icon: Bookmark },
    { id: "folders" as Tab, label: "Folders", icon: Folder },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Your Library</h1>
        <div className="flex gap-2">
          {activeTab === "folders" && (
            <Button variant="outline" onClick={() => setShowNewFolderDialog(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              New Folder
            </Button>
          )}
          <Link href="/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Set
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === "my-sets" && (
        loadingSets ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SetCardSkeleton key={i} />)}
          </div>
        ) : sortedMySets && sortedMySets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMySets.map((set) => {
              const isStarred = starredSetIds.includes(set.id)
              return (
              <Link key={set.id} href={`/sets/${set.id}`}>
                <Card className={`h-full hover:shadow-lg transition-shadow cursor-pointer group ${isStarred ? "ring-2 ring-yellow-400/50" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1">{set.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {set._count?.cards || 0} cards
                        </p>
                        {set.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{set.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleToggleStar(set.id, e)}
                          className="p-1 rounded-full hover:bg-muted transition-colors"
                          aria-label={isStarred ? "Unstar set" : "Star set"}
                        >
                          <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSet(set.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                          aria-label="Delete set"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        set.isPublic ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"
                      )}>
                        {set.isPublic ? "Public" : "Private"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              )
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No study sets yet</h3>
            <p className="text-muted-foreground mb-4">Create your first study set to get started!</p>
            <Link href="/create">
              <Button>Create a Study Set</Button>
            </Link>
          </Card>
        )
      )}

      {activeTab === "saved" && (
        loadingSaved ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <SetCardSkeleton key={i} />)}
          </div>
        ) : sortedSavedSets && sortedSavedSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSavedSets.map((set) => {
              const isStarred = starredSetIds.includes(set.id)
              return (
              <Link key={set.id} href={`/sets/${set.id}`}>
                <Card className={`h-full hover:shadow-lg transition-shadow cursor-pointer ${isStarred ? "ring-2 ring-yellow-400/50" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1 flex-1">{set.title}</h3>
                      <button
                        onClick={(e) => handleToggleStar(set.id, e)}
                        className="ml-2 p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                        aria-label={isStarred ? "Unstar set" : "Star set"}
                      >
                        <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {set._count?.cards || 0} cards
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {set.owner?.name?.[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <span>by {set.owner?.name || "Anonymous"}</span>
                      {isStarred && (
                        <span className="ml-auto text-yellow-500 text-xs font-medium">★ Starred</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
              )
            })}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Bookmark className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No saved sets</h3>
            <p className="text-muted-foreground mb-4">Browse public sets and save them for later!</p>
            <Link href="/">
              <Button>Browse Sets</Button>
            </Link>
          </Card>
        )
      )}

      {activeTab === "folders" && (
        loadingFolders ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <SetCardSkeleton key={i} />)}
          </div>
        ) : folders && folders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <Link key={folder.id} href={`/folders/${folder.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                        <Folder className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold line-clamp-1">{folder.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {folder._count?.sets || 0} sets
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Folder className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No folders yet</h3>
            <p className="text-muted-foreground mb-4">Create folders to organize your study sets!</p>
            <Button onClick={() => setShowNewFolderDialog(true)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Create Folder
            </Button>
          </Card>
        )
      )}

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewFolderDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
