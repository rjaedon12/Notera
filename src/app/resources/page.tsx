"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { ResourceViewer } from "@/components/resources/resource-viewer"
import { 
  FileText, 
  Clock, 
  Image as ImageIcon, 
  FileIcon,
  Plus,
  Search,
  Globe,
  Lock,
  ExternalLink,
  Edit
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineEvent {
  id: string
  dateLabel: string
  title: string
  body: string | null
  sortOrder: number
}

interface Resource {
  id: string
  title: string
  type: string
  visibility: string
  content: string | null
  storagePath: string | null
  createdAt: string
  ownerId: string
  owner: { id: string; name: string | null }
  tags: { tag: { id: string; name: string; slug: string } }[]
  timelineEvents?: TimelineEvent[]
}

const resourceTypeIcons: Record<string, typeof FileText> = {
  STUDY_GUIDE: FileText,
  TIMELINE: Clock,
  IMAGE: ImageIcon,
  DOCUMENT: FileIcon
}

const resourceTypeLabels: Record<string, string> = {
  STUDY_GUIDE: "Study Guide",
  TIMELINE: "Timeline",
  IMAGE: "Image",
  DOCUMENT: "Document"
}

export default function ResourcesPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [newResource, setNewResource] = useState({
    title: "",
    type: "STUDY_GUIDE",
    visibility: "PUBLIC",
    content: ""
  })

  // Fetch resources
  const { data: resources = [], isLoading } = useQuery<Resource[]>({
    queryKey: ["resources", searchQuery, selectedType],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (selectedType) params.set("type", selectedType)
      const res = await fetch(`/api/resources?${params}`)
      if (!res.ok) throw new Error("Failed to fetch resources")
      return res.json()
    }
  })

  // Fetch selected resource for viewer
  const { data: selectedResource } = useQuery<Resource>({
    queryKey: ["resource", selectedResourceId],
    queryFn: async () => {
      const res = await fetch(`/api/resources/${selectedResourceId}`)
      if (!res.ok) throw new Error("Failed to fetch resource")
      return res.json()
    },
    enabled: !!selectedResourceId && viewerOpen
  })

  const handleOpenResource = (resourceId: string) => {
    setSelectedResourceId(resourceId)
    setViewerOpen(true)
  }

  // Create resource mutation
  const createResource = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResource)
      })
      if (!res.ok) throw new Error("Failed to create resource")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      setShowCreateForm(false)
      setNewResource({ title: "", type: "STUDY_GUIDE", visibility: "PUBLIC", content: "" })
    }
  })

  const resourceTypes = ["STUDY_GUIDE", "TIMELINE", "IMAGE", "DOCUMENT"]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Resources</h1>
            <p className="text-muted-foreground">
              Study guides, timelines, and more
            </p>
          </div>
          {session?.user && (
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Resource
            </Button>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedType === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(null)}
            >
              All
            </Button>
            {resourceTypes.map((type) => {
              const Icon = resourceTypeIcons[type]
              return (
                <Button
                  key={type}
                  variant={selectedType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType(type === selectedType ? null : type)}
                  className="gap-1"
                >
                  <Icon className="h-4 w-4" />
                  {resourceTypeLabels[type]}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Create Resource Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Resource</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newResource.title.trim()) {
                    createResource.mutate()
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Resource title"
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label>Type</Label>
                  <div className="flex gap-2 mt-2">
                    {resourceTypes.map((type) => {
                      const Icon = resourceTypeIcons[type]
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewResource({ ...newResource, type })}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                            newResource.type === type
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-transparent text-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="text-sm">{resourceTypeLabels[type]}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <Label>Visibility</Label>
                  <div className="flex gap-4 mt-2">
                    <button
                      type="button"
                      onClick={() => setNewResource({ ...newResource, visibility: "PUBLIC" })}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                        newResource.visibility === "PUBLIC"
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-transparent text-foreground hover:bg-muted"
                      )}
                    >
                      <Globe className="h-4 w-4" />
                      <span>Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewResource({ ...newResource, visibility: "PRIVATE" })}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
                        newResource.visibility === "PRIVATE"
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-transparent text-foreground hover:bg-muted"
                      )}
                    >
                      <Lock className="h-4 w-4" />
                      <span>Private</span>
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="content">Content</Label>
                  <textarea
                    id="content"
                    placeholder="Resource content (Markdown supported)"
                    value={newResource.content}
                    onChange={(e) => setNewResource({ ...newResource, content: e.target.value })}
                    rows={8}
                    className="w-full mt-1 px-3 py-2 border border-border bg-input text-input-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={createResource.isPending}>
                    Create Resource
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-40 rounded-xl" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2 text-foreground">No resources found</h3>
            <p className="text-muted-foreground mb-4">
              {session?.user
                ? "Create your first resource to get started"
                : "Sign in to create resources"}
            </p>
            {session?.user && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Resource
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => {
              const Icon = resourceTypeIcons[resource.type] || FileIcon
              const isOwner = session?.user?.id === resource.owner.id
              const isAdmin = session?.user?.role === "ADMIN"

              return (
                <div key={resource.id} className="relative group">
                  <div onClick={() => handleOpenResource(resource.id)}>
                    <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0 pr-8">
                            <h3 className="font-semibold line-clamp-1 text-card-foreground">
                              {resource.title}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {resourceTypeLabels[resource.type]}
                            </p>
                          </div>
                        </div>
                        
                        {/* Tags */}
                        {resource.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {resource.tags.slice(0, 3).map((t) => (
                              <span
                                key={t.tag.id}
                                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                              >
                                {t.tag.name}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {resource.visibility === "PRIVATE" && (
                              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span>by {resource.owner.name || "Anonymous"}</span>
                          </div>
                          <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Edit Button for Timelines - positioned at top-right */}
                  {resource.type === "TIMELINE" && (isOwner || isAdmin) && (
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <Link 
                        href={`/timeline-builder?resourceId=${resource.id}`}
                        onClick={(e) => e.stopPropagation()} // Prevent opening viewer
                      >
                        <Button size="icon" variant="secondary" className="h-8 w-8 shadow-sm" title="Edit Timeline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Resource Viewer Modal */}
        <ResourceViewer
          resource={selectedResource || null}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          currentUserId={session?.user?.id}
          isAdmin={session?.user?.role === "ADMIN"}
        />
      </div>
    </div>
  )
}
