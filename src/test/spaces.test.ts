import { describe, it, expect } from 'vitest'

describe('Space Access Control', () => {
  interface SpaceMember {
    userId: string
    role: 'OWNER' | 'MODERATOR' | 'MEMBER' | 'STUDENT'
  }

  function isMember(members: SpaceMember[], userId: string): boolean {
    return members.some(m => m.userId === userId)
  }

  function isOwner(members: SpaceMember[], userId: string): boolean {
    return members.some(m => m.userId === userId && m.role === 'OWNER')
  }

  function isModerator(members: SpaceMember[], userId: string): boolean {
    return members.some(m => m.userId === userId && (m.role === 'OWNER' || m.role === 'MODERATOR'))
  }

  function canViewSpace(members: SpaceMember[], userId: string | null): boolean {
    if (!userId) return false
    return isMember(members, userId)
  }

  function canDeleteSpace(members: SpaceMember[], userId: string | null): boolean {
    if (!userId) return false
    return isOwner(members, userId)
  }

  function canCreateAssignment(members: SpaceMember[], userId: string | null): boolean {
    if (!userId) return false
    return isModerator(members, userId)
  }

  function canPostAnnouncement(members: SpaceMember[], userId: string | null): boolean {
    if (!userId) return false
    return isModerator(members, userId)
  }

  const testMembers: SpaceMember[] = [
    { userId: 'owner1', role: 'OWNER' },
    { userId: 'mod1', role: 'MODERATOR' },
    { userId: 'member1', role: 'MEMBER' },
    { userId: 'student1', role: 'STUDENT' },
  ]

  describe('isMember', () => {
    it('should return true for all members', () => {
      expect(isMember(testMembers, 'owner1')).toBe(true)
      expect(isMember(testMembers, 'mod1')).toBe(true)
      expect(isMember(testMembers, 'member1')).toBe(true)
      expect(isMember(testMembers, 'student1')).toBe(true)
    })

    it('should return false for non-members', () => {
      expect(isMember(testMembers, 'random-user')).toBe(false)
    })
  })

  describe('isOwner', () => {
    it('should return true only for owners', () => {
      expect(isOwner(testMembers, 'owner1')).toBe(true)
    })

    it('should return false for non-owners', () => {
      expect(isOwner(testMembers, 'mod1')).toBe(false)
      expect(isOwner(testMembers, 'member1')).toBe(false)
      expect(isOwner(testMembers, 'student1')).toBe(false)
    })
  })

  describe('isModerator', () => {
    it('should return true for owners and moderators', () => {
      expect(isModerator(testMembers, 'owner1')).toBe(true)
      expect(isModerator(testMembers, 'mod1')).toBe(true)
    })

    it('should return false for members and students', () => {
      expect(isModerator(testMembers, 'member1')).toBe(false)
      expect(isModerator(testMembers, 'student1')).toBe(false)
    })
  })

  describe('canViewSpace', () => {
    it('should allow any member to view', () => {
      expect(canViewSpace(testMembers, 'owner1')).toBe(true)
      expect(canViewSpace(testMembers, 'student1')).toBe(true)
    })

    it('should deny non-members', () => {
      expect(canViewSpace(testMembers, 'random-user')).toBe(false)
    })

    it('should deny unauthenticated users', () => {
      expect(canViewSpace(testMembers, null)).toBe(false)
    })
  })

  describe('canDeleteSpace', () => {
    it('should allow only owner to delete', () => {
      expect(canDeleteSpace(testMembers, 'owner1')).toBe(true)
    })

    it('should deny non-owners from deleting', () => {
      expect(canDeleteSpace(testMembers, 'mod1')).toBe(false)
      expect(canDeleteSpace(testMembers, 'student1')).toBe(false)
      expect(canDeleteSpace(testMembers, null)).toBe(false)
    })
  })

  describe('canCreateAssignment', () => {
    it('should allow owners and moderators', () => {
      expect(canCreateAssignment(testMembers, 'owner1')).toBe(true)
      expect(canCreateAssignment(testMembers, 'mod1')).toBe(true)
    })

    it('should deny members and students', () => {
      expect(canCreateAssignment(testMembers, 'member1')).toBe(false)
      expect(canCreateAssignment(testMembers, 'student1')).toBe(false)
      expect(canCreateAssignment(testMembers, null)).toBe(false)
    })
  })

  describe('canPostAnnouncement', () => {
    it('should allow owners and moderators', () => {
      expect(canPostAnnouncement(testMembers, 'owner1')).toBe(true)
      expect(canPostAnnouncement(testMembers, 'mod1')).toBe(true)
    })

    it('should deny members and students', () => {
      expect(canPostAnnouncement(testMembers, 'member1')).toBe(false)
      expect(canPostAnnouncement(testMembers, 'student1')).toBe(false)
    })
  })
})

describe('Space Type Auto-Detection', () => {
  function determineSpaceType(userRole: string): 'COLLABORATIVE' | 'CLASSROOM' {
    return (userRole === 'TEACHER' || userRole === 'ADMIN') ? 'CLASSROOM' : 'COLLABORATIVE'
  }

  function determineJoinRole(spaceType: 'COLLABORATIVE' | 'CLASSROOM'): string {
    return spaceType === 'CLASSROOM' ? 'STUDENT' : 'MEMBER'
  }

  it('should create CLASSROOM for teachers', () => {
    expect(determineSpaceType('TEACHER')).toBe('CLASSROOM')
    expect(determineSpaceType('ADMIN')).toBe('CLASSROOM')
  })

  it('should create COLLABORATIVE for regular users', () => {
    expect(determineSpaceType('USER')).toBe('COLLABORATIVE')
  })

  it('should assign STUDENT role when joining classroom', () => {
    expect(determineJoinRole('CLASSROOM')).toBe('STUDENT')
  })

  it('should assign MEMBER role when joining collaborative space', () => {
    expect(determineJoinRole('COLLABORATIVE')).toBe('MEMBER')
  })
})

describe('Space Invite Code', () => {
  it('should generate valid 6-char hex invite codes', () => {
    const generateInviteCode = () => {
      const chars = '0123456789ABCDEF'
      return Array(6).fill(0).map(() => chars[Math.floor(Math.random() * 16)]).join('')
    }

    const code = generateInviteCode()
    expect(code).toMatch(/^[0-9A-F]{6}$/)
  })
})
