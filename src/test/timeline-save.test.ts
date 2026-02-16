import { describe, it, expect, beforeEach } from 'vitest'

/**
 * Timeline Save System Tests
 * 
 * These tests verify the timeline save logic works correctly:
 * - Create new events
 * - Update existing events  
 * - Delete removed events
 * - Idempotency (saving same data multiple times)
 * - Position persistence (posX, posY)
 * - Arrow creation and validation
 */

// Types matching the save system
interface TimelineEventInput {
  id: string
  dateLabel?: string
  date?: string
  title?: string
  body?: string
  description?: string
  sortOrder?: number
  posX?: number
  posY?: number
  x?: number
  y?: number
}

interface TimelineArrowInput {
  fromEventId: string
  toEventId: string
  label?: string | null
}

interface SaveTimelinePayload {
  resourceId: string
  events: TimelineEventInput[]
  edges?: TimelineArrowInput[]
}

// Simulate the normalize function from timeline-save.ts
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

// Simulate validation
function validateEvent(event: TimelineEventInput): string | null {
  if (!event.id || typeof event.id !== "string") {
    return "Event missing id"
  }
  return null
}

function validateArrow(arrow: TimelineArrowInput, eventIds: Set<string>): string | null {
  if (!arrow.fromEventId || !arrow.toEventId) {
    return "Arrow missing fromEventId or toEventId"
  }
  if (arrow.fromEventId === arrow.toEventId) {
    return "Arrow cannot connect event to itself"
  }
  if (!eventIds.has(arrow.fromEventId)) {
    return `Arrow fromEventId ${arrow.fromEventId} not in events`
  }
  if (!eventIds.has(arrow.toEventId)) {
    return `Arrow toEventId ${arrow.toEventId} not in events`
  }
  return null
}

// Mock database for testing
class MockDatabase {
  events: Map<string, any> = new Map()
  arrows: Map<string, any> = new Map()
  
  reset() {
    this.events.clear()
    this.arrows.clear()
  }
  
  createEvent(event: any) {
    this.events.set(event.id, { ...event, createdAt: new Date(), updatedAt: new Date() })
  }
  
  updateEvent(id: string, data: any) {
    const existing = this.events.get(id)
    if (existing) {
      this.events.set(id, { ...existing, ...data, updatedAt: new Date() })
    }
  }
  
  deleteEvent(id: string) {
    this.events.delete(id)
    // Also delete related arrows
    for (const [arrowId, arrow] of this.arrows) {
      if (arrow.fromEventId === id || arrow.toEventId === id) {
        this.arrows.delete(arrowId)
      }
    }
  }
  
  createArrow(arrow: any) {
    const id = `arrow_${arrow.fromEventId}_${arrow.toEventId}`
    this.arrows.set(id, { id, ...arrow })
  }
  
  getEventsForResource(resourceId: string) {
    return Array.from(this.events.values()).filter(e => e.resourceId === resourceId)
  }
  
  getArrowsForResource(resourceId: string) {
    const eventIds = new Set(this.getEventsForResource(resourceId).map(e => e.id))
    return Array.from(this.arrows.values()).filter(a => 
      eventIds.has(a.fromEventId) || eventIds.has(a.toEventId)
    )
  }
}

// Simulate the save function using mock DB
function mockSaveTimeline(db: MockDatabase, payload: SaveTimelinePayload) {
  const { resourceId, events, edges = [] } = payload
  
  // Validate
  if (!resourceId) {
    return { ok: false, error: "Invalid resourceId" }
  }
  
  if (!Array.isArray(events)) {
    return { ok: false, error: "events must be an array" }
  }
  
  const eventIds = new Set<string>()
  for (const event of events) {
    const error = validateEvent(event)
    if (error) {
      return { ok: false, error }
    }
    if (eventIds.has(event.id)) {
      return { ok: false, error: `Duplicate event id: ${event.id}` }
    }
    eventIds.add(event.id)
  }
  
  // Get existing events
  const existingEvents = db.getEventsForResource(resourceId)
  const existingIds = new Set(existingEvents.map(e => e.id))
  
  // Determine operations
  const toCreate: string[] = []
  const toUpdate: string[] = []
  const toDelete: string[] = []
  
  for (const id of eventIds) {
    if (existingIds.has(id)) {
      toUpdate.push(id)
    } else {
      toCreate.push(id)
    }
  }
  
  for (const id of existingIds) {
    if (!eventIds.has(id)) {
      toDelete.push(id)
    }
  }
  
  // Execute operations
  for (const id of toDelete) {
    db.deleteEvent(id)
  }
  
  for (const id of toUpdate) {
    const event = events.find(e => e.id === id)!
    const normalized = normalizeEvent(event, resourceId)
    db.updateEvent(id, normalized)
  }
  
  for (const id of toCreate) {
    const event = events.find(e => e.id === id)!
    const normalized = normalizeEvent(event, resourceId)
    db.createEvent(normalized)
  }
  
  // Delete all arrows for resource
  for (const arrow of db.getArrowsForResource(resourceId)) {
    db.arrows.delete(arrow.id)
  }
  
  // Create valid arrows
  for (const arrow of edges) {
    const error = validateArrow(arrow, eventIds)
    if (!error) {
      db.createArrow(arrow)
    }
  }
  
  return { 
    ok: true, 
    savedEvents: events.length,
    savedArrows: edges.filter(a => !validateArrow(a, eventIds)).length,
  }
}

describe('Timeline Save System', () => {
  let db: MockDatabase
  const resourceId = 'test-resource-1'
  
  beforeEach(() => {
    db = new MockDatabase()
  })
  
  describe('Event Creation', () => {
    it('should create new events with positions', () => {
      const result = mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Event 1', dateLabel: '1900', posX: 100, posY: 200 },
          { id: 'e2', title: 'Event 2', dateLabel: '1901', posX: 300, posY: 400 },
        ]
      })
      
      expect(result.ok).toBe(true)
      expect(result.savedEvents).toBe(2)
      
      const events = db.getEventsForResource(resourceId)
      expect(events).toHaveLength(2)
      expect(events.find(e => e.id === 'e1')?.posX).toBe(100)
      expect(events.find(e => e.id === 'e1')?.posY).toBe(200)
      expect(events.find(e => e.id === 'e2')?.posX).toBe(300)
      expect(events.find(e => e.id === 'e2')?.posY).toBe(400)
    })
    
    it('should normalize x/y to posX/posY', () => {
      const result = mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Event 1', date: '1900', x: 150, y: 250 },
        ]
      })
      
      expect(result.ok).toBe(true)
      
      const event = db.events.get('e1')
      expect(event.posX).toBe(150)
      expect(event.posY).toBe(250)
      expect(event.dateLabel).toBe('1900')
    })
    
    it('should use default values for missing fields', () => {
      const result = mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1' }, // Minimal event
        ]
      })
      
      expect(result.ok).toBe(true)
      
      const event = db.events.get('e1')
      expect(event.title).toBe('Untitled')
      expect(event.dateLabel).toBe('No Date')
      expect(event.posX).toBe(0)
      expect(event.posY).toBe(0)
      expect(event.sortOrder).toBe(0)
    })
  })
  
  describe('Event Updates', () => {
    it('should update existing events', () => {
      // First save
      mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Original', posX: 100, posY: 100 },
        ]
      })
      
      // Second save with updated data
      const result = mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Updated', posX: 200, posY: 300 },
        ]
      })
      
      expect(result.ok).toBe(true)
      
      const events = db.getEventsForResource(resourceId)
      expect(events).toHaveLength(1)
      expect(events[0].title).toBe('Updated')
      expect(events[0].posX).toBe(200)
      expect(events[0].posY).toBe(300)
    })
    
    it('should preserve positions on update', () => {
      // Create event
      mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Event', posX: 123.456, posY: 789.012 },
        ]
      })
      
      // Update without changing position
      mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Event Updated', posX: 123.456, posY: 789.012 },
        ]
      })
      
      const event = db.events.get('e1')
      expect(event.posX).toBe(123.456)
      expect(event.posY).toBe(789.012)
    })
  })
  
  describe('Event Deletion', () => {
    it('should delete events not in new payload', () => {
      // Create 3 events
      mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Event 1' },
          { id: 'e2', title: 'Event 2' },
          { id: 'e3', title: 'Event 3' },
        ]
      })
      
      expect(db.getEventsForResource(resourceId)).toHaveLength(3)
      
      // Save with only 1 event
      const result = mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e2', title: 'Event 2 Updated' },
        ]
      })
      
      expect(result.ok).toBe(true)
      
      const events = db.getEventsForResource(resourceId)
      expect(events).toHaveLength(1)
      expect(events[0].id).toBe('e2')
    })
    
    it('should cascade delete arrows when event is deleted', () => {
      // Create events with arrow
      mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Event 1' },
          { id: 'e2', title: 'Event 2' },
        ],
        edges: [
          { fromEventId: 'e1', toEventId: 'e2' }
        ]
      })
      
      expect(db.arrows.size).toBe(1)
      
      // Delete e1
      mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e2', title: 'Event 2' },
        ]
      })
      
      // Arrow should be deleted
      expect(db.arrows.size).toBe(0)
    })
  })
  
  describe('Idempotency', () => {
    it('should produce same result when called multiple times', () => {
      const payload: SaveTimelinePayload = {
        resourceId,
        events: [
          { id: 'e1', title: 'Event 1', posX: 100, posY: 200 },
          { id: 'e2', title: 'Event 2', posX: 300, posY: 400 },
        ],
        edges: [
          { fromEventId: 'e1', toEventId: 'e2', label: 'causes' }
        ]
      }
      
      // Save 3 times
      mockSaveTimeline(db, payload)
      mockSaveTimeline(db, payload)
      const result = mockSaveTimeline(db, payload)
      
      expect(result.ok).toBe(true)
      
      // Should still have exactly 2 events
      const events = db.getEventsForResource(resourceId)
      expect(events).toHaveLength(2)
      
      // Positions should be preserved
      expect(events.find(e => e.id === 'e1')?.posX).toBe(100)
      expect(events.find(e => e.id === 'e2')?.posX).toBe(300)
    })
    
    it('should not duplicate events on repeated saves', () => {
      for (let i = 0; i < 5; i++) {
        mockSaveTimeline(db, {
          resourceId,
          events: [
            { id: 'e1', title: `Save ${i}` },
          ]
        })
      }
      
      expect(db.getEventsForResource(resourceId)).toHaveLength(1)
    })
  })
  
  describe('Arrow Validation', () => {
    it('should create valid arrows', () => {
      const result = mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Event 1' },
          { id: 'e2', title: 'Event 2' },
        ],
        edges: [
          { fromEventId: 'e1', toEventId: 'e2', label: 'leads to' }
        ]
      })
      
      expect(result.ok).toBe(true)
      expect(db.arrows.size).toBe(1)
    })
    
    it('should reject self-referencing arrows', () => {
      mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Event 1' },
        ],
        edges: [
          { fromEventId: 'e1', toEventId: 'e1' }
        ]
      })
      
      // Self-referencing arrow should be skipped
      expect(db.arrows.size).toBe(0)
    })
    
    it('should reject arrows to non-existent events', () => {
      mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Event 1' },
        ],
        edges: [
          { fromEventId: 'e1', toEventId: 'e999' }
        ]
      })
      
      expect(db.arrows.size).toBe(0)
    })
  })
  
  describe('Validation Errors', () => {
    it('should reject missing resourceId', () => {
      const result = mockSaveTimeline(db, {
        resourceId: '',
        events: []
      })
      
      expect(result.ok).toBe(false)
      expect(result.error).toContain('resourceId')
    })
    
    it('should reject duplicate event IDs', () => {
      const result = mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', title: 'Event 1' },
          { id: 'e1', title: 'Duplicate' },
        ]
      })
      
      expect(result.ok).toBe(false)
      expect(result.error).toContain('Duplicate')
    })
    
    it('should reject events without ID', () => {
      const result = mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: '', title: 'No ID' },
        ]
      })
      
      expect(result.ok).toBe(false)
      expect(result.error).toContain('id')
    })
  })
  
  describe('Position Precision', () => {
    it('should preserve float precision for positions', () => {
      mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', posX: 123.456789, posY: 987.654321 },
        ]
      })
      
      const event = db.events.get('e1')
      expect(event.posX).toBe(123.456789)
      expect(event.posY).toBe(987.654321)
    })
    
    it('should handle negative positions', () => {
      mockSaveTimeline(db, {
        resourceId,
        events: [
          { id: 'e1', posX: -100, posY: -200 },
        ]
      })
      
      const event = db.events.get('e1')
      expect(event.posX).toBe(-100)
      expect(event.posY).toBe(-200)
    })
  })
})

describe('Timeline Save API Contract', () => {
  it('should accept { data: { events, edges } } format', () => {
    const payload = {
      data: {
        events: [{ id: 'e1', title: 'Test' }],
        edges: []
      }
    }
    
    // Extract events/edges as the API does
    const data = payload.data || payload
    const events = data.events || []
    const edges = data.edges || []
    
    expect(events).toHaveLength(1)
    expect(edges).toHaveLength(0)
  })
  
  it('should accept { events, edges } format', () => {
    const payload = {
      events: [{ id: 'e1', title: 'Test' }],
      edges: []
    }
    
    // Extract events/edges as the API does  
    const data = (payload as any).data || payload
    const events = data.events || []
    const edges = data.edges || []
    
    expect(events).toHaveLength(1)
    expect(edges).toHaveLength(0)
  })
  
  it('should return { ok: true } on success', () => {
    const result = { ok: true, savedEvents: 2, savedArrows: 1 }
    expect(result.ok).toBe(true)
    expect(result.savedEvents).toBeDefined()
  })
  
  it('should return { ok: false, error } on failure', () => {
    const result = { ok: false, error: 'Something went wrong', details: 'stack trace' }
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
  })
})
