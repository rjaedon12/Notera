# Notera — Complete Project Overview

> **Generated:** March 26, 2026  
> **Version:** 0.1.0  
> **Tagline:** *Learn smarter. Master anything.*

---

## Table of Contents

1. [What Is Notera?](#what-is-notera)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Feature Breakdown](#feature-breakdown)
5. [Database Schema](#database-schema)
6. [API Surface](#api-surface)
7. [Frontend Structure](#frontend-structure)
8. [Testing](#testing)
9. [Deployment & Infrastructure](#deployment--infrastructure)
10. [Current Strengths](#current-strengths)
11. [Future Improvements — Making Notera 1000x Better](#future-improvements--making-notera-1000x-better)

---

## What Is Notera?

Notera is a **full-stack, adaptive study platform** built with Next.js 16. It's an ambitious all-in-one learning tool that combines:

- **Flashcard-based spaced repetition** (SM-2 + FSRS algorithms)
- **Interactive math visualizers** (11 tools from high school → college level)
- **Rich Notion-style notes** with nested pages and TipTap editor
- **Collaborative whiteboard** with real-time cursors (Liveblocks)
- **Document-Based Question (DBQ) essay workspace** for AP History prep
- **Music sight-reading** practice with VexFlow notation
- **Spaces** (collaborative study spaces & teacher classrooms), a **community forum**, **quizzes**, **timelines**, and **achievements/gamification**

It targets students from high school through college, with special strength in AP History, mathematics, and foreign language vocabulary.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server components, API routes, SSR/SSG |
| **Language** | TypeScript 5 | End-to-end type safety |
| **UI Library** | React 19 | Component model |
| **Styling** | Tailwind CSS v4 | Utility-first styling |
| **Animation** | Framer Motion | Page transitions, micro-interactions |
| **Database** | PostgreSQL (Neon serverless) | Persistent storage |
| **ORM** | Prisma 6 (with Neon adapter) | Type-safe DB access |
| **Auth** | NextAuth.js v5 | Credentials + Google + GitHub OAuth |
| **State / Data Fetching** | TanStack React Query | Server state, caching, mutations |
| **Rich Text** | TipTap (ProseMirror) | Notes editor with 15+ extensions |
| **Canvas** | Fabric.js, p5.js | Whiteboard drawing engine |
| **Real-time** | Liveblocks | Multiplayer cursors & presence |
| **Math** | KaTeX, mathjs | LaTeX rendering, symbolic computation |
| **Music** | VexFlow | Sheet music notation rendering |
| **Charts** | Chart.js + react-chartjs-2 | Analytics dashboards |
| **Drag & Drop** | dnd-kit, @hello-pangea/dnd | Sortable lists, timeline builder |
| **Spaced Repetition** | ts-fsrs | FSRS algorithm for optimal review scheduling |
| **PDF** | jsPDF, html2canvas | Homework/worksheet PDF export |
| **Validation** | Zod 4 | Runtime schema validation |
| **Testing** | Vitest + Testing Library | Unit and integration tests |
| **String Matching** | Custom Levenshtein | Fuzzy matching for study modes |

### Notable Dependencies Count
- **50+ production dependencies**
- **15+ dev dependencies**
- Monolithic package — no workspace/monorepo separation

---

## Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────┐
│                    Client (Browser)                  │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  React   │  │ TanStack │  │    Liveblocks     │  │
│  │  19 +    │  │  Query   │  │  (Real-time WS)   │  │
│  │ Next.js  │  │  Cache   │  │                   │  │
│  └────┬─────┘  └────┬─────┘  └───────────────────┘  │
│       │              │                               │
└───────┼──────────────┼───────────────────────────────┘
        │              │
        ▼              ▼
┌─────────────────────────────────────────────────────┐
│              Next.js 16 App Router                   │
│  ┌──────────────────┐  ┌──────────────────────────┐  │
│  │  Server Components│  │  API Routes (/api/*)     │  │
│  │  (pages, layouts) │  │  30+ REST endpoints      │  │
│  └──────────────────┘  └────────────┬─────────────┘  │
│                                     │                │
│  ┌──────────────────────────────────┤                │
│  │  NextAuth v5 (middleware auth)   │                │
│  └──────────────────────────────────┘                │
└─────────────────────────────┬───────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────┐
│           Prisma ORM (with Neon Adapter)             │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  PostgreSQL on Neon (Serverless)             │    │
│  │  35+ models · 5 enums · Full relational DB   │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### Rendering Strategy
- **Server Components** for initial page loads and data fetching
- **Client Components** (`"use client"`) for interactive features (study modes, whiteboard, editors)
- **API Routes** for mutations and complex data operations
- **TanStack React Query** for client-side cache, optimistic updates, and background refetching

### Authentication Flow
- NextAuth v5 with Prisma Adapter
- Three providers: Credentials (bcrypt), Google OAuth, GitHub OAuth
- Role-based access: `USER` → `TEACHER` → `ADMIN`
- Session-based auth with CSRF protection
- Admin audit logging for sensitive actions (password resets, etc.)

---

## Feature Breakdown

### 1. 📚 Flashcard Study System
**Core of the app.** Full Quizlet-style flashcard engine.

| Capability | Details |
|---|---|
| CRUD | Create/edit/delete sets with terms, definitions, tags, descriptions |
| 5 Study Modes | Flashcards (flip), Learn (typed answers), Test (MC + written), Match (drag pairs), Timed (speed round) |
| Spaced Repetition | Dual engine — SM-2 (legacy) + **FSRS** (modern, via `ts-fsrs`) |
| Daily Review | Queue of due cards calculated from SRS intervals |
| Starring | Star individual cards or entire sets for quick access |
| Folders | Organize sets into named folders |
| Public/Private | Share sets publicly or keep them private |
| Comments & Ratings | Community feedback on public sets (1–5 stars) |
| Discover Page | Browse/search publicly shared sets |
| CSV Import | Bulk import from CSV files (vocabulary lists, etc.) |

### 2. 🧮 Math Lab — 11 Interactive Visualizers

| Visualizer | Component | Level |
|---|---|---|
| Sieve of Eratosthenes | `PrimeSieve.tsx` | High School |
| Modular Clock | `ModularClock.tsx` | High School |
| Equation Solver | `EquationSolver.tsx` | High School |
| Base Converter | `BaseConverter.tsx` | High School |
| Graphing Calculator | `GraphingCalculator.tsx` | HS + College |
| GCD Visualizer | `GCDVisualizer.tsx` | HS + College |
| Statistics Playground | `StatsPlayground.tsx` | HS + College |
| Computer Algebra System | `ComputerAlgebra.tsx` | College |
| Euler's Totient | `EulerTotient.tsx` | College |
| Matrix Visualizer | `MatrixVisualizer.tsx` | College |
| Riemann Sum | `RiemannSum.tsx` | College |

All wrapped in a shared `VisualizerShell.tsx` with `ErrorBoundary.tsx` for crash resilience.

### 3. 📝 Notes System (Notion-Style)
- **Hierarchical pages** — nested parent/child note tree
- **TipTap editor** with 15+ extensions: bold, italic, underline, code blocks (syntax-highlighted via lowlight), tables, task lists, images, links, typography, character count, bubble menu, color, highlight
- **Cover images** and **emoji icons** per page
- **Sidebar tree** with drag-and-drop reordering
- **Archive** and **favorites** functionality
- **Public sharing** toggle
- **Space-attached notes** for collaborative study

### 4. 🎨 Whiteboard (Collaborative Drawing)
- **Fabric.js** canvas engine for freeform drawing
- **Liveblocks** integration for real-time multiplayer (cursors, presence avatars)
- Tools: pen, shapes, text, selection, eraser
- Backgrounds: plain, dots, grid, lined
- **Share links** with permission levels (Owner / Editor / Viewer)
- **Thumbnail generation** for board previews
- Persistent board storage in the database

### 5. 📜 DBQ (Document-Based Questions)
Purpose-built workspace for AP History exam prep:
- Admin-seeded **DBQ prompts** with multiple source documents
- Pre-loaded prompts: Industrial Revolution, Mongol Empire, US Imperialism, and more
- **Highlight documents** with color-coded annotations
- **Inline essay editor** with word count tracking
- Essay submission and review

### 6. 🎵 Sight Reading
- Music notation rendered via **VexFlow**
- Practice modes: treble, bass, alto clefs
- Difficulty levels: naturals, sharps, flats, all accidentals
- Score tracking (correct/total per attempt)

### 7. 📊 Study Guides
Structured, interactive study guides for specific subjects:
- **Calculus** (derivatives, integrals, theorems)
- **Physics — Mechanics** (kinematics, Newton's laws, energy)
- **Physics — Electromagnetism** (Coulomb's law, circuits, fields)
- **Number Theory** (primes, modular arithmetic, Euler's theorem)
- **Geometry — Circles** (Chapter 10 coverage)

Features: highlighting, note-taking, progress tracking per section, problem-by-problem completion.

### 8. 🤝 Spaces (Study Spaces & Teacher Classrooms)
- Create/join spaces via invite codes
- **Two types:** Collaborative (peer study) and Classroom (teacher-managed)
- Auto-detected based on user role: teachers create Classrooms, students create Collaborative spaces
- Share flashcard sets within spaces
- **Teacher Assignments:** Assign study sets, quizzes, or DBQ prompts with optional due dates
- **Streak Leaderboard:** Members ranked by study streak with medal indicators
- **Announcements:** Owners/moderators can post announcements with in-app notifications
- Member role management (Owner / Moderator / Member / Student)
- Space-level note pages

### 9. 💬 Community Forum
- Create discussion posts
- Threaded replies with nested `parentReplyId`
- Reactions (like/dislike) on posts and replies
- Admin pinning for important threads

### 10. 🏆 Gamification & Progress
- **Streak system** — Duolingo-style daily study streaks
- **Achievements** — milestone-based unlockables (e.g., `first_set`, `streak_7`, `cards_100`)
- **Analytics dashboard** — charts visualizing study sessions over time
- **Per-card mastery** — track correct/incorrect counts, status (New → Learning → Mastered)

### 11. ⏱️ Timeline Builder
- Drag-and-drop timeline events on a canvas
- Events with date labels, titles, descriptions, and (x, y) positioning
- Directional arrows connecting events with labels
- Backed by `Resource` → `TimelineEvent` → `TimelineArrow` models

### 12. 📋 Quizzes
- Structured question banks separate from flashcards
- Multiple-choice questions with explanations
- Passage-based questions (reading comprehension style)
- Scoring and attempt history

### 13. 🔔 Notifications & Announcements
- In-app notification system (space invites, space assignments, space announcements, achievements, study reminders, etc.)
- Admin broadcast announcements with types (INFO, WARNING, UPDATE, MAINTENANCE)
- Dismissible per user

### 14. 👨‍🏫 Teacher Features
- Teacher role (admin-assigned)
- **PDF Homework Generator** — export flashcard sets as formatted worksheets
- Question format options: write the term, write the definition, multiple choice, matching, fill-in-the-blank

### 15. 🛡️ Admin Dashboard
- User management (ban, force password change, role assignment)
- Content moderation (sets, DBQ prompts, forum posts)
- Announcement system
- Admin audit logging for accountability
- AES-256-GCM encrypted password storage for admin recovery

---

## Database Schema

### Summary: 35+ Models, 5 Enums

| Category | Models |
|---|---|
| **Auth** | User, Account, Session, VerificationToken |
| **Flashcards** | FlashcardSet, Flashcard, StudyProgress, CardProgress, UserFlashcardProgress (FSRS) |
| **Organization** | Folder, FolderSet, StarredSet, SavedSet, StarredCard |
| **Spaces** | Space, SpaceMember, SpaceSet, SpaceAssignment, SpaceAnnouncement |
| **Social** | Comment, Rating, ForumPost, ForumReply, ForumReaction |
| **Notes** | NotePage (self-referential hierarchy) |
| **Whiteboard** | WhiteboardBoard, WhiteboardMember, WhiteboardShareLink |
| **Quizzes** | QuestionBank, Question, Choice, QuizAttempt, AttemptAnswer |
| **Resources** | Resource, TimelineEvent, TimelineArrow |
| **DBQ** | DBQPrompt, DBQDocument, DBQEssay |
| **Gamification** | UserAchievement, StudySession, SightreadingAttempt |
| **System** | Notification, Announcement, AnnouncementDismissal, AdminAuditLog |

### Enums
`StudyMode` · `CardStatus` · `SpaceType` · `SpaceRole` · `NotificationType` · `WhiteboardRole`

---

## API Surface

30+ REST API route groups under `/api/`:

| Endpoint Group | Purpose |
|---|---|
| `/api/auth/*` | Sign up, sign in, password reset, change password |
| `/api/sets/*` | CRUD for flashcard sets |
| `/api/cards/*` | Individual card operations, starring |
| `/api/folders/*` | Folder management |
| `/api/spaces/*` | Space CRUD, membership, shared sets, assignments, announcements, leaderboard |
| `/api/notes/*` | Note pages CRUD, hierarchy |
| `/api/dbq/*` | DBQ prompts, documents, essay submission |
| `/api/quizzes/*` | Question banks, attempts, answers |
| `/api/forum/*` | Posts, replies, reactions |
| `/api/resources/*` | Document/resource management |
| `/api/timeline/*` | Timeline event operations |
| `/api/sightreading/*` | Attempt logging |
| `/api/analytics/*` | Progress data for charts |
| `/api/achievements/*` | Achievement checks and unlocks |
| `/api/streak/*` | Streak calculation and updates |
| `/api/daily-review/*` | SRS-based review queue |
| `/api/srs/*` | FSRS scheduling endpoints |
| `/api/notifications/*` | Notification management |
| `/api/announcements/*` | Admin broadcasts |
| `/api/admin/*` | Admin dashboard operations |
| `/api/ai/*` | AI-related features |
| `/api/upload/*` | Image upload handling |
| `/api/user/*` | Profile, password, recent studies |
| `/api/starred/*` | Starred sets/cards |
| `/api/saved/*` | Saved sets |
| `/api/tags/*` | Tag browsing |
| `/api/sessions/*` | Study session logging |
| `/api/review/*` | Review session endpoints |
| `/api/progress/*` | Progress tracking |

---

## Frontend Structure

### Pages (20+ routes)

| Route | Feature |
|---|---|
| `/` | Landing page with hero, features, popular sets, CTA |
| `/login`, `/signup` | Authentication |
| `/library` | Personal flashcard set library |
| `/create` | New flashcard set builder |
| `/sets/[setId]` | Set detail + study mode launcher |
| `/discover` | Browse public sets |
| `/daily-review` | Spaced repetition review queue |
| `/spaces/*` | Study spaces & teacher classrooms |
| `/notes/*` | Notion-style notes |
| `/whiteboard/*` | Collaborative drawing boards |
| `/math/*` | Math Lab with 11 sub-routes |
| `/dbq/*` | DBQ workspace |
| `/quizzes/*` | Quiz system |
| `/forum/*` | Community forum |
| `/studyguides/*` | Interactive study guides |
| `/sightreading/*` | Music practice |
| `/timeline-builder/*` | Timeline creator |
| `/analytics` | Progress analytics |
| `/achievements` | Achievement showcase |
| `/settings` | User preferences |
| `/admin/dashboard` | Admin control panel |
| `/teacher/*` | Teacher tools |
| `/experimental` | Beta features |

### Component Library

| Category | Components |
|---|---|
| **UI Primitives** | Button, Card, Input, Label, Dialog, Popover, Badge, Skeleton, Slider, Switch, Textarea, ThemePicker |
| **Layout** | Shell, Sidebar, Header |
| **Study** | FlipCard, ModeTiles, MultipleChoice, StudyControls |
| **Math** | 11 Visualizer components + VisualizerShell + ErrorBoundary |
| **Notes** | NoteEditor, NoteSidebar, NotePageTree, BubbleToolbar, BlockMenu, CoverImagePicker, IconPicker, + TipTap extensions |
| **Whiteboard** | Canvas, Toolbar, TopBar, ColorPicker, ShareDialog, Cursors, PresenceAvatars, SelectionOverlay, BoardCard |
| **Study Guides** | Highlighting, notes, progress components |
| **Sightreading** | Staff renderer, note picker |
| **Landing** | HeroSection, FeatureSections, PopularSetsPreview, StatsBand, CTASection, Footer, Navbar |
| **Streak** | Streak display components |
| **Teacher** | Homework builder components |

### Custom Hooks (10)

| Hook | Purpose |
|---|---|
| `useStudy` | Flashcard study mode state machine |
| `useDBQ` | DBQ data fetching and essay mutations |
| `useQuiz` | Quiz attempt state management |
| `useNotePages` | Note CRUD with TanStack Query |
| `useWhiteboardCanvas` | Fabric.js canvas lifecycle |
| `useCollaboration` | Liveblocks real-time sync |
| `useDesmos` | Desmos calculator integration |
| `useStudyGuide` | Study guide progress and highlights |
| `useAutoSave` | Debounced auto-save for editors |
| `usePyodide` | Python execution in browser via Pyodide |

---

## Testing

- **Framework:** Vitest + Testing Library + jsdom
- **Test files:** 8 test suites in `src/test/`
  - `admin.test.ts` — Admin operations
  - `computer-algebra.test.ts` — CAS functionality
  - `spaces.test.ts` — Space access control and type detection
  - `persistence.test.ts` — Data persistence
  - `resources.test.ts` — Resource management
  - `streak.test.ts` — Streak calculations
  - `timeline-save.test.ts` — Timeline persistence
  - `timeline.test.ts` — Timeline operations
- **Coverage:** Primarily integration-level tests, focused on core business logic

---

## Deployment & Infrastructure

| Aspect | Details |
|---|---|
| **Hosting** | Vercel (recommended) |
| **Database** | Neon serverless PostgreSQL (free tier compatible) |
| **Connection** | Pooled (app) + Direct (Prisma CLI) dual connection strings |
| **Build** | `next build` with Prisma generate in `postinstall` |
| **CI/CD** | Vercel auto-deploys from GitHub push |
| **Environment** | 8 env vars (DATABASE_URL, DIRECT_URL, AUTH_SECRET, NEXTAUTH_URL, OAuth IDs/secrets) |

---

## Current Strengths

1. **Incredibly feature-rich** — This is essentially Quizlet + Notion + Desmos + a whiteboard + a forum in a single app
2. **Modern stack** — Next.js 16, React 19, TypeScript throughout, Tailwind v4
3. **Proper spaced repetition** — FSRS is a research-backed, state-of-the-art algorithm
4. **Real-time collaboration** — Liveblocks on the whiteboard is a genuine differentiator
5. **Comprehensive data model** — 35+ well-structured Prisma models with proper relations
6. **Role-based access** — USER → TEACHER → ADMIN with audit logging
7. **Self-contained** — No external paid APIs required for core functionality
8. **AP History focus** — DBQ tool is genuinely useful and unique
9. **Math depth** — 11 interactive visualizers covering high school through college math
10. **Polished UI** — Tailwind + Framer Motion + Lucide icons + theme system

---

## Future Improvements — Making Notera 1000x Better

### 🔴 Critical (Foundational)

#### 1. AI-Powered Learning Engine
- **AI-generated flashcards** — Paste notes/textbook text → auto-extract terms & definitions (OpenAI / Anthropic API)
- **AI essay grading for DBQs** — Score essays against AP rubrics with specific feedback (thesis, evidence, analysis)
- **Intelligent study recommendations** — "You're weakest in Chapter 5 vocab — study these 12 cards"
- **AI tutor chat** — Per-subject conversational tutor that references the user's own flashcards and notes
- **Auto-generated practice questions** — Turn any flashcard set into multiple choice, fill-in-the-blank, or short answer

#### 2. Mobile App (React Native / Expo)
- A web app alone will always lose to Quizlet/Anki on mobile
- **Offline-first architecture** with sync — study on the subway without signal
- Push notifications for streak reminders and daily reviews
- Quick-study widget for iOS/Android home screens
- Camera integration — scan handwritten notes → create flashcards via OCR

#### 3. Performance & Scalability
- **Move to a monorepo** (Turborepo) — separate `packages/db`, `packages/ui`, `apps/web`, `apps/api`
- **Add Redis/Upstash** for caching hot data (popular public sets, streak counts, leaderboards)
- **Implement ISR/SSG** for public set pages and study guides (currently everything is dynamic)
- **Database indexing audit** — add composite indexes for common query patterns (user + set + mode, etc.)
- **Image/asset CDN** — use Cloudflare R2 or Vercel Blob for uploads instead of direct URLs
- **Connection pooling** — ensure Neon's pooler is optimally configured for serverless cold starts

#### 4. Comprehensive Testing
- **Increase test coverage to 80%+** — currently only 8 test files for 100+ components
- **Add E2E tests** with Playwright — cover critical user flows (signup → create set → study → review)
- **Component-level tests** — test every UI component with Testing Library
- **API route tests** — test every endpoint with mocked Prisma
- **Visual regression tests** — Chromatic or Percy for UI consistency
- **Load testing** — verify the app handles 1,000+ concurrent users

---

### 🟠 High Impact (Growth Multipliers)

#### 5. Social & Viral Features
- **Class/Course system** — teachers create classes, students join, sets are auto-shared
- **Live study sessions** — real-time multiplayer quiz games (like Kahoot but for flashcards)
- **Leaderboards** — per-class, per-subject, and global rankings
- **Study streaks leaderboard** — weekly/monthly streak competitions
- **Set forking** — fork any public set, customize it, and reshare
- **Activity feed** — "Sarah just mastered AP US History Chapter 12"

#### 6. Content Marketplace
- **Verified creator program** — top contributors get badges and promoted sets
- **Subject-organized library** — AP Biology, SAT Prep, Med School, Bar Exam, etc.
- **Pre-made premium content** — curated, expert-reviewed sets for every AP exam
- **Import from Quizlet/Anki** — migration tools to bring existing users over
- **Export to Anki (.apkg)** — give users their data in portable formats

#### 7. Advanced Study Modes
- **Adaptive difficulty** — questions get harder as you improve (not just binary correct/incorrect)
- **Cloze deletion** — automatically blank out key words in definitions
- **Image occlusion** — hide parts of diagrams (anatomy, maps, circuits) for testing
- **Audio flashcards** — text-to-speech for language learning, upload audio clips
- **Handwriting recognition** — draw kanji/characters, verify against correct stroke order
- **Pomodoro timer integration** — built-in study timer with automatic session logging

#### 8. Enhanced Notes
- **Notion-level block types** — databases, embeds, Mermaid diagrams, LaTeX blocks, callouts, toggles, columns
- **AI summarization** — "Summarize this 3-page note into 5 bullet points"
- **Note ↔ Flashcard linking** — highlight text in notes → auto-create flashcards
- **Version history** — git-style diffs for every note edit
- **Collaborative editing** — real-time multiplayer (Liveblocks or Yjs) on notes, not just whiteboards
- **Web clipper** — browser extension to clip web content into notes

---

### 🟡 Medium Impact (Polish & Differentiation)

#### 9. Analytics 2.0
- **Predicted exam scores** — based on mastery data, predict AP exam performance
- **Study time tracking** — how many minutes/hours per subject per week
- **Forgetting curve visualization** — show when each card is predicted to fade from memory
- **Heatmap calendar** — GitHub-style activity heatmap for study sessions
- **Parent/teacher dashboard** — read-only view of a student's progress

#### 10. Accessibility & Internationalization
- **Full WCAG 2.1 AA compliance** — screen reader support, keyboard navigation, contrast ratios
- **i18n framework** — translate the entire UI (start with Spanish, Mandarin, French, Japanese)
- **Dyslexia-friendly mode** — OpenDyslexic font, increased spacing, muted colors
- **Dark/light/high-contrast themes** (partially done — expand to system-level)

#### 11. Integrations
- **Google Classroom** — sync classes, assignments, and grades
- **Canvas LMS / Schoology** — LTI integration for embedding Notera in existing LMS
- **Notion import** — parse Notion exports into Notera notes
- **Google Docs/Slides import** — convert into study materials
- **Zapier/Make webhooks** — "When I create a flashcard set, share it to my Slack channel"
- **Calendar sync** — push review reminders to Google Calendar / Apple Calendar

#### 12. Whiteboard 2.0
- **Templates** — pre-built templates for mind maps, Venn diagrams, Cornell notes, concept maps
- **Sticky notes** — quick-add sticky notes to boards
- **Infinite canvas** — zoom/pan like Miro or FigJam
- **Shape library** — arrows, brackets, flowchart shapes
- **Export** — PNG, SVG, PDF export of boards
- **AI diagram generation** — "Draw a mind map of the causes of WWI"

---

### 🟢 Long-Term Vision (Platform Play)

#### 13. Platform & Monetization
- **Freemium model** — free tier (50 sets, basic features) + Pro ($5/month for unlimited, AI, analytics)
- **School/district licensing** — bulk admin panel, SSO (SAML/SCIM), data privacy compliance (FERPA/COPPA)
- **API for third-party developers** — let others build on top of Notera's content graph
- **Chrome extension** — study flashcards from any webpage, auto-create from highlighted text

#### 14. Advanced Infrastructure
- **Real-time sync across all features** — CRDTs (Yjs) for notes, whiteboards, and collaborative study
- **Offline-first PWA** — ServiceWorker + IndexedDB for offline access on any device
- **Edge functions** — move API routes to Vercel Edge for <50ms global latency
- **Observability** — structured logging (Axiom), error tracking (Sentry), performance monitoring (Vercel Analytics)
- **Rate limiting** — protect API endpoints from abuse (Upstash Ratelimit)
- **Automated backups** — scheduled Neon branch snapshots

#### 15. Expanded Subject Coverage
- **Science lab simulations** — interactive physics/chemistry simulations (PhET-style)
- **Language learning suite** — vocabulary + grammar + speaking practice (speech recognition API)
- **Coding practice** — embedded code editor with test cases (like LeetCode lite)
- **SAT/ACT/GRE prep** — structured test prep with timed practice sections
- **Medical education** — anatomy 3D viewer, pharmacology flashcards, clinical case studies

#### 16. Community & Governance
- **Open-source contributor program** — structured issue labels, mentorship, contribution guides
- **Plugin system** — allow the community to build custom study modes, visualizers, and integrations
- **Content moderation AI** — auto-flag inappropriate content in public sets and forum posts
- **Student government** — elected moderators, community-voted feature requests

---

### 📐 Quick-Win Improvements (< 1 Week Each)

| # | Improvement | Impact |
|---|---|---|
| 1 | Add `loading.tsx` skeletons to all route segments | Better perceived performance |
| 2 | Add `error.tsx` boundaries to all route segments | Graceful error handling |
| 3 | Implement proper `<head>` metadata + Open Graph tags for every page | SEO + social sharing |
| 4 | Add keyboard shortcuts (S = study, N = new set, / = search) | Power user efficiency |
| 5 | Add global command palette (⌘K) | Navigation speed |
| 6 | Implement proper pagination on all list views | Handle large datasets |
| 7 | Add search with fuzzy matching across sets, notes, and forum | Core UX improvement |
| 8 | Add CSV/JSON export for flashcard sets | Data portability |
| 9 | Add "duplicate set" functionality | Common user request |
| 10 | Add bulk edit mode for flashcards | Efficiency for large sets |
| 11 | Add print-friendly CSS for study guides | Offline studying |
| 12 | Add confirmation dialogs before destructive actions | Prevent data loss |
| 13 | Rate-limit auth endpoints | Security hardening |
| 14 | Add input sanitization on all user-generated content | XSS prevention |
| 15 | Set up Sentry for error tracking | Production visibility |

---

### 🏗️ Architecture Refactors

| Refactor | Why |
|---|---|
| Extract shared API logic into service layer (`src/services/`) | Currently business logic lives in route handlers — hard to test and reuse |
| Move to server actions for mutations | Reduce API route boilerplate, leverage Next.js 16 server actions |
| Implement optimistic updates across all mutations | Currently some mutations wait for server response — feels slow |
| Add proper error handling middleware | Standardize error responses across all API routes |
| Implement proper logging with structured metadata | Currently using `console.log` — no observability in production |
| Add database migration workflow | Currently using `db push` — should use `prisma migrate` for production |
| Separate seed data from seed scripts | CSV data mixed with seed logic — extract to a data layer |

---

## Summary

Notera is an **impressively ambitious** student-built study platform that already covers more ground than most commercial alternatives. The core flashcard system with FSRS spaced repetition, the math visualizers, the DBQ tool, and the collaborative whiteboard are genuine differentiators.

The biggest opportunities for 1000x improvement are:

1. **AI everywhere** — auto-generate content, grade essays, personalize study paths
2. **Mobile app** — meet students where they are (on their phones)
3. **Social/viral loop** — live study sessions, leaderboards, class system
4. **Test coverage** — harden the codebase for rapid feature development
5. **Performance** — caching, CDN, edge functions, offline support

The foundation is solid. The path to 1000x is about **depth over breadth** — perfecting the core study experience and making it feel magical with AI, then expanding the platform.

---

*This document was auto-generated from a full codebase analysis on March 26, 2026.*
