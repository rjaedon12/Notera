# StudyApp

A Next.js flashcard and study application with multiple study modes, progress tracking, and group collaboration.

## Features

- 📚 Create and manage flashcard sets
- 🎯 Multiple study modes: Flashcards, Learn, Test, Match, Timed
- 📊 Progress tracking and streak system
- 👥 Group collaboration with invite codes
- 🏷️ Tag-based organization
- 🌙 Dark/Light theme support
- 📱 Responsive design

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS v4
- **State Management**: React Query
- **Testing**: Vitest

## Project Structure

```
studyapp/
├── prisma/              # Database schema and migrations
│   ├── schema.prisma
│   └── seed.ts
├── public/              # Static assets
├── src/
│   ├── app/            # Next.js App Router pages and API routes
│   │   ├── api/        # API endpoints
│   │   └── [routes]/   # Page routes
│   ├── components/     # React components
│   │   ├── layout/     # Layout components (shell, sidebar, header)
│   │   ├── ui/         # UI primitives (button, card, input, etc.)
│   │   ├── study/      # Study mode components
│   │   └── streak/     # Streak tracking components
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and services
│   │   ├── auth.ts     # NextAuth configuration
│   │   ├── prisma.ts   # Prisma client
│   │   └── utils.ts    # Utility functions
│   ├── test/           # Test files
│   └── types/          # TypeScript type definitions
├── docs/               # Documentation
└── [config files]      # Root configuration files
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd studyapp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Generate Prisma client and push schema:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. (Optional) Seed the database:
   ```bash
   npm run db:seed
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:seed` | Seed the database |
| `npm run db:studio` | Open Prisma Studio |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables:
   - `DATABASE_URL` - Your production database URL
   - `AUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your production URL
4. Deploy!

### Environment Variables

See `.env.example` for required environment variables.

## License

MIT
