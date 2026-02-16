import { describe, it, expect } from 'vitest'

describe('Admin Privileges', () => {
    
  interface User {
    id: string
    role: 'USER' | 'ADMIN'
  }

  interface Resource {
    id: string
    ownerId: string
  }

  // Logic used in DELETE /api/sets/[setId]
  function canDeleteResource(user: User, resource: Resource): boolean {
    if (resource.ownerId === user.id) return true
    if (user.role === 'ADMIN') return true
    return false
  }

  describe('Delete Permissions', () => {
    const adminUser: User = { id: 'admin1', role: 'ADMIN' }
    const normalUser: User = { id: 'user1', role: 'USER' }
    const otherUser: User = { id: 'user2', role: 'USER' }
    
    const resourceOwnedByUser1: Resource = { id: 'res1', ownerId: 'user1' }

    it('should allow owner to delete', () => {
      expect(canDeleteResource(normalUser, resourceOwnedByUser1)).toBe(true)
    })

    it('should prevent non-owner from deleting', () => {
      expect(canDeleteResource(otherUser, resourceOwnedByUser1)).toBe(false)
    })

    it('should allow admin to delete non-owned resource', () => {
      expect(canDeleteResource(adminUser, resourceOwnedByUser1)).toBe(true)
    })
  })
})
