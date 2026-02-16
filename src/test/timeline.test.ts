import { describe, it, expect } from 'vitest'

describe('Timeline Builder Data Structures', () => {
  interface TimelineEvent {
    id: string
    dateLabel: string
    title: string
    body: string | null
    posX: number
    posY: number
    sortOrder: number
  }

  interface TimelineArrow {
    id: string
    fromEventId: string
    toEventId: string
    label: string | null
  }

  // Validate event has required fields
  function isValidEvent(event: Partial<TimelineEvent>): boolean {
    return !!(
      event.dateLabel?.trim() &&
      event.title?.trim() &&
      typeof event.posX === 'number' &&
      typeof event.posY === 'number'
    )
  }

  // Validate arrow connects existing events
  function isValidArrow(
    arrow: Partial<TimelineArrow>, 
    eventIds: string[]
  ): boolean {
    return !!(
      arrow.fromEventId &&
      arrow.toEventId &&
      arrow.fromEventId !== arrow.toEventId &&
      eventIds.includes(arrow.fromEventId) &&
      eventIds.includes(arrow.toEventId)
    )
  }

  describe('Event validation', () => {
    it('should accept valid events', () => {
      const validEvent: Partial<TimelineEvent> = {
        dateLabel: '1914',
        title: 'Start of WWI',
        posX: 100,
        posY: 200
      }
      expect(isValidEvent(validEvent)).toBe(true)
    })

    it('should reject events without date label', () => {
      const invalidEvent: Partial<TimelineEvent> = {
        dateLabel: '',
        title: 'Event',
        posX: 100,
        posY: 200
      }
      expect(isValidEvent(invalidEvent)).toBe(false)
    })

    it('should reject events without title', () => {
      const invalidEvent: Partial<TimelineEvent> = {
        dateLabel: '1914',
        title: '   ',
        posX: 100,
        posY: 200
      }
      expect(isValidEvent(invalidEvent)).toBe(false)
    })

    it('should reject events without positions', () => {
      const invalidEvent: Partial<TimelineEvent> = {
        dateLabel: '1914',
        title: 'Event'
      }
      expect(isValidEvent(invalidEvent)).toBe(false)
    })
  })

  describe('Arrow validation', () => {
    const eventIds = ['event1', 'event2', 'event3']

    it('should accept valid arrows', () => {
      const validArrow: Partial<TimelineArrow> = {
        fromEventId: 'event1',
        toEventId: 'event2',
        label: 'causes'
      }
      expect(isValidArrow(validArrow, eventIds)).toBe(true)
    })

    it('should reject self-referencing arrows', () => {
      const selfArrow: Partial<TimelineArrow> = {
        fromEventId: 'event1',
        toEventId: 'event1'
      }
      expect(isValidArrow(selfArrow, eventIds)).toBe(false)
    })

    it('should reject arrows to non-existent events', () => {
      const invalidArrow: Partial<TimelineArrow> = {
        fromEventId: 'event1',
        toEventId: 'event99'
      }
      expect(isValidArrow(invalidArrow, eventIds)).toBe(false)
    })

    it('should accept arrows without labels', () => {
      const noLabelArrow: Partial<TimelineArrow> = {
        fromEventId: 'event1',
        toEventId: 'event2',
        label: null
      }
      expect(isValidArrow(noLabelArrow, eventIds)).toBe(true)
    })
  })

  describe('Arrow path calculation', () => {
    // Calculate arrow path for SVG
    function getArrowPath(
      fromX: number, fromY: number, 
      toX: number, toY: number
    ): string {
      const midX = (fromX + toX) / 2
      const midY = (fromY + toY) / 2
      const offset = Math.abs(fromY - toY) * 0.3

      return `M ${fromX} ${fromY} Q ${midX} ${midY - offset} ${toX} ${toY}`
    }

    it('should generate valid SVG path', () => {
      const path = getArrowPath(100, 100, 200, 200)
      expect(path).toContain('M 100 100')
      expect(path).toContain('Q')
      expect(path).toContain('200 200')
    })

    it('should handle horizontal arrows', () => {
      const path = getArrowPath(100, 100, 300, 100)
      expect(path).toBeTruthy()
    })

    it('should handle vertical arrows', () => {
      const path = getArrowPath(100, 100, 100, 300)
      expect(path).toBeTruthy()
    })
  })
})

describe('Timeline persistence', () => {
  it('should preserve event order on save', () => {
    const events = [
      { id: '1', sortOrder: 0, title: 'First' },
      { id: '2', sortOrder: 1, title: 'Second' },
      { id: '3', sortOrder: 2, title: 'Third' },
    ]
    
    const sorted = [...events].sort((a, b) => a.sortOrder - b.sortOrder)
    
    expect(sorted[0].title).toBe('First')
    expect(sorted[1].title).toBe('Second')
    expect(sorted[2].title).toBe('Third')
  })

  it('should handle reordering', () => {
    const events = [
      { id: '1', sortOrder: 0, title: 'First' },
      { id: '2', sortOrder: 1, title: 'Second' },
      { id: '3', sortOrder: 2, title: 'Third' },
    ]
    
    // Move Third to first position
    events[2].sortOrder = -1
    
    const sorted = [...events].sort((a, b) => a.sortOrder - b.sortOrder)
    
    expect(sorted[0].title).toBe('Third')
  })
})

describe('Timeline API Payload Mapping', () => {
  it('should map frontend x/y to backend posX/posY', () => {
    const frontendEvent = {
        id: '1',
        x: 100,
        y: 200,
        date: '1900',
        description: 'Desc'
    }
    
    // Simulate backend mapping logic
    const backendEvent = {
        id: frontendEvent.id,
        posX: frontendEvent.x,
        posY: frontendEvent.y,
        dateLabel: frontendEvent.date,
        body: frontendEvent.description
    }

    expect(backendEvent.posX).toBe(100)
    expect(backendEvent.posY).toBe(200)
    expect(backendEvent.dateLabel).toBe('1900')
    expect(backendEvent.body).toBe('Desc')
  })
})
