import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import fs from 'node:fs'
import path from 'node:path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  let databaseUrl: string

  if (process.env.VERCEL) {
    // On Vercel the filesystem is read-only except for /tmp.
    // Always copy the bundled seeded.db snapshot to /tmp and use that —
    // completely ignore any DATABASE_URL that may be leftover from a
    // previous Postgres/Neon/Supabase migration attempt.
    const writableDbPath = '/tmp/koda.db'
    const seededSnapshotPath = path.join(process.cwd(), 'prisma', 'seeded.db')

    if (!fs.existsSync(writableDbPath) && fs.existsSync(seededSnapshotPath)) {
      fs.copyFileSync(seededSnapshotPath, writableDbPath)
    }

    databaseUrl = `file:${writableDbPath}`
  } else {
    // Local development: use DATABASE_URL if set, otherwise auto-detect
    // the populated SQLite file.
    const envUrl = process.env.DATABASE_URL
    if (envUrl && envUrl.startsWith('file:')) {
      databaseUrl = envUrl
    } else {
      // Ignore any stale Postgres/external DATABASE_URL leftover from
      // prior migration attempts and resolve the local SQLite file.
      const sqlitePrimary = path.join(process.cwd(), 'prisma', 'dev.db')
      const sqliteNested = path.join(process.cwd(), 'prisma', 'prisma', 'dev.db')
      const resolvedPath =
        fs.existsSync(sqlitePrimary) && fs.statSync(sqlitePrimary).size > 0
          ? sqlitePrimary
          : sqliteNested
      databaseUrl = `file:${resolvedPath}`
    }
  }

  const adapter = new PrismaLibSQL({ url: databaseUrl })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
