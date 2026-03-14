"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { 
  FileText, 
  Clock, 
  Image as ImageIcon, 
  FileIcon,
  Globe,
  Lock,
  X,
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
  userId?: string
  user?: { id: string; name: string | null }
  timelineEvents?: TimelineEvent[]
}

interface ResourceViewerProps {
  resource: Resource | null
  open: boolean
  onOpenChange: (open: boolean) => void
  currentUserId?: string
  isAdmin?: boolean
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

export function ResourceViewer({ 
  resource, 
  open, 
  onOpenChange, 
  currentUserId,
  isAdmin 
}: ResourceViewerProps) {
  const router = useRouter()
  
  if (!resource) return null
  
  const Icon = resourceTypeIcons[resource.type] || FileIcon
  const canEdit = currentUserId === (resource.ownerId || resource.userId) || isAdmin
  
  // Simple markdown rendering (handles basic formatting)
  const renderContent = (content: string) => {
    // Split by newlines and render paragraphs
    // Handle headers, bold, italic, links
    const lines = content.split('\n')
    return lines.map((line, i) => {
      // Headers
      if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(4)}</h3>
      }
      if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(3)}</h2>
      }
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>
      }
      // List items
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return <li key={i} className="ml-4">{formatInline(line.slice(2))}</li>
      }
      // Empty lines
      if (!line.trim()) {
        return <br key={i} />
      }
      // Regular paragraph
      return <p key={i} className="mb-2">{formatInline(line)}</p>
    })
  }

  // Escape HTML entities to prevent XSS
  const escapeHtml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  // Format inline elements (bold, italic, links, images)
  const formatInline = (text: string) => {
    // First escape HTML to prevent XSS, then apply markdown formatting
    let result = escapeHtml(text)
    // Handle bold **text**
    result = result.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Handle italic *text*
    result = result.replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Handle inline code `code`
    result = result.replace(/`(.+?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    
    return <span dangerouslySetInnerHTML={{ __html: result }} />
  }

  const handleOpenTimeline = () => {
    onOpenChange(false)
    router.push(`/timeline-builder?resourceId=${resource.id}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{resource.title}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{resourceTypeLabels[resource.type]}</span>
                <span>•</span>
                {resource.visibility === "PRIVATE" ? (
                  <span className="flex items-center gap-1">
                    <Lock className="h-3 w-3" /> Private
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Public
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Meta info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4 pb-4 border-b border-border">
          <span>by {resource.owner?.name || resource.user?.name || "Anonymous"}</span>
          <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {resource.tags.map((t) => (
              <span
                key={t.tag.id}
                className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full"
              >
                {t.tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="prose dark:prose-invert max-w-none">
          {resource.type === "TIMELINE" ? (
            <div>
              {resource.timelineEvents && resource.timelineEvents.length > 0 ? (
                <div className="space-y-4">
                  {resource.timelineEvents
                    .sort((a, b) => a.sortOrder - b.sortOrder)
                    .map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          {index < resource.timelineEvents!.length - 1 && (
                            <div className="w-0.5 flex-1 bg-border" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                            {event.dateLabel}
                          </p>
                          <h4 className="font-semibold">{event.title}</h4>
                          {event.body && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.body}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No timeline events yet.</p>
              )}
              <Button 
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white" 
                onClick={handleOpenTimeline}
              >
                <Clock className="h-4 w-4 mr-2" />
                {canEdit ? "Edit in Timeline Builder" : "Open in Timeline Builder"}
              </Button>
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
            <div>{renderContent(resource.content)}</div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No content available
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-border">
          <Link href={`/resources/${resource.id}`} className="flex-1">
            <Button variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Full Page
            </Button>
          </Link>
          {canEdit && (
            <Link href={`/resources/${resource.id}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
