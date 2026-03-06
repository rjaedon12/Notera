"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog"
import { 
  Plus, 
  Save, 
  Trash2, 
  ArrowLeft,
  Clock,
  MousePointer,
  Link as LinkIcon,
  FileText,
  X,
  Globe,
  Lock
} from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"
import { Suspense } from "react"

interface TimelineEvent {
  id: string
  dateLabel: string
  title: string
  body: string | null
  sortOrder: number
  posX: number
  posY: number
}

interface TimelineArrow {
  id: string
  fromEventId: string
  toEventId: string
  label: string | null
}

interface Timeline {
  id: string
  title: string
  type: string
  visibility: "PRIVATE" | "PUBLIC" | "GROUP"
  timelineEvents: TimelineEvent[]
  arrows: LocalArrow[]
}

// Local event for editing (not yet saved)
interface LocalEvent {
  id: string
  dateLabel: string
  title: string
  body: string
  posX: number
  posY: number
  isNew?: boolean
}

interface LocalArrow {
  id: string
  fromEventId: string
  toEventId: string
  label: string
  isNew?: boolean
}

function TimelineBuilderContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const resourceId = searchParams.get("resourceId")
  
  const canvasRef = useRef<HTMLDivElement>(null)
  
  // Canvas state
  const [events, setEvents] = useState<LocalEvent[]>([])
  const [arrows, setArrows] = useState<LocalArrow[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  
  // Arrow creation mode
  const [arrowMode, setArrowMode] = useState(false)
  const [arrowFromId, setArrowFromId] = useState<string | null>(null)
  
  // Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<LocalEvent | null>(null)
  const [arrowLabelDialogOpen, setArrowLabelDialogOpen] = useState(false)
  const [pendingArrow, setPendingArrow] = useState<{ from: string, to: string } | null>(null)
  const [newArrowLabel, setNewArrowLabel] = useState("")
  
  // New timeline dialog
  const [newTimelineDialogOpen, setNewTimelineDialogOpen] = useState(false)
  const [newTimelineTitle, setNewTimelineTitle] = useState("")
  
  // Loading state
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [currentResourceId, setCurrentResourceId] = useState<string | null>(resourceId)
  
  // Visibility state
  const [visibility, setVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE")

  // Fetch existing resource if resourceId is provided
  const { data: timeline, isLoading } = useQuery<Timeline>({
    queryKey: ["timeline", currentResourceId],
    queryFn: async () => {
      const res = await fetch(`/api/resources/${currentResourceId}`)
      if (!res.ok) throw new Error("Failed to fetch timeline")
      return res.json()
    },
    enabled: !!currentResourceId
  })

  // Fetch user's timeline resources
  const { data: userTimelines = [] } = useQuery<Timeline[]>({
    queryKey: ["userTimelines"],
    queryFn: async () => {
      const res = await fetch("/api/resources?type=TIMELINE")
      if (!res.ok) throw new Error("Failed to fetch timelines")
      return res.json()
    },
    enabled: !!session?.user
  })

  // Load timeline data when fetched
  useEffect(() => {
    if (timeline?.timelineEvents) {
      setEvents(timeline.timelineEvents.map(e => ({
        id: e.id,
        dateLabel: e.dateLabel,
        title: e.title,
        body: e.body || "",
        posX: e.posX || Math.random() * 600,
        posY: e.posY || Math.random() * 400,
      })))
      
      if (timeline.arrows) {
        setArrows(timeline.arrows.map(a => ({
          id: a.id,
          fromEventId: a.fromEventId,
          toEventId: a.toEventId,
          label: a.label || "",
        })))
      } else {
        setArrows([])
      }
      
      // Load visibility
      if (timeline.visibility) {
        setVisibility(timeline.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE")
      }
      
      setHasChanges(false)
    }
  }, [timeline])

  // Create new timeline
  const createTimelineMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          type: "TIMELINE",
          visibility: "PRIVATE",
          content: ""
        })
      })
      if (!res.ok) throw new Error("Failed to create timeline")
      return res.json()
    },
    onSuccess: (data) => {
      setCurrentResourceId(data.id)
      setEvents([])
      setArrows([])
      setHasChanges(false)
      setNewTimelineDialogOpen(false)
      setNewTimelineTitle("")
      queryClient.invalidateQueries({ queryKey: ["userTimelines"] })
      router.push(`/timeline-builder?resourceId=${data.id}`)
      toast.success("Timeline created!")
    }
  })

  // Delete timeline
  const deleteTimelineMutation = useMutation({
    mutationFn: async () => {
      if (!currentResourceId) return
      const res = await fetch(`/api/resources/${currentResourceId}`, {
        method: "DELETE"
      })
      if (!res.ok) throw new Error("Failed to delete timeline")
      return res.json()
    },
    onSuccess: () => {
      setCurrentResourceId(null)
      router.push("/timeline-builder")
      queryClient.invalidateQueries({ queryKey: ["userTimelines"] })
      toast.success("Timeline deleted")
    },
    onError: () => {
      toast.error("Failed to delete timeline")
    }
  })

  // Update visibility
  const updateVisibilityMutation = useMutation({
    mutationFn: async (newVisibility: "PRIVATE" | "PUBLIC") => {
      if (!currentResourceId) return
      const res = await fetch(`/api/resources/${currentResourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility })
      })
      if (!res.ok) throw new Error("Failed to update visibility")
      return res.json()
    },
    onSuccess: (_, newVisibility) => {
      setVisibility(newVisibility)
      queryClient.invalidateQueries({ queryKey: ["timeline", currentResourceId] })
      queryClient.invalidateQueries({ queryKey: ["userTimelines"] })
      toast.success(`Timeline is now ${newVisibility === "PUBLIC" ? "public" : "private"}`)
    },
    onError: () => {
      toast.error("Failed to update visibility")
    }
  })

  // Save timeline
  const saveTimelineMutation = useMutation({
    mutationFn: async () => {
      if (!currentResourceId) return
      
      // Update events
      const res = await fetch(`/api/timeline/${currentResourceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // Requirements: wrapped in "data" object, arrows -> edges
        body: JSON.stringify({
          data: {
            events: events.map((e, i) => ({
              id: e.id,
              date: e.dateLabel,
              title: e.title,
              description: e.body || null,
              x: e.posX,
              y: e.posY,
              // Keep sortOrder as it's useful for the DB
              sortOrder: i,
            })),
            edges: arrows.map(a => ({
              id: a.isNew ? undefined : a.id,
              fromEventId: a.fromEventId,
              toEventId: a.toEventId,
              label: a.label || null
            }))
          }
        })
      })
      
      const responseData = await res.json()
      if (!res.ok) {
        throw new Error(responseData.error || `Server error: ${res.statusText}`)
      }
      return responseData
    },
    onSuccess: (data) => {
      setHasChanges(false)
      queryClient.invalidateQueries({ queryKey: ["timeline", currentResourceId] })
      
      const time = new Date(data.updatedAt).toLocaleTimeString()
      toast.success(`Saved ✅ (updatedAt: ${time})`)
    },
    onError: (error) => {
      console.error("Save error details:", error)
      toast.error(`Save failed: ${error.message}`)
    }
  })

  // Event handlers
  const handleAddEvent = () => {
    const newEvent: LocalEvent = {
      id: crypto.randomUUID(),
      dateLabel: new Date().toLocaleDateString(),
      title: "New Event",
      body: "",
      posX: 200 + Math.random() * 200,
      posY: 150 + Math.random() * 150,
      isNew: true
    }
    setEvents([...events, newEvent])
    setHasChanges(true)
    setEditingEvent(newEvent)
    setEditDialogOpen(true)
  }

  const handleEventMouseDown = (e: React.MouseEvent, eventId: string) => {
    if (arrowMode) {
      if (!arrowFromId) {
        setArrowFromId(eventId)
      } else if (arrowFromId !== eventId) {
        // Create arrow
        setPendingArrow({ from: arrowFromId, to: eventId })
        setArrowLabelDialogOpen(true)
        setArrowFromId(null)
        setArrowMode(false)
      }
      return
    }

    const event = events.find(ev => ev.id === eventId)
    if (!event) return

    setSelectedEventId(eventId)
    setIsDragging(true)
    
    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedEventId || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const newX = e.clientX - rect.left - dragOffset.x
    const newY = e.clientY - rect.top - dragOffset.y

    setEvents(prev => prev.map(ev => 
      ev.id === selectedEventId 
        ? { ...ev, posX: Math.max(0, newX), posY: Math.max(0, newY) }
        : ev
    ))
    setHasChanges(true)
  }, [isDragging, selectedEventId, dragOffset])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const handleEditEvent = (event: LocalEvent) => {
    setEditingEvent({ ...event })
    setEditDialogOpen(true)
  }

  const handleSaveEventEdit = () => {
    if (!editingEvent) return
    setEvents(prev => prev.map(e => 
      e.id === editingEvent.id ? editingEvent : e
    ))
    setHasChanges(true)
    setEditDialogOpen(false)
    setEditingEvent(null)
  }

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(e => e.id !== eventId))
    setArrows(prev => prev.filter(a => a.fromEventId !== eventId && a.toEventId !== eventId))
    setHasChanges(true)
    setSelectedEventId(null)
    setEditDialogOpen(false)
  }

  const handleCreateArrow = () => {
    if (!pendingArrow) return
    const newArrow: LocalArrow = {
      id: `arrow-${Date.now()}`,
      fromEventId: pendingArrow.from,
      toEventId: pendingArrow.to,
      label: newArrowLabel,
      isNew: true
    }
    setArrows([...arrows, newArrow])
    setHasChanges(true)
    setArrowLabelDialogOpen(false)
    setPendingArrow(null)
    setNewArrowLabel("")
  }

  const handleDeleteArrow = (arrowId: string) => {
    setArrows(prev => prev.filter(a => a.id !== arrowId))
    setHasChanges(true)
  }

  // Calculate arrow path - routes around event cards to avoid text overlap
  const getArrowPath = (fromEvent: LocalEvent, toEvent: LocalEvent) => {
    // Card dimensions
    const cardWidth = 150
    const cardHeight = 80
    
    // Get centers of cards
    const fromCenterX = fromEvent.posX + cardWidth / 2
    const fromCenterY = fromEvent.posY + cardHeight / 2
    const toCenterX = toEvent.posX + cardWidth / 2
    const toCenterY = toEvent.posY + cardHeight / 2
    
    // Calculate direction vector
    const dx = toCenterX - fromCenterX
    const dy = toCenterY - fromCenterY
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance === 0) return ''
    
    // Normalized direction
    const nx = dx / distance
    const ny = dy / distance
    
    // Determine which edge to connect to (exit from source, enter to target)
    let fromX, fromY, toX, toY
    
    // Calculate exit point from source card edge
    if (Math.abs(nx) > Math.abs(ny)) {
      // Horizontal connection
      if (nx > 0) {
        fromX = fromEvent.posX + cardWidth + 2 // Right edge
        toX = toEvent.posX - 12 // Left edge with arrow margin
      } else {
        fromX = fromEvent.posX - 2 // Left edge
        toX = toEvent.posX + cardWidth + 12 // Right edge
      }
      fromY = fromCenterY
      toY = toCenterY
    } else {
      // Vertical connection
      if (ny > 0) {
        fromY = fromEvent.posY + cardHeight + 2 // Bottom edge
        toY = toEvent.posY - 12 // Top edge with arrow margin
      } else {
        fromY = fromEvent.posY - 2 // Top edge
        toY = toEvent.posY + cardHeight + 12 // Bottom edge
      }
      fromX = fromCenterX
      toX = toCenterX
    }
    
    // Create smooth bezier curve that routes around cards
    const midX = (fromX + toX) / 2
    const midY = (fromY + toY) / 2
    
    // Add curve offset perpendicular to the line
    const curveOffset = Math.min(50, distance * 0.2)
    const perpX = -ny * curveOffset
    const perpY = nx * curveOffset
    
    const controlX = midX + perpX
    const controlY = midY + perpY

    return `M ${fromX} ${fromY} Q ${controlX} ${controlY} ${toX} ${toY}`
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Clock className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
        <h1 className="text-2xl font-bold mb-2 text-foreground font-heading">Timeline Builder</h1>
        <p className="mb-4" style={{ color: "var(--muted-foreground)" }}>
          Sign in to create and edit timelines
        </p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="border-b p-4 backdrop-blur-xl" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/resources" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-xl font-bold text-foreground font-heading">
              {timeline?.title || "Timeline Builder"}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={arrowMode ? "default" : "outline"} 
              size="sm"
              onClick={() => {
                setArrowMode(!arrowMode)
                setArrowFromId(null)
              }}
            >
              <LinkIcon className="h-4 w-4 mr-2" />
              {arrowMode ? "Cancel Arrow" : "Add Arrow"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleAddEvent}>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
            {currentResourceId && (
              <>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => updateVisibilityMutation.mutate(visibility === "PUBLIC" ? "PRIVATE" : "PUBLIC")}
                  disabled={updateVisibilityMutation.isPending}
                  title={visibility === "PUBLIC" ? "Make Private" : "Make Public"}
                >
                  {visibility === "PUBLIC" ? (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Public
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Private
                    </>
                  )}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => saveTimelineMutation.mutate()}
                  disabled={!hasChanges || isSaving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this timeline?")) {
                      deleteTimelineMutation.mutate()
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Timeline List */}
        <div className="w-64 border-r p-4 overflow-y-auto backdrop-blur-xl" style={{ borderColor: "var(--glass-border)", background: "var(--glass-fill)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground font-heading">My Timelines</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setNewTimelineDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {userTimelines.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No timelines yet. Create one to get started!
            </p>
          ) : (
            <div className="space-y-2">
              {userTimelines.map((t) => (
                <Link
                  key={t.id}
                  href={`/timeline-builder?resourceId=${t.id}`}
                  className={cn(
                    "block p-3 rounded-lg transition-colors",
                    currentResourceId === t.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium truncate">{t.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4" style={{ background: "var(--bg-base)" }}>
          {!currentResourceId ? (
            <div className="flex items-center justify-center h-full">
              <Card className="p-8 text-center max-w-md">
                <Clock className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)", opacity: 0.4 }} />
                <h2 className="text-lg font-semibold mb-2 text-foreground font-heading">
                  Create or Select a Timeline
                </h2>
                <p className="text-muted-foreground mb-4">
                  Choose an existing timeline from the sidebar or create a new one
                </p>
                <Button onClick={() => setNewTimelineDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Timeline
                </Button>
              </Card>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Skeleton className="h-64 w-64 rounded-xl" />
            </div>
          ) : (
            <div 
              ref={canvasRef}
              className="relative w-full min-h-[600px] rounded-2xl border backdrop-blur-sm"
              style={{ minWidth: "800px", background: "var(--glass-fill)", borderColor: "var(--glass-border)" }}
            >
              {/* Help text */}
              {events.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MousePointer className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Click "Add Event" to start building your timeline</p>
                  </div>
                </div>
              )}

              {/* Arrow mode indicator */}
              {arrowMode && (
                <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                  {arrowFromId ? "Click target event" : "Click source event"}
                </div>
              )}

              {/* Arrows SVG */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ overflow: "visible" }}
              >
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                  >
                    <polygon
                      points="0 0, 10 3.5, 0 7"
                      fill="currentColor"
                      className="text-blue-500"
                    />
                  </marker>
                </defs>
                {arrows.map((arrow) => {
                  const fromEvent = events.find(e => e.id === arrow.fromEventId)
                  const toEvent = events.find(e => e.id === arrow.toEventId)
                  if (!fromEvent || !toEvent) return null
                  
                  return (
                    <g key={arrow.id}>
                      <path
                        d={getArrowPath(fromEvent, toEvent)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-blue-500"
                        markerEnd="url(#arrowhead)"
                      />
                      {arrow.label && (
                        <text
                          x={(fromEvent.posX + toEvent.posX) / 2 + 75}
                          y={(fromEvent.posY + toEvent.posY) / 2 + 20}
                          textAnchor="middle"
                          className="text-xs fill-muted-foreground"
                        >
                          {arrow.label}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>

              {/* Events */}
              {events.map((event) => (
                <div
                  key={event.id}
                  className={cn(
                    "absolute w-[150px] bg-card border rounded-lg shadow-sm cursor-move select-none transition-shadow",
                    selectedEventId === event.id && "ring-2 ring-primary shadow-md",
                    arrowMode && arrowFromId === event.id && "ring-2 ring-green-500"
                  )}
                  style={{ 
                    left: event.posX, 
                    top: event.posY,
                  }}
                  onMouseDown={(e) => handleEventMouseDown(e, event.id)}
                  onDoubleClick={() => handleEditEvent(event)}
                >
                  <div className="p-3">
                    <p className="text-xs font-medium mb-1" style={{ color: "var(--primary)" }}>
                      {event.dateLabel}
                    </p>
                    <h4 className="text-sm font-semibold text-card-foreground line-clamp-2">
                      {event.title}
                    </h4>
                    {event.body && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {event.body}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Event Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editingEvent && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="dateLabel">Date</Label>
                <Input
                  id="dateLabel"
                  value={editingEvent.dateLabel}
                  onChange={(e) => setEditingEvent({ ...editingEvent, dateLabel: e.target.value })}
                  placeholder="e.g., 1914, March 1917"
                />
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                  placeholder="Event title"
                />
              </div>
              <div>
                <Label htmlFor="body">Description</Label>
                <textarea
                  id="body"
                  value={editingEvent.body}
                  onChange={(e) => setEditingEvent({ ...editingEvent, body: e.target.value })}
                  placeholder="Event description (optional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="text-red-500"
                  onClick={() => handleDeleteEvent(editingEvent.id)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
                <Button onClick={handleSaveEventEdit}>
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Arrow Label Dialog */}
      <Dialog open={arrowLabelDialogOpen} onOpenChange={setArrowLabelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Causation Arrow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="arrowLabel">Label (optional)</Label>
              <Input
                id="arrowLabel"
                value={newArrowLabel}
                onChange={(e) => setNewArrowLabel(e.target.value)}
                placeholder="e.g., 'leads to', 'causes'"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setArrowLabelDialogOpen(false)
                setPendingArrow(null)
                setNewArrowLabel("")
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateArrow}>
                Create Arrow
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Timeline Dialog */}
      <Dialog open={newTimelineDialogOpen} onOpenChange={setNewTimelineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Timeline</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="newTimelineTitle">Timeline Title</Label>
              <Input
                id="newTimelineTitle"
                value={newTimelineTitle}
                onChange={(e) => setNewTimelineTitle(e.target.value)}
                placeholder="e.g., World War I Timeline"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNewTimelineDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => createTimelineMutation.mutate(newTimelineTitle)}
                disabled={!newTimelineTitle.trim() || createTimelineMutation.isPending}
              >
                Create Timeline
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TimelineBuilderPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Skeleton className="h-64 w-64 rounded-xl" />
      </div>
    }>
      <TimelineBuilderContent />
    </Suspense>
  )
}
