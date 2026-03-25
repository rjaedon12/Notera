# Implementation Plan: Desmos Calculator, Teacher Accounts & PDF Export

> **Date:** March 25, 2026  
> **App:** Notera (Next.js 16 / Prisma / NextAuth v5 / Tailwind v4)

---

## Table of Contents

1. [Feature Overview](#feature-overview)  
2. [Feature 1 — Desmos Calculator Side Panel](#feature-1--desmos-calculator-side-panel)  
3. [Feature 2 — Teacher Accounts & Admin Role Assignment](#feature-2--teacher-accounts--admin-role-assignment)  
4. [Feature 3 — PDF Homework Generator from Study Sets](#feature-3--pdf-homework-generator-from-study-sets)  
5. [Database Migrations](#database-migrations)  
6. [File-by-File Implementation Checklist](#file-by-file-implementation-checklist)  
7. [Implementation Order](#implementation-order)  

---

## Feature Overview

| # | Feature | Who Can Use It |
|---|---------|----------------|
| 1 | Desmos graphing calculator as a collapsible side panel on math & physics study guides | All users |
| 2 | Teacher role — assigned by admin only — with access to PDF homework generation | Admin → Teacher |
| 3 | Export any flashcard set as a formatted PDF homework worksheet | Teachers only |

---

## Feature 1 — Desmos Calculator Side Panel

### Concept
Embed the [Desmos API](https://www.desmos.com/api/v1.10/docs/) graphing calculator as a **collapsible side panel** that slides in from the right edge of the screen. It should:
- Only appear on **math** and **physics** study guide pages (subjects where graphing is useful)
- Be **non-intrusive** — a small floating toggle button that opens/closes the panel
- **Not** block or overlap the main study guide content (the main content area should shrink)
- Persist calculator state while navigating between lessons within the same guide

### API Key Handling
> ⚠️ The Desmos API key is **client-side only** (it's embedded in a `<script>` tag and is domain-restricted by Desmos). However, we should **still keep it in an environment variable** so it's not hard-coded in source control, and is easy to rotate.

```
# .env.local (already gitignored)
NEXT_PUBLIC_DESMOS_API_KEY=37f7340cd096407b846692e0fb5bacf2
```

- Use `NEXT_PUBLIC_` prefix so Next.js exposes it to the browser.
- The key is **domain-locked** on the Desmos side, so exposure in client bundles is expected and safe.
- **Never** hard-code the key directly in source files.

### Architecture

```
src/
├── components/
│   └── studyguide/
│       └── DesmosPanel.tsx           ← New — the collapsible calculator panel
│       └── DesmosToggleButton.tsx    ← New — floating FAB to open/close
├── hooks/
│   └── useDesmos.ts                  ← New — manages Desmos script loading + instance
├── app/
│   └── studyguides/
│       └── [guideId]/
│           └── page.tsx              ← Modified — conditionally render Desmos panel
```

### Detailed File Changes

#### 1. `src/hooks/useDesmos.ts` — Custom Hook
```
Purpose: Lazy-load the Desmos API script, create a calculator instance, and clean up on unmount.

Logic:
- On mount, check if `window.Desmos` exists
- If not, inject <script src="https://www.desmos.com/api/v1.10/calculator.js?apiKey=NEXT_PUBLIC_DESMOS_API_KEY">
- Once loaded, call `Desmos.GraphingCalculator(containerElement, options)` 
- Return { calculatorRef, isLoaded, error }
- On unmount, call calculator.destroy()

Options to pass:
  - expressionsTopbar: true
  - settingsMenu: false
  - zoomButtons: true
  - expressions: true
  - border: false
  - keypad: true  (so mobile users get the on-screen keypad)
```

#### 2. `src/components/studyguide/DesmosPanel.tsx` — Side Panel
```
Purpose: A right-edge slide-out panel containing the Desmos calculator.

Behavior:
- Width: 420px on desktop, full-width overlay on mobile (< 768px)
- Slides in/out with framer-motion (already a dependency)
- Has a header bar with title "Graphing Calculator" and a close (X) button
- The Desmos calculator fills the remaining height
- z-index should be below modals (z-40) but above page content

Props:
  - isOpen: boolean
  - onClose: () => void

Styling:
  - Uses existing CSS custom properties (--popover, --glass-border, etc.)
  - Backdrop blur consistent with existing sidebar
  - Subtle shadow on the left edge
```

#### 3. `src/components/studyguide/DesmosToggleButton.tsx` — Floating Button
```
Purpose: A small floating action button (FAB) anchored to the bottom-right of the study guide reader.

Behavior:
  - Shows a calculator icon (lucide `Calculator` or custom Desmos icon)
  - Tooltip: "Open Graphing Calculator"
  - Click toggles the panel open/closed
  - Badge or glow when panel is open
  - Only renders when guide.subject is "Geometry" or "Physics" or "Calculus" or "Number Theory"

Styling:
  - 48×48px rounded-full button
  - Uses --primary color
  - position: fixed, bottom: 1.5rem, right: 1.5rem
  - Shifts left when panel is open to stay visible
```

#### 4. `src/app/studyguides/[guideId]/page.tsx` — Integration
```
Changes needed:
  - Import DesmosPanel and DesmosToggleButton
  - Add state: const [desmosOpen, setDesmosOpen] = useState(false)
  - Determine if Desmos should show: 
      const showDesmos = ["Geometry", "Physics", "Calculus", "Number Theory"].includes(guide.subject)
  - Adjust main content flex layout: when desmosOpen && showDesmos, 
    the content area gets `mr-[420px]` on desktop (or use flex shrink)
  - Render DesmosToggleButton (only if showDesmos) 
  - Render DesmosPanel (only if showDesmos)
```

### UX Flow
```
┌──────────────────────────────────────────────────┐
│  Sidebar  │         Study Guide Content          │ [calc icon]
│  (lessons)│                                      │
│           │  Theorems, Examples, Problems...      │
│           │                                      │
│           │                                      │
└──────────────────────────────────────────────────┘

  ↓ User clicks calculator icon ↓

┌────────────────────────────────────────┬─────────┐
│  Sidebar  │    Study Guide Content     │ Desmos  │
│  (lessons)│    (shrinks to fit)        │ Graphing│
│           │                            │ Calc    │
│           │                            │ (420px) │
│           │                            │         │
└────────────────────────────────────────┴─────────┘
```

---

## Feature 2 — Teacher Accounts & Admin Role Assignment

### Concept
Add a `TEACHER` role alongside the existing `USER` and `ADMIN` roles. **Only admins** can promote a user to `TEACHER`. Teachers get access to the PDF homework generation feature.

### Database Changes

#### `prisma/schema.prisma` — User Model
```prisma
# Change the role field comment and default:
role  String  @default("USER")  // USER | TEACHER | ADMIN
```
No migration needed since `role` is already a `String` field — we're just adding a new valid value. Application code enforces the enum.

### Architecture

```
src/
├── lib/
│   └── auth-helpers.ts               ← New — helper: isTeacher(), isAdminOrTeacher()
├── app/
│   └── api/
│       └── admin/
│           └── users/
│               └── role/
│                   └── route.ts       ← New — PATCH endpoint to change user role
│   └── admin/
│       └── dashboard/
│           └── page.tsx               ← Modified — add role dropdown to user management
├── components/
│   └── layout/
│       └── sidebar.tsx                ← Modified — show "Homework" nav for teachers
│       └── top-bar.tsx                ← Modified — show teacher badge
├── types/
│   └── next-auth.d.ts                ← Modified — ensure role type includes "TEACHER"
```

### Detailed File Changes

#### 1. `src/lib/auth-helpers.ts` — Role Helpers
```typescript
Purpose: Centralized role-checking helpers.

Exports:
  - isTeacher(session): boolean — true if role === "TEACHER" or role === "ADMIN"
  - isAdmin(session): boolean — true if role === "ADMIN"
  - requireTeacher(session): throws if not teacher
  - requireAdmin(session): throws if not admin
```

#### 2. `src/app/api/admin/users/role/route.ts` — Role Assignment API
```
Method: PATCH
Auth: Admin only (verifyAdminAuth)
Body: { userId: string, role: "USER" | "TEACHER" | "ADMIN" }

Validation:
  - Cannot change own role
  - Cannot set role to anything other than USER, TEACHER, ADMIN
  - Cannot demote the last ADMIN

Logic:
  - prisma.user.update({ where: { id: userId }, data: { role } })
  - Return updated user
```

#### 3. `src/app/admin/dashboard/page.tsx` — UI for Role Management
```
Changes needed in the Users panel:
  - Add a role dropdown/selector next to each user row
  - Options: "User", "Teacher", "Admin"
  - Calls PATCH /api/admin/users/role on change
  - Shows current role with color-coded badge:
    - USER → gray
    - TEACHER → blue  
    - ADMIN → purple/gold
  - Toast on success/failure
```

#### 4. `src/components/layout/sidebar.tsx` — Teacher Nav Item
```
Changes:
  - Add a nav item for "Homework Creator" that shows when:
      session?.user?.role === "TEACHER" || session?.user?.role === "ADMIN"
  - Icon: FileText or Printer
  - Route: /teacher/homework
```

### Authorization Matrix

| Action | USER | TEACHER | ADMIN |
|--------|------|---------|-------|
| View study guides | ✅ | ✅ | ✅ |
| Use Desmos panel | ✅ | ✅ | ✅ |
| Create flashcard sets | ✅ | ✅ | ✅ |
| Generate PDF homework | ❌ | ✅ | ✅ |
| Assign teacher role | ❌ | ❌ | ✅ |
| Access admin dashboard | ❌ | ❌ | ✅ |

---

## Feature 3 — PDF Homework Generator from Study Sets

### Concept
Teachers can select any **public flashcard set** (or their own sets) and generate a **formatted PDF worksheet** suitable for classroom homework. The PDF includes:
- Header with teacher name, class name, date, and student name field
- Questions generated from flashcard terms (fill-in-the-blank, matching, multiple choice)
- Optional answer key as a separate page
- Clean, print-friendly formatting

### Architecture

```
src/
├── app/
│   └── teacher/
│       └── homework/
│           └── page.tsx               ← New — Homework Creator page
│           └── layout.tsx             ← New — Auth guard for teacher role
│   └── api/
│       └── teacher/
│           └── homework/
│               └── generate/
│                   └── route.ts       ← New — Server-side PDF generation endpoint
├── components/
│   └── teacher/
│       └── HomeworkBuilder.tsx         ← New — Main builder UI
│       └── SetSelector.tsx            ← New — Search/browse sets to include
│       └── QuestionFormatPicker.tsx   ← New — Choose question types
│       └── HomeworkPreview.tsx        ← New — Live preview of the worksheet
│       └── PDFRenderer.tsx            ← New — Uses jsPDF (already installed!) to build PDF
├── lib/
│   └── pdf-generator.ts              ← New — Core PDF generation logic
├── types/
│   └── homework.ts                   ← New — TypeScript interfaces
```

### Detailed File Changes

#### 1. `src/types/homework.ts` — Type Definitions
```typescript
export interface HomeworkConfig {
  title: string               // "Chapter 5 Vocabulary Quiz"
  teacherName: string
  className: string           // "AP Biology Period 3"
  date: string
  instructions: string
  includeAnswerKey: boolean
  includeNameField: boolean
  includeWordBank: boolean    // for fill-in-the-blank
  questionTypes: QuestionType[]
  selectedSetIds: string[]
  questionsPerSet: number     // how many cards to sample per set
  shuffleQuestions: boolean
}

export type QuestionType = 
  | "definition-to-term"      // Given definition, write the term
  | "term-to-definition"      // Given term, write the definition
  | "multiple-choice"         // 4 choices generated from other cards
  | "matching"                // Match terms to definitions
  | "fill-in-blank"           // Definition with blanked-out key word

export interface GeneratedQuestion {
  id: string
  type: QuestionType
  prompt: string
  answer: string
  choices?: string[]          // for multiple-choice
  matchPairs?: { term: string; definition: string }[]  // for matching
}

export interface HomeworkDocument {
  config: HomeworkConfig
  questions: GeneratedQuestion[]
  generatedAt: string
}
```

#### 2. `src/lib/pdf-generator.ts` — PDF Generation Engine
```
Purpose: Takes a HomeworkDocument and produces a jsPDF instance.

Uses: jsPDF (already in package.json as "jspdf": "^4.2.0")

Layout:
  - Page size: Letter (8.5" × 11")
  - Margins: 0.75" all sides
  - Header: Title (18pt bold), Teacher name, class, date
  - Student info: "Name: ____________  Date: ____________"
  - Instructions block (italic, smaller font)
  - Questions: numbered list with appropriate spacing
    - Definition-to-term: "1. [definition] → Answer: __________"
    - Multiple choice: "1. [prompt]\n   a) ... b) ... c) ... d) ..."
    - Matching: Two-column layout with lines
    - Fill-in-blank: "[sentence with _____ ]"
  - Answer key: New page, same numbering, answers filled in
  - Footer: "Page X of Y"

Functions:
  - generateHomeworkPDF(doc: HomeworkDocument): jsPDF
  - generateQuestions(sets: FlashcardSet[], config: HomeworkConfig): GeneratedQuestion[]
  - shuffleArray<T>(arr: T[]): T[]
```

#### 3. `src/app/teacher/homework/layout.tsx` — Auth Guard
```typescript
Purpose: Protect the /teacher/* routes. Redirect non-teachers.

Logic:
  - Check session
  - If role !== "TEACHER" && role !== "ADMIN", redirect to "/"
  - Otherwise render children
```

#### 4. `src/app/teacher/homework/page.tsx` — Main Page
```
Purpose: Page shell that renders the HomeworkBuilder component.

Layout:
  - Full-width page with header "Homework Creator"
  - Description: "Create printable PDF worksheets from your flashcard sets"
  - Renders <HomeworkBuilder />
```

#### 5. `src/components/teacher/HomeworkBuilder.tsx` — Builder UI
```
Purpose: The main multi-step builder interface.

Steps / Sections (single-page form, not wizard):
  ┌─────────────────────────────────────────────────┐
  │  1. WORKSHEET INFO                              │
  │     Title: [_______________]                    │
  │     Class: [_______________]  Date: [________]  │
  │     Instructions: [________________________]    │
  │                                                 │
  │  2. SELECT STUDY SETS                           │
  │     [Search bar]                                │
  │     ┌──────┐ ┌──────┐ ┌──────┐                │
  │     │ Set1 │ │ Set2 │ │ Set3 │  (selectable)  │
  │     └──────┘ └──────┘ └──────┘                │
  │     Selected: 2 sets (45 cards total)           │
  │                                                 │
  │  3. QUESTION FORMAT                             │
  │     ☑ Term → Definition  ☑ Multiple Choice     │
  │     ☐ Matching           ☐ Fill-in-the-Blank   │
  │     Questions per set: [10 ▾]                   │
  │     ☑ Shuffle questions                         │
  │                                                 │
  │  4. OPTIONS                                     │
  │     ☑ Include answer key  ☑ Include word bank   │
  │     ☑ Student name field                        │
  │                                                 │
  │  [Preview]  [Download PDF]                      │
  └─────────────────────────────────────────────────┘

State management:
  - useState for HomeworkConfig
  - useQuery to fetch available sets (public + own)
  - Client-side PDF generation via jsPDF (no server round-trip needed)
```

#### 6. `src/components/teacher/SetSelector.tsx` — Set Browser
```
Purpose: Search and select flashcard sets to include in the homework.

Features:
  - Search input with debounce
  - Fetches from /api/sets?search=...&public=true (existing endpoint) + own sets
  - Card grid showing set title, card count, creator
  - Click to toggle selection (checkbox overlay)
  - Selected sets shown as chips below the search
  - Shows total card count across all selected sets
```

#### 7. `src/components/teacher/QuestionFormatPicker.tsx` — Format Options
```
Purpose: Let teacher choose which question types to include.

UI:
  - Checkbox list of question types with descriptions:
    - "Write the Term" — Shows definition, student writes the term
    - "Write the Definition" — Shows term, student writes definition
    - "Multiple Choice" — Auto-generated 4-option questions
    - "Matching" — Column of terms matched to column of definitions
    - "Fill in the Blank" — Sentence with key word blanked out
  - Slider or dropdown for "questions per set" (5, 10, 15, 20, All)
  - Toggle for "Shuffle question order"
```

#### 8. `src/components/teacher/HomeworkPreview.tsx` — Live Preview
```
Purpose: Rendered HTML preview of what the PDF will look like.

Features:
  - Mirrors the PDF layout in HTML/CSS
  - Updates in real-time as config changes  
  - Print-friendly styles (white background, black text, clean borders)
  - Shows page breaks where they'd appear in the PDF
  - Button to toggle answer key visibility
```

---

## Database Migrations

### No schema migration needed for the role change
The `User.role` field is already a `String` — we're just adding `"TEACHER"` as a recognized value. Validation happens in application code.

### Optional: Track generated homework (future enhancement)
```prisma
model Homework {
  id          String   @id @default(cuid())
  title       String
  config      Json     // stores HomeworkConfig
  createdAt   DateTime @default(now())
  
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  setIds      String[] // which sets were used
}
```
> This is **optional for v1**. We can add it later if teachers want to save/re-download past worksheets.

---

## File-by-File Implementation Checklist

### New Files to Create

| # | File | Purpose |
|---|------|---------|
| 1 | `.env.local` | Add `NEXT_PUBLIC_DESMOS_API_KEY` |
| 2 | `src/hooks/useDesmos.ts` | Desmos script loader + calculator instance hook |
| 3 | `src/components/studyguide/DesmosPanel.tsx` | Collapsible right-side calculator panel |
| 4 | `src/components/studyguide/DesmosToggleButton.tsx` | Floating button to toggle Desmos |
| 5 | `src/lib/auth-helpers.ts` | `isTeacher()`, `isAdmin()` role utilities |
| 6 | `src/app/api/admin/users/role/route.ts` | PATCH endpoint for role assignment |
| 7 | `src/types/homework.ts` | TypeScript types for homework feature |
| 8 | `src/lib/pdf-generator.ts` | jsPDF-based PDF generation logic |
| 9 | `src/app/teacher/homework/layout.tsx` | Auth guard for teacher routes |
| 10 | `src/app/teacher/homework/page.tsx` | Homework creator page |
| 11 | `src/components/teacher/HomeworkBuilder.tsx` | Main builder form UI |
| 12 | `src/components/teacher/SetSelector.tsx` | Flashcard set search & selector |
| 13 | `src/components/teacher/QuestionFormatPicker.tsx` | Question type picker |
| 14 | `src/components/teacher/HomeworkPreview.tsx` | Live HTML preview |
| 15 | `src/components/teacher/PDFRenderer.tsx` | Client-side PDF download trigger |

### Existing Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/app/studyguides/[guideId]/page.tsx` | Add Desmos panel state + render |
| 2 | `src/app/admin/dashboard/page.tsx` | Add role dropdown to user management |
| 3 | `src/components/layout/sidebar.tsx` | Add "Homework Creator" nav for teachers |
| 4 | `src/components/layout/top-bar.tsx` | Show teacher role badge |
| 5 | `prisma/schema.prisma` | Update role comment (no migration) |

---

## Implementation Order

Recommended order to implement (each phase is independently deployable):

### Phase 1 — Desmos Calculator Panel (Est. 3-4 hours)
```
1.  Add NEXT_PUBLIC_DESMOS_API_KEY to .env.local
2.  Create src/hooks/useDesmos.ts
3.  Create src/components/studyguide/DesmosPanel.tsx
4.  Create src/components/studyguide/DesmosToggleButton.tsx
5.  Modify src/app/studyguides/[guideId]/page.tsx
6.  Test on Geometry, Physics, Calculus, and Number Theory guides
7.  Verify it doesn't appear on non-math guides
8.  Test mobile responsiveness
```

### Phase 2 — Teacher Role System (Est. 2-3 hours)
```
1.  Create src/lib/auth-helpers.ts
2.  Create src/app/api/admin/users/role/route.ts
3.  Modify src/app/admin/dashboard/page.tsx (role dropdown)
4.  Modify src/components/layout/sidebar.tsx (teacher nav)
5.  Modify src/components/layout/top-bar.tsx (teacher badge)
6.  Update prisma/schema.prisma comment
7.  Test: admin promotes user → user sees teacher nav
8.  Test: regular user cannot access /teacher/* routes
```

### Phase 3 — PDF Homework Generator (Est. 5-6 hours)
```
1.  Create src/types/homework.ts
2.  Create src/lib/pdf-generator.ts
3.  Create src/app/teacher/homework/layout.tsx
4.  Create src/app/teacher/homework/page.tsx
5.  Create src/components/teacher/SetSelector.tsx
6.  Create src/components/teacher/QuestionFormatPicker.tsx
7.  Create src/components/teacher/HomeworkPreview.tsx
8.  Create src/components/teacher/HomeworkBuilder.tsx (depends on 5-7)
9.  Create src/components/teacher/PDFRenderer.tsx
10. Test: select sets → configure → preview → download PDF
11. Test: verify answer key generation
12. Test: multiple choice randomization
13. Test: matching section layout
```

### Phase 4 — Polish & QA (Est. 1-2 hours)
```
1.  Cross-browser PDF download testing
2.  Mobile responsiveness for all new UI
3.  Desmos panel keyboard accessibility
4.  Empty state handling (no sets selected, etc.)
5.  Error handling for PDF generation failures
6.  Loading states for set fetching
```

---

## Security Notes

1. **Desmos API Key**: Stored in `NEXT_PUBLIC_DESMOS_API_KEY`. This is a client-side key that's domain-restricted by Desmos — exposure in the browser bundle is expected and is how the Desmos API works. It is **not** a secret key.

2. **Teacher Role Assignment**: Only the `/api/admin/users/role` endpoint can change roles, and it's protected by `verifyAdminAuth()`. No self-promotion is possible.

3. **PDF Generation**: Happens entirely client-side using `jsPDF` (already installed). No sensitive data is sent to any external service. The sets data is fetched via existing authenticated API endpoints.

4. **Route Protection**: `/teacher/*` pages are wrapped in a layout that checks for `TEACHER` or `ADMIN` role before rendering.

---

## Dependencies

| Package | Status | Purpose |
|---------|--------|---------|
| `jspdf` | ✅ Already installed (v4.2.0) | PDF generation |
| `framer-motion` | ✅ Already installed | Panel animations |
| `lucide-react` | ✅ Already installed | Icons |
| `next-auth` | ✅ Already installed | Auth & roles |
| Desmos API | External script (CDN) | Graphing calculator |

**No new npm packages needed.**
