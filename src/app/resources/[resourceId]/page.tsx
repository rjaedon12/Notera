"use client"

import { use } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  FileText, 
  Clock, 
  Image as ImageIcon, 
  FileIcon,
  ArrowLeft,
  Edit,
  Trash2,
  Globe,
  Lock
} from "lucide-react"

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

interface PageProps {
  params: Promise<{ resourceId: string }>
}

const resourceTypeIcons: Record<string, typeof FileText> = {
  STUDY_GUIDE: FileText,
  TIMELINE: Clock,
  IMAGE: ImageIcon,
  DOCUMENT: FileIcon
}

export default function ResourceDetailPage({ params }: PageProps) {
  const { resourceId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const queryClient = useQueryClient()

  // Fetch resource
  const { data: resource, isLoading } = useQuery<Resource>({
    queryKey: ["resource", resourceId],
    queryFn: async () => {
      const res = await fetch(`/api/resources/${resourceId}`)
      if (!res.ok) throw new Error("Failed to fetch resource")
      return res.json()
    }
  })

  // Delete resource mutation
  const deleteResource = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/resources/${resourceId}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete resource")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] })
      router.push("/resources")
    }
  })

  const isOwner = session?.user?.id === resource?.ownerId
  const isAdmin = session?.user?.role === "ADMIN"
  const canEdit = isOwner || isAdmin

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">Resource not found</h1>
        <Link href="/resources">
          <Button>Back to Resources</Button>
        </Link>
      </div>
    )
  }

  const Icon = resourceTypeIcons[resource.type] || FileIcon

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link 
          href="/resources" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Resources
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
              <Icon className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{resource.title}</h1>
                {resource.visibility === "PRIVATE" ? (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Globe className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <p className="text-muted-foreground">
                by {resource.owner.name || "Anonymous"} • {new Date(resource.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-500"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this resource?")) {
                    deleteResource.mutate()
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Tags */}
        {resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {resource.tags.map((t: { tag: { id: string; slug: string; name: string } }) => (
              <span key={t.tag.id} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm rounded-full">
                {t.tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <Card>
          <CardContent className="p-6">
            {resource.type === "TIMELINE" && resource.timelineEvents ? (
              <div className="space-y-6">
                {resource.timelineEvents
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-4 h-4 rounded-full bg-blue-500" />
                        {index < resource.timelineEvents!.length - 1 && (
                          <div className="w-0.5 flex-1 bg-border" />
                        )}
                      </div>
                      <div className="pb-6">
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                          {event.dateLabel}
                        </p>
                        <h3 className="font-semibold text-card-foreground">{event.title}</h3>
                        {event.body && (
                          <p className="text-muted-foreground text-sm mt-1">
                            {event.body}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : resource.type === "IMAGE" && resource.storagePath ? (
              <div className="text-center">
                <img
                  src={resource.storagePath}
                  alt={resource.title}
                  className="max-w-full h-auto rounded-lg mx-auto"
                />
              </div>
            ) : resource.content ? (
              <div className="prose dark:prose-invert max-w-none">
                {resource.content.split("\n").map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No content available
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
