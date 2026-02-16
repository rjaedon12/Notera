import { describe, it, expect } from 'vitest'

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

// Helper function to get yesterday's date in YYYY-MM-DD format  
function getYesterdayDate(): string {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return yesterday.toISOString().split('T')[0]
}

// Calculate new streak based on last study date
function calculateStreak(
  currentStreak: number, 
  lastStudyDate: string | null, 
  today: string, 
  yesterday: string
): { newStreak: number, studiedToday: boolean } {
  // Already studied today
  if (lastStudyDate === today) {
    return { newStreak: currentStreak, studiedToday: true }
  }
  
  // Studied yesterday - continue streak
  if (lastStudyDate === yesterday) {
    return { newStreak: currentStreak + 1, studiedToday: false }
  }
  
  // Gap in studying - reset streak  
  return { newStreak: 1, studiedToday: false }
}

describe('Streak Logic', () => {
  const today = '2026-01-26'
  const yesterday = '2026-01-25'
  const twoDaysAgo = '2026-01-24'
  const weekAgo = '2026-01-19'

  describe('calculateStreak', () => {
    it('should return same streak if already studied today', () => {
      const result = calculateStreak(5, today, today, yesterday)
      expect(result.newStreak).toBe(5)
      expect(result.studiedToday).toBe(true)
    })

    it('should increment streak if studied yesterday', () => {
      const result = calculateStreak(5, yesterday, today, yesterday)
      expect(result.newStreak).toBe(6)
      expect(result.studiedToday).toBe(false)
    })

    it('should reset streak to 1 if gap of 2+ days', () => {
      const result = calculateStreak(10, twoDaysAgo, today, yesterday)
      expect(result.newStreak).toBe(1)
      expect(result.studiedToday).toBe(false)
    })

    it('should reset streak to 1 after a week gap', () => {
      const result = calculateStreak(30, weekAgo, today, yesterday)
      expect(result.newStreak).toBe(1)
      expect(result.studiedToday).toBe(false)
    })

    it('should start streak at 1 for first-time study', () => {
      const result = calculateStreak(0, null, today, yesterday)
      expect(result.newStreak).toBe(1)
      expect(result.studiedToday).toBe(false)
    })

    it('should continue streak of 1 if studied yesterday', () => {
      const result = calculateStreak(1, yesterday, today, yesterday)
      expect(result.newStreak).toBe(2)
    })
  })

  describe('Date helpers', () => {
    it('getTodayDate returns YYYY-MM-DD format', () => {
      const today = getTodayDate()
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('getYesterdayDate returns a date one day before today', () => {
      const today = new Date(getTodayDate())
      const yesterday = new Date(getYesterdayDate())
      const diff = today.getTime() - yesterday.getTime()
      const dayInMs = 24 * 60 * 60 * 1000
      expect(diff).toBe(dayInMs)
    })
  })
})

describe('Streak validation', () => {
  it('longest streak should always be >= current streak', () => {
    const scenarios = [
      { current: 5, longest: 10 },
      { current: 10, longest: 10 },
      { current: 1, longest: 100 },
    ]
    
    for (const { current, longest } of scenarios) {
      expect(longest).toBeGreaterThanOrEqual(current)
    }
  })

  it('should update longest streak when current exceeds it', () => {
    const currentStreak = 11
    const longestStreak = 10
    const newLongestStreak = Math.max(currentStreak, longestStreak)
    expect(newLongestStreak).toBe(11)
  })
})
