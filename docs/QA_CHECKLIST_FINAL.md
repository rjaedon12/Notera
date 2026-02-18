# QA Checklist - Final Round

## 1. Fix Timeline Save (Prisma Mismatch) ✅

### Root Cause
The `createMany` call in `src/app/api/timeline/[resourceId]/route.ts` used `posX` and `posY` arguments, which existed in the Prisma Schema (`prisma/schema.prisma`) but were NOT recognized by the generated Prisma Client runtime. This caused the "Unknown argument" error.

### Fix
- **Action**: Ran `npx prisma generate` to rebuild the client types and validation logic.
- **Action**: Ran `npx prisma db push` to ensure the PostgreSQL schema matches the Prisma schema.
- **Verification**: The code no longer throws validation errors.

## 2. Make Saved Timelines Editable ✅

### Implementation
- **Route**: `/timeline-builder?resourceId=...` handles loading existing data.
- **UI**: Added "Edit" icon to Timeline cards in `src/app/resources/page.tsx` for quick access.
- **UI**: Updated `ResourceViewer` modal to show "Edit in Timeline Builder" (Primary Button) for owners/admins.
- **Logic**: Loading logic in `timeline-builder/page.tsx` correctly maps server `posX` to client state. Save logic uses `PUT` to update existing events.

### Verification
1. Open Resources page.
2. Click "Edit" on a timeline card.
3. Builder loads with events in correct positions.
4. Move an event and Save.
5. Refresh -> Positions persist.

## 3. Admin Delete Actions ✅

### Implementation
- **Sets**: Updated `src/app/api/sets/[setId]/route.ts` to allow `session.user.role === 'ADMIN'`.
- **Resources**: Verified `src/app/api/resources/[resourceId]/route.ts` allows `session.user.role === 'ADMIN'`.
- **Constraint Handling**: Prisma schema includes `onDelete: Cascade` for `cards`, `tags`, `timelineEvents`, etc. Added `try/catch` blocks in API routes to gracefully handle any edge case constraints and return meaningful 400 errors instead of 500s.

### Verification
- Admin user can now delete content owned by other users.

---

## Migration Steps Done
```bash
# Synced Schema to Client
npx prisma generate

# Synced Schema to Database (Dev)
npx prisma db push
```

## Files Changed
1. `prisma/schema.prisma` (Verified fields exist)
2. `src/app/resources/page.tsx` (Added Edit button)
3. `src/components/resources/resource-viewer.tsx` (Enhanced Open/Edit button)
4. `src/app/api/resources/[resourceId]/route.ts` (Admin delete logic)
5. `src/app/api/sets/[setId]/route.ts` (Admin delete logic)
