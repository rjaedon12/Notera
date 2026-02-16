# 📋 StudyApp QA Checklist

## Overview
This checklist validates all features implemented in the comprehensive fixes.

---

## 🔥 Task 0: Timeline Persistence (BLOCKER - Fixed)

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Save timeline with positions | 1. Open Timeline Builder<br>2. Drag events to different positions<br>3. Click Save | No 500 error, positions persist | ⬜ PASS / ⬜ FAIL |
| Reload persisted positions | 1. Save timeline<br>2. Reload page | Events appear at saved positions | ⬜ PASS / ⬜ FAIL |
| Create arrows | 1. Click + drag between events<br>2. Save | Arrows persist after reload | ⬜ PASS / ⬜ FAIL |

**Technical Notes:**
- Fixed Prisma schema: `posX Float @default(0)` and `posY Float @default(0)` fields on TimelineEvent
- API processes individual events with explicit fields (no createMany with unknown args)
- Client sends `{ data: { events, edges } }` payload structure

---

## 👥 Task 1: Group Members Display

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| View members tab | 1. Navigate to group detail page<br>2. Click "Members" tab | Shows list of all members | ⬜ PASS / ⬜ FAIL |
| Member info display | Check member row | Shows name, email, role badge | ⬜ PASS / ⬜ FAIL |
| Owner badge | Check group owner's row | Shows orange "Owner" badge | ⬜ PASS / ⬜ FAIL |
| Member badge | Check regular member row | Shows blue "Member" badge | ⬜ PASS / ⬜ FAIL |
| Non-member join gate | 1. View group as non-member | Shows "Join Group" button instead of content | ⬜ PASS / ⬜ FAIL |

**Location:** [src/app/groups/[groupId]/page.tsx](src/app/groups/[groupId]/page.tsx)

---

## 🔥 Task 2: Streak Hero (Duolingo-style)

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Hero visibility | 1. Login<br>2. Go to Home page | Large streak hero at top of page | ⬜ PASS / ⬜ FAIL |
| Flame icon | Check streak hero | Large orange flame icon with glow | ⬜ PASS / ⬜ FAIL |
| Streak number | Check streak hero | Large bold streak count (e.g., "3") | ⬜ PASS / ⬜ FAIL |
| "day streak" label | Check streak hero | Shows "day streak" text below number | ⬜ PASS / ⬜ FAIL |
| Weekly circles | Check streak hero | 7 day circles (Su-Sa) | ⬜ PASS / ⬜ FAIL |
| Studied day indicator | Check studied days | Orange circle with checkmark | ⬜ PASS / ⬜ FAIL |
| Today highlight | Check current day | Ring around today's circle | ⬜ PASS / ⬜ FAIL |
| Motivational message | Study on current day | Shows "You extended your streak" message | ⬜ PASS / ⬜ FAIL |
| Not signed in | View home as guest | Hero NOT shown, marketing hero shown | ⬜ PASS / ⬜ FAIL |

**Location:** [src/components/streak/streak-hero.tsx](src/components/streak/streak-hero.tsx)

---

## 🛡️ Task 3: Admin Moderation

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Admin can see delete button | 1. Login as ADMIN<br>2. View any user's set | Delete option available | ⬜ PASS / ⬜ FAIL |
| Admin can delete other's set | 1. As ADMIN, delete another user's set | Set is deleted successfully | ⬜ PASS / ⬜ FAIL |
| Non-admin cannot delete others | 1. As regular USER<br>2. Try to delete another's set | Returns 403 Forbidden | ⬜ PASS / ⬜ FAIL |
| Owner can delete own set | 1. As owner, delete own set | Set is deleted successfully | ⬜ PASS / ⬜ FAIL |
| Audit log created | 1. Admin deletes a set<br>2. Check AuditLog table | Log entry exists with action, adminId, targetId | ⬜ PASS / ⬜ FAIL |

**Location:** [src/app/api/sets/[setId]/route.ts](src/app/api/sets/[setId]/route.ts) (DELETE handler)

**Authorization Logic:**
```typescript
if (set.ownerId !== session.user.id && session.user.role !== "ADMIN") {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
}
```

---

## 🎯 Task 4: Timeline Arrows (No Text Overlap)

| Test Case | Steps | Expected Result | Status |
|-----------|-------|-----------------|--------|
| Arrow doesn't cross event text | 1. Create arrow between events<br>2. Position events vertically | Arrow curves around card edge | ⬜ PASS / ⬜ FAIL |
| Horizontal arrows clean | Events side by side | Arrow connects card edges, not centers | ⬜ PASS / ⬜ FAIL |
| Curved path for adjacent events | Move events close together | Bezier curve provides clean path | ⬜ PASS / ⬜ FAIL |
| Arrowhead visible | Check arrow endpoint | Clear triangle arrowhead at destination | ⬜ PASS / ⬜ FAIL |

**Technical Notes:**
- `getArrowPath()` calculates edge-to-edge connections
- Uses card dimensions (150px × 80px) for edge detection
- Bezier curves with control points for smooth routing

**Location:** [src/app/timeline-builder/page.tsx](src/app/timeline-builder/page.tsx) - `getArrowPath` function

---

## ✅ Automated Test Results

| Test Suite | Tests | Status |
|------------|-------|--------|
| admin.test.ts | 3 | ✅ PASS |
| timeline.test.ts | 14 | ✅ PASS |
| resources.test.ts | 8 | ✅ PASS |
| groups.test.ts | 10 | ✅ PASS |
| streak.test.ts | 10 | ✅ PASS |
| persistence.test.ts | 1 | ✅ PASS |
| **TOTAL** | **46** | ✅ **ALL PASS** |

Run tests: `npx vitest run`

---

## 🔧 Technical Verification Commands

```bash
# 1. Verify Prisma schema is synced
npx prisma db push

# 2. Regenerate Prisma client
npx prisma generate

# 3. Run all tests
npx vitest run

# 4. Start dev server
npm run dev

# 5. Check for TypeScript errors
npx tsc --noEmit
```

---

## Files Changed

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added posX, posY to TimelineEvent |
| `src/app/api/timeline/[resourceId]/route.ts` | Fixed createMany, added posX/posY handling |
| `src/app/api/sets/[setId]/route.ts` | Admin delete override, audit logging |
| `src/app/groups/[groupId]/page.tsx` | Added Members tab with role badges |
| `src/app/timeline-builder/page.tsx` | Updated getArrowPath for edge-based routing |
| `src/components/streak/streak-hero.tsx` | NEW: Duolingo-style streak display |
| `src/app/page.tsx` | Added StreakHero to home page |

---

## Sign-off

- [ ] All automated tests pass
- [ ] Manual QA complete
- [ ] No console errors in browser
- [ ] No TypeScript errors

**QA Completed By:** _________________  
**Date:** _________________
