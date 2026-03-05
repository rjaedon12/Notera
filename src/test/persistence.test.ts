
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../lib/prisma'

describe('DB Persistence (Integration)', () => {

  const testEmail = `persistence-test-${Date.now()}@example.com`
  let userId: string
  let setId: string

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        password: 'test-hashed-password',
        name: 'Persistence User',
      },
    })
    userId = user.id
  })

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {})
    }
  })

  it('should create and retrieve a flashcard set with cards', async () => {
    // 1. Create a FlashcardSet with cards
    const set = await prisma.flashcardSet.create({
      data: {
        title: 'Integration Test Set',
        userId,
        cards: {
          create: [
            { term: 'Term A', definition: 'Definition A', order: 0 },
            { term: 'Term B', definition: 'Definition B', order: 1 },
          ],
        },
      },
      include: { cards: { orderBy: { order: 'asc' } } },
    })
    setId = set.id

    expect(set).toBeDefined()
    expect(set.title).toBe('Integration Test Set')
    expect(set.cards).toHaveLength(2)
    expect(set.cards[0].term).toBe('Term A')
    expect(set.cards[1].term).toBe('Term B')
  })

  it('should record and retrieve study progress', async () => {
    const progress = await prisma.studyProgress.create({
      data: {
        userId,
        setId,
        mode: 'FLASHCARD',
        masteredCount: 1,
        totalCards: 2,
        score: 50,
      },
    })

    expect(progress).toBeDefined()
    expect(progress.masteredCount).toBe(1)
    expect(progress.totalCards).toBe(2)
    expect(progress.score).toBe(50)

    // Verify it can be retrieved with composite unique key
    const found = await prisma.studyProgress.findUnique({
      where: {
        userId_setId_mode: { userId, setId, mode: 'FLASHCARD' },
      },
    })
    expect(found).toBeDefined()
    expect(found?.masteredCount).toBe(1)
  })
})
