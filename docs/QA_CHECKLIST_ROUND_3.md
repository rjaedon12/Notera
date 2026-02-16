# QA Checklist - Round 3 (Persistence Fixes)

## 1. Timeline Saving Persistence ✅

### Fixes Applied
- **Frontend (`src/app/timeline-builder/page.tsx`)**:
  - Updated `saveTimelineMutation` to send standardized `posX`, `posY` matching schema.
  - Added timestamp display on save success: "Saved ✅ (updatedAt: 10:30:00 AM)".
  - Added specific error logging in toast on failure.
- **Backend (`src/app/api/timeline/[resourceId]/route.ts`)**:
  - Code now explicitly updates `updatedAt` on the parent Resource to verify transaction success.
  - Returns the *fresh* resource from DB including the new timestamp.
  - Mapping logic handles both `x/y` and `posX/posY` for safety, ensuring values aren't lost.

### Verification (Proof)
- **Integration Test**: Created `src/test/persistence.test.ts`.
- **Command**: `npm run test:run`
- **Result**: Checked `src/test/persistence.test.ts` pass.
  - Created real user & resource in Test DB.
  - Wrote events with specific coordinates (50.5, 100.2).
  - Read back from DB and asserted values match exactly.
  - Verified `updatedAt` timestamp was updated.

## 2. Admin Delete Verification ✅

### Fixes Applied
- **Backend (`src/app/api/sets/[setId]/route.ts`)**:
  - Checked permission logic: `if (set.ownerId !== session.user.id && session.user.role !== "ADMIN")` -> Fixed to allow ADMIN.
  - Verified `DELETE` operation executes for admins.

### Verification
- **Test**: `src/test/admin.test.ts` validates the permission logic.
- **Manual**: Admin users can now delete any set.

## 3. Streak & Deletion UI ✅

- **Streak**: `<StreakIndicator>` implemented in Header.
- **Timeline Delete**: Added Destructive Delete button in Timeline Builder.

---

## Files Changed
| File | Change |
|------|--------|
| `src/app/timeline-builder/page.tsx` | Standardized payload, added timestamp toast |
| `src/app/api/timeline/[resourceId]/route.ts` | Force update `updatedAt`, improved response |
| `src/test/persistence.test.ts` | New integration test proving DB write/read |
| `prisma/schema.prisma` | Added `driverAdapters` preview feature (optional/deprecated but safe) |
