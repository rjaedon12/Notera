# Koda

> Learn smarter. Master anything.

**Koda** is a full-stack, adaptive study platform built with Next.js. It combines flashcard-based learning with interactive math visualizers, rich notes, a collaborative whiteboard, study groups, and detailed progress tracking — all in one place.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?logo=postgresql)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 📚 Flashcard Study System
- Create, edit, and organize flashcard sets with titles, descriptions, and tags
- **5 study modes** — Flashcards, Learn, Test, Match, and Timed
- Star/favorite sets and sort them to the top of your library
- Daily review queue to reinforce cards you haven't seen recently
- Discover and browse publicly shared sets from other users

### 🔥 Progress & Gamification
- Duolingo-style **streak tracking** — stay on a daily study streak
- Per-card mastery tracking to focus practice where it counts
- **Achievements** system to reward milestones
- Analytics dashboard to visualize learning over time

### 🤝 Collaboration
- **Study groups** — create or join groups with invite codes
- Share flashcard sets with group members
- Group-level progress tracking

### 📝 Notes & Documents
- Rich text **notes editor** powered by TipTap (bold, italics, tables, code blocks, task lists, and more)
- **Whiteboard** — freeform drawing canvas for diagrams and brainstorming (Fabric.js)
- **Resources** — upload and manage study guides, images, and documents (Beta)
- **DBQ tool** — Document-Based Question workspace for history-style essays

### 🧮 Math Lab (Interactive Visualizers)
An interactive suite for building intuition around math concepts:

| Visualizer | Level |
|---|---|
| Sieve of Eratosthenes | High School |
| Modular Clock | High School |
| Equation Solver | High School |
| Base Converter | High School |
| Graphing Calculator (Desmos-style) | HS + College |
| GCD Visualizer (Euclidean Algorithm) | HS + College |
| Statistics Playground | HS + College |
| Euler's Totient | College |
| Matrix Visualizer | College |
| Riemann Sum | College |

### 🎵 Sight Reading
- Music sight reading practice with VexFlow notation

### ⚗️ Experimental Features
- **Timeline Builder** — drag-and-drop interactive historical timelines (Beta)
- **Quizzes** — structured quizzes separate from flashcard study modes (Beta)

---

## 🛠 Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS v4, Framer Motion |
| **Database** | PostgreSQL via [Neon](https://neon.tech), Prisma ORM |
| **Authentication** | NextAuth.js v5 (credentials, Google, GitHub OAuth) |
| **State Management** | TanStack React Query |
| **Rich Text Editor** | TipTap |
| **Canvas / Drawing** | Fabric.js, p5.js |
| **Math Rendering** | KaTeX, mathjs |
| **Music Notation** | VexFlow |
| **Charts** | Chart.js, react-chartjs-2 |
| **Drag & Drop** | dnd-kit, @hello-pangea/dnd |
| **Testing** | Vitest, Testing Library |
| **Validation** | Zod |
| **PDF Export** | jsPDF |

---

## 📁 Project Structure

```
Koda/
├── prisma/               # Database schema, migrations, and seed scripts
│   ├── schema.prisma
│   ├── seed.ts
│   └── seed-sets.ts
├── public/               # Static assets (icons, images)
├── src/
│   ├── app/              # Next.js App Router — pages and API routes
│   │   ├── api/          # REST API endpoints
│   │   ├── sets/         # Flashcard set pages
│   │   ├── library/      # Personal library
│   │   ├── discover/     # Browse public sets
│   │   ├── daily-review/ # Daily review queue
│   │   ├── groups/       # Study groups
│   │   ├── notes/        # Rich text notes
│   │   ├── whiteboard/   # Drawing canvas
│   │   ├── math/         # Math Lab visualizers
│   │   ├── resources/    # Document management
│   │   ├── timeline-builder/ # Timeline creator
│   │   ├── quizzes/      # Quiz system
│   │   ├── sightreading/ # Music sight reading
│   │   ├── analytics/    # Progress analytics
│   │   ├── achievements/ # Achievements
│   │   ├── settings/     # User settings
│   │   └── admin/        # Admin dashboard
│   ├── components/       # Shared React components
│   │   ├── layout/       # Shell, sidebar, header
│   │   ├── ui/           # Primitives (Button, Card, Input, …)
│   │   ├── study/        # Study mode components
│   │   ├── math/         # Math visualizer components
│   │   └── streak/       # Streak display components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and services
│   │   ├── auth.ts       # NextAuth configuration
│   │   ├── prisma.ts     # Prisma client singleton
│   │   └── utils.ts      # Shared utilities
│   ├── test/             # Vitest test files
│   └── types/            # TypeScript type definitions
├── docs/                 # Additional documentation
├── SETUP_GUIDE.md        # Step-by-step Neon + Vercel setup
├── DEPLOY.md             # Deployment reference
└── [config files]        # next.config.ts, tailwind, eslint, tsconfig, …
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+**
- A **[Neon](https://neon.tech)** PostgreSQL database (free tier works great)

### 1. Clone the repository

```bash
git clone <repository-url>
cd Koda
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Then edit `.env` with your values:

```env
# Neon pooled connection (use the -pooler endpoint) — replace with your own credentials, never commit real values
DATABASE_URL=postgresql://<user>:<password>@<ep-pooler>.us-east-2.aws.neon.tech/neondb?sslmode=require

# Neon direct connection (for Prisma CLI migrations) — replace with your own credentials
DIRECT_URL=postgresql://<user>:<password>@<ep-direct>.us-east-2.aws.neon.tech/neondb?sslmode=require

# Generate with: openssl rand -base64 32
AUTH_SECRET=

NEXTAUTH_URL=http://localhost:3000

# Optional — OAuth providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

> ⚠️ **Never commit your `.env` file.** It is already listed in `.gitignore`.

### 4. Set up the database

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to your Neon database
```

### 5. (Optional) Seed sample data

```bash
npm run db:seed
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database with sample data |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run deploy` | Deploy to Vercel |

---

## ☁️ Deployment

### Vercel (Recommended)

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repository.
3. Add the following **Environment Variables** in the Vercel dashboard:

   | Variable | Description |
   |---|---|
   | `DATABASE_URL` | Your Neon pooled connection string |
   | `DIRECT_URL` | Your Neon direct connection string |
   | `AUTH_SECRET` | Run `openssl rand -base64 32` to generate |
   | `NEXTAUTH_URL` | Your production URL (e.g. `https://your-app.vercel.app`) |
   | `GOOGLE_CLIENT_ID` | *(Optional)* Google OAuth client ID |
   | `GOOGLE_CLIENT_SECRET` | *(Optional)* Google OAuth client secret |
   | `GITHUB_CLIENT_ID` | *(Optional)* GitHub OAuth client ID |
   | `GITHUB_CLIENT_SECRET` | *(Optional)* GitHub OAuth client secret |

4. Click **Deploy**.

> 📖 For a detailed walkthrough (including Neon setup and OAuth configuration), see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

---

## 🔐 Authentication

Koda supports three sign-in methods:

- **Email + Password** — traditional credentials with bcrypt hashing
- **Google OAuth** — one-click sign in with a Google account
- **GitHub OAuth** — one-click sign in with a GitHub account

OAuth providers are optional. The app works with email/password alone.

---

## 🗄️ Database

Koda uses **PostgreSQL** hosted on [Neon](https://neon.tech) and accessed via the **Prisma ORM**.

- `prisma/schema.prisma` — full data model (users, sets, cards, groups, notes, streaks, achievements, …)
- `prisma/seed.ts` — seeds an admin user and sample data
- `prisma/seed-sets.ts` — seeds vocabulary flashcard sets (Latin, German, …)

---

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT
