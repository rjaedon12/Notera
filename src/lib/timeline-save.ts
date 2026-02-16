import { prisma } from "@/lib/prisma"

/**
 * Timeline Event input from client
 */
export interface TimelineEventInput {
  id: string
  dateLabel?: string
  date?: string // Alias for dateLabel
  title?: string
  body?: string
  description?: string // Alias for body
  sortOrder?: number
  posX?: number
  posY?: number
  x?: number // Alias for posX
  y?: number // Alias for posY
}

/**
 * Timeline Arrow input from client
 */
export interface TimelineArrowInput {
  fromEventId?: string
  toEventId?: string
  source?: string
  target?: string
  from?: string
  to?: string
  label?: string | null
}

/**
 * Save timeline payload
 */
export interface SaveTimelinePayload {
  resourceId: string
  events: TimelineEventInput[]
  edges?: TimelineArrowInput[]
}

/**
 * Save timeline result
 */
export interface SaveTimelineResult {
  ok: boolean
  error?: string
  details?: string
  savedEvents?: number
  savedArrows?: number
}

/**
 * Normalize an event input to DB-compatible format
 */
function normalizeEvent(event: TimelineEventInput, resourceId: string) {
  return {
    id: event.id,
    dateLabel: event.dateLabel || event.date || "No Date",
    title: event.title || "Untitled",
    body: event.body ?? event.description ?? null,
    sortOrder: typeof event.sortOrder === "number" ? event.sortOrder : 0,
    posX: event.posX ?? event.x ?? 0,
    posY: event.posY ?? event.y ?? 0,
    resourceId,
  }
}

/**
 * Validate an event has required fields
 */
function validateEvent(event: TimelineEventInput): string | null {
  if (!event.id || typeof event.id !== "string") {
    return "Event missing id"
  }
  return null
}

/**
 * Validate an arrow connects valid events
 */
function validateArrow(arrow: TimelineArrowInput, eventIds: Set<string>): string | null {
  const fromId = arrow.fromEventId || arrow.source || arrow.from
  const toId = arrow.toEventId || arrow.target || arrow.to

  if (!fromId || !toId) {
    return "Arrow missing fromEventId or toEventId"
  }
  if (fromId === toId) {
    return "Arrow cannot connect event to itself"
  }
  if (!eventIds.has(fromId)) {
    return `Arrow fromEventId ${fromId} not in events`
  }
  if (!eventIds.has(toId)) {
    return `Arrow toEventId ${toId} not in events`
  }
  return null
}

/**
 * Save timeline events and arrows atomically.
 * 
 * This function is idempotent - calling it multiple times with the same data
 * produces the same result without duplicating rows.
 * 
 * Uses upsert pattern: existing events are updated, new events are created,
 * removed events are deleted.
 */
export async function saveTimeline(payload: SaveTimelinePayload): Promise<SaveTimelineResult> {
  const { resourceId, events, edges = [] } = payload

  // Validate resourceId
  if (!resourceId || typeof resourceId !== "string") {
    return { ok: false, error: "Invalid resourceId" }
  }

  // Validate events array
  if (!Array.isArray(events)) {
    return { ok: false, error: "events must be an array" }
  }

  // Validate each event and collect IDs
  const eventIds = new Set<string>()
  for (const event of events) {
    const error = validateEvent(event)
    if (error) {
      return { ok: false, error, details: JSON.stringify(event) }
    }
    if (eventIds.has(event.id)) {
      return { ok: false, error: `Duplicate event id: ${event.id}` }
    }
    eventIds.add(event.id)
  }

  // Validate arrows
  const validArrows: TimelineArrowInput[] = []
  for (const arrow of edges) {
    const error = validateArrow(arrow, eventIds)
    if (error) {
      // Skip invalid arrows silently (or could return error)
      console.warn("Skipping invalid arrow:", error, arrow)
      continue
    }
    validArrows.push(arrow)
  }

  try {
    // Perform all operations in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify resource exists and is a timeline
      const resource = await tx.resource.findUnique({
        where: { id: resourceId },
        select: { id: true, type: true, ownerId: true }
      })

      if (!resource) {
        throw new Error("Resource not found")
      }

      if (resource.type !== "TIMELINE") {
        throw new Error("Resource is not a timeline")
      }

      // 2. Get existing event IDs for this resource
      const existingEvents = await tx.timelineEvent.findMany({
        where: { resourceId },
        select: { id: true }
      })
      const existingEventIds = new Set(existingEvents.map(e => e.id))

      // 3. Determine which events to create, update, delete
      const toCreate: string[] = []
      const toUpdate: string[] = []
      const toDelete: string[] = []

      for (const id of eventIds) {
        if (existingEventIds.has(id)) {
          toUpdate.push(id)
        } else {
          toCreate.push(id)
        }
      }

      for (const id of existingEventIds) {
        if (!eventIds.has(id)) {
          toDelete.push(id)
        }
      }

      // 4. Delete removed events (this also cascades to arrows)
      if (toDelete.length > 0) {
        await tx.timelineEvent.deleteMany({
          where: { id: { in: toDelete } }
        })
      }

      // 5. Update existing events one by one (upsert pattern)
      for (const eventId of toUpdate) {
        const event = events.find(e => e.id === eventId)!
        const normalized = normalizeEvent(event, resourceId)
        await tx.timelineEvent.update({
          where: { id: eventId },
          data: {
            dateLabel: normalized.dateLabel,
            title: normalized.title,
            body: normalized.body,
            sortOrder: normalized.sortOrder,
            posX: normalized.posX,
            posY: normalized.posY,
          }
        })
      }

      // 6. Create new events one by one (to avoid createMany issues)
      for (const eventId of toCreate) {
        const event = events.find(e => e.id === eventId)!
        const normalized = normalizeEvent(event, resourceId)
        await tx.timelineEvent.create({
          data: {
            id: normalized.id,
            dateLabel: normalized.dateLabel,
            title: normalized.title,
            body: normalized.body,
            sortOrder: normalized.sortOrder,
            posX: normalized.posX,
            posY: normalized.posY,
            resourceId: normalized.resourceId,
          }
        })
      }

      // 7. Delete all existing arrows for this resource's events
      // Arrows are persisted in TimelineArrow rows (normalized table).
      await tx.timelineArrow.deleteMany({
        where: {
          OR: [
            { fromEvent: { resourceId } },
            { toEvent: { resourceId } }
          ]
        }
      })

      // 8. Create new arrows one by one
      for (const arrow of validArrows) {
        const fromId = arrow.fromEventId || arrow.source || arrow.from
        const toId = arrow.toEventId || arrow.target || arrow.to

        if (!fromId || !toId) continue

        await tx.timelineArrow.create({
          data: {
            fromEventId: fromId,
            toEventId: toId,
            label: arrow.label ?? null,
          }
        })
      }

      // 9. Update resource timestamp
      await tx.resource.update({
        where: { id: resourceId },
        data: { updatedAt: new Date() }
      })

      return {
        savedEvents: events.length,
        savedArrows: validArrows.length,
        deleted: toDelete.length,
        created: toCreate.length,
        updated: toUpdate.length,
      }
    })

    return {
      ok: true,
      savedEvents: result.savedEvents,
      savedArrows: result.savedArrows,
    }
  } catch (error) {
    console.error("saveTimeline error:", error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
      details: error instanceof Error ? error.stack : undefined,
    }
  }
}

/**
 * Load timeline events and arrows for a resource
 */
export async function loadTimeline(resourceId: string) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId },
    include: {
      owner: { select: { id: true, name: true } },
      timelineEvents: {
        orderBy: { sortOrder: "asc" },
        include: {
          arrowsFrom: true,
          arrowsTo: true,
        }
      }
    }
  })

  if (!resource) {
    return null
  }

  // Flatten arrows from all events
  const arrows = resource.timelineEvents.flatMap(event =>
    event.arrowsFrom.map(arrow => ({
      id: arrow.id,
      fromEventId: arrow.fromEventId,
      toEventId: arrow.toEventId,
      label: arrow.label,
    }))
  )

  return {
    ...resource,
    arrows,
    edges: arrows,
  }
}
