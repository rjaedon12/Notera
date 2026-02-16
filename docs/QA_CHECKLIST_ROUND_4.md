# QA Checklist - Round 4 (Fix 500 Error & Usability)

## 1. Timeline Save 500 Error (FIXED) ✅

### Root Cause
The client was sending `{ events: [], arrows: [] }` but the server expected this payload under `body.data` per the new Data Contract requirement. This caused `events` to be undefined on the server, throwing "Cannot read properties of undefined (reading 'map')" or similar.

### Fixes
- **Frontend (`src/app/timeline-builder/page.tsx`)**: Updated `saveTimelineMutation` to wrap payload in `{ data: { events, edges: arrows } }`.
- **Backend (`src/app/api/timeline/[resourceId]/route.ts`)**: Updated handler to read from `body.data`. Added mapping for `x/y` -> `posX/posY`. Added robust validation and error logging (returns 400 instead of 500 for bad payloads).

### Verification
1. Open Timeline Builder.
2. Add Event -> "Test" at 1900.
3. Save.
4. **Result**: Toast "Saved ✅". Network tab shows 200 OK.
5. Refresh.
6. **Result**: Event persists.

## 2. Edit Entrypoint (ADDED) ✅

### Requirement
"Make saved timelines easily editable"

### Fixes
- **Frontend (`src/app/resources/page.tsx`)**: Added an **Edit (Pencil)** button that appears on hover for Timeline cards (only for Owner/Admin).
- **Behavior**: Clicking title opens View Modal (existing). Clicking Edit button navigates to `/timeline-builder?resourceId=...`.

### Verification
1. Go to `/resources`.
2. Hover over a Timeline card.
3. Click "Edit" icon.
4. **Result**: Redirects to Builder with data loaded.

## 3. Admin User Delete (VERIFIED) ✅

### Requirement
"Admin must delete ANY user's sets"

### Fixes
- **Backend (`src/app/api/sets/[setId]/route.ts`)**: Added logging for Role/User ID debugging. Improved error message return (returns actual error message instead of generic "dependent data").
- Logic `if (set.ownerId !== session.user.id && session.user.role !== "ADMIN")` is confirmed correct.

### Verification
- Relies on NextAuth passing `role` correctly (verified in `src/lib/auth.ts`).

---

## Files Changed
1. `src/app/timeline-builder/page.tsx` - Fix payload struct
2. `src/app/api/timeline/[resourceId]/route.ts` - Fix payload parsing & error log
3. `src/app/resources/page.tsx` - Add Edit button
4. `src/app/api/sets/[setId]/route.ts` - Improve logging
