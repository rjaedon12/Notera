"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
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
  Star,
  FileText
} from "lucide-react"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import { HomeworkBuilder } from "@/components/teacher/HomeworkBuilder"

type Tab = "my-sets" | "saved" | "folders" | "homework"

export default function LibraryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>("my-sets")
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  // Auto-open new folder dialog when arriving via ?newFolder=true
  useEffect(() => {
    if (searchParams.get("newFolder") === "true") {
      setActiveTab("folders")
      setShowNewFolderDialog(true)
      // Clean up the URL param
      router.replace("/library", { scroll: false })
    }
  }, [searchParams, router])

  const isTeacherOrAdmin =
    session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"

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
    ...(isTeacherOrAdmin
      ? [{ id: "homework" as Tab, label: "Homework Creator", icon: FileText }]
      : []),
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-heading tracking-tight">Your Library</h1>
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
      <div className="flex gap-2 mb-8 border-b" style={{ borderColor: "var(--glass-border)" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-[var(--primary)] text-[var(--primary)]"
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
                <Card className={`h-full cursor-pointer group ${isStarred ? "ring-2 ring-[var(--primary)]/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-1 font-heading">{set.title}</h3>
                        <p className="text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>
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
                          <Star className={`h-4 w-4 ${isStarred ? "fill-[var(--primary)] text-[var(--primary)]" : "text-muted-foreground"}`} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteSet(set.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded transition-opacity"
                          aria-label="Delete set"
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded-full",
                        set.isPublic ? "glass-tag" : "glass-tag-private"
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
                <Card className={`h-full cursor-pointer ${isStarred ? "ring-2 ring-[var(--primary)]/30" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1 flex-1 font-heading">{set.title}</h3>
                      <button
                        onClick={(e) => handleToggleStar(set.id, e)}
                        className="ml-2 p-1 rounded-full hover:bg-muted transition-colors flex-shrink-0"
                        aria-label={isStarred ? "Unstar set" : "Star set"}
                      >
                        <Star className={`h-4 w-4 ${isStarred ? "fill-[var(--primary)] text-[var(--primary)]" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {set._count?.cards || 0} cards
                    </p>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <div className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.2)" }}>
                        <span className="font-medium" style={{ color: "var(--primary)", fontSize: "0.65rem" }}>
                          {set.owner?.name?.[0]?.toUpperCase() || "U"}
                        </span>
                      </div>
                      <span>by {set.owner?.name || "Anonymous"}</span>
                      {isStarred && (
                        <span className="ml-auto text-xs font-medium" style={{ color: "var(--primary)" }}>★ Starred</span>
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
                <Card className="h-full cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(79,142,247,0.15)", border: "1px solid rgba(79,142,247,0.2)" }}>
                        <Folder className="h-5 w-5" style={{ color: "var(--primary)" }} />
                      </div>
                      <div>
                        <h3 className="font-semibold line-clamp-1 font-heading">{folder.name}</h3>
                        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
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

      {/* Homework Creator Tab (Teachers & Admins only) */}
      {activeTab === "homework" && isTeacherOrAdmin && (
        <div className="max-w-5xl mx-auto">
          <p className="text-sm mb-6" style={{ color: "var(--muted-foreground)" }}>
            Create printable PDF worksheets from your flashcard study sets.
            Select sets, choose question formats, and download a ready-to-print homework.
          </p>
          <HomeworkBuilder />
        </div>
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
