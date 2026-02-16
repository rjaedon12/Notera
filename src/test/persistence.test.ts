
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../lib/prisma'

describe('Timeline DB Persistence (Integration)', () => {
    
  const testEmail = `persistence-test-${Date.now()}@example.com`
  let userId: string
  let resourceId: string

  beforeAll(async () => {
    // Create User
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: 'test',
        name: 'Persistence User'
      }
    })
    userId = user.id
  })

  afterAll(async () => {
    // Cleanup
    if (userId) {
       await prisma.user.delete({ where: { id: userId } }).catch(() => {})
    }
  })

  it('should successfully save and retrieve timeline events with positions', async () => {
    // 1. Create Resource
    const resource = await prisma.resource.create({
      data: {
        title: 'Integration Test Timeline',
        type: 'TIMELINE',
        ownerId: userId,
        visibility: 'PRIVATE'
      }
    })
    resourceId = resource.id

    // 2. Simulate Save Data (Payload)
    // This matches what the frontend sends after my fix
    const eventsPayload = [
      {
        id: `evt-${Date.now()}-1`,
        title: 'Event A',
        dateLabel: '2020',
        body: 'Desc A',
        sortOrder: 0,
        posX: 50.5,
        posY: 100.2
      },
      {
        id: `evt-${Date.now()}-2`,
        title: 'Event B',
        dateLabel: '2021',
        body: 'Desc B',
        sortOrder: 1,
        posX: 200,
        posY: 300
      }
    ]

    const arrowsPayload = [
        {
            fromEventId: eventsPayload[0].id,
            toEventId: eventsPayload[1].id,
            label: 'Connector'
        }
    ]

    // 3. Perform Write (replicating API Route transaction)
    await prisma.$transaction(async (tx) => {
        // Create/Update Events
        // Since these are new, we create them
        await tx.timelineEvent.createMany({
            data: eventsPayload.map(e => ({
                id: e.id,
                resourceId: resource.id,
                title: e.title,
                dateLabel: e.dateLabel,
                body: e.body,
                sortOrder: e.sortOrder,
                posX: e.posX,
                posY: e.posY
            }))
        })

        // Create Arrows
        await tx.timelineArrow.createMany({
            data: arrowsPayload.map(a => ({
                fromEventId: a.fromEventId,
                toEventId: a.toEventId,
                label: a.label
            }))
        })
        
        // Touch Resource
        await tx.resource.update({
            where: { id: resource.id },
            data: { updatedAt: new Date() }
        })
    })

    // 4. Verify Read
    const savedResource = await prisma.resource.findUnique({
        where: { id: resource.id },
        include: {
            timelineEvents: {
                include: { arrowsFrom: true },
                orderBy: { sortOrder: 'asc' }
            }
        }
    })

    expect(savedResource).toBeDefined()
    expect(savedResource?.timelineEvents).toHaveLength(2)
    
    const evt1 = savedResource?.timelineEvents[0]
    const evt2 = savedResource?.timelineEvents[1]

    expect(evt1?.posX).toBe(50.5)
    expect(evt1?.posY).toBe(100.2)
    expect(evt1?.title).toBe('Event A')

    expect(evt2?.posX).toBe(200)
    expect(evt2?.posY).toBe(300)

    // Check Arrow
    expect(evt1?.arrowsFrom).toHaveLength(1)
    expect(evt1?.arrowsFrom[0].toEventId).toBe(evt2?.id)
    expect(evt1?.arrowsFrom[0].label).toBe('Connector')
    
    // Check UpdatedAt is recent
    const now = new Date()
    const diff = now.getTime() - savedResource!.updatedAt.getTime()
    expect(diff).toBeLessThan(5000) // Changed within last 5 seconds
  })
})
