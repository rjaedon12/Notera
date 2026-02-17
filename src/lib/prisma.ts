import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import fs from 'node:fs'
import path from 'node:path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  let databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'

  // Vercel serverless functions use a read-only deployment filesystem.
  // For file-based SQLite URLs, bootstrap a writable DB in /tmp.
  if (process.env.VERCEL && databaseUrl.startsWith('file:')) {
    const vercelDbPath = '/tmp/koda.db'
    const seededSnapshotPath = path.join(process.cwd(), 'prisma', 'seeded.db')

    if (!fs.existsSync(vercelDbPath) && fs.existsSync(seededSnapshotPath)) {
      fs.copyFileSync(seededSnapshotPath, vercelDbPath)
    }

    databaseUrl = `file:${vercelDbPath}`
  }

  const adapter = new PrismaLibSql({
    url: databaseUrl,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
