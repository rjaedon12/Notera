import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import fs from 'node:fs'
import path from 'node:path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  let databaseUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db'

  if (process.env.VERCEL && databaseUrl.startsWith('file:')) {
    const writableDbPath = '/tmp/koda.db'
    const seededSnapshotPath = path.join(process.cwd(), 'prisma', 'seeded.db')

    if (!fs.existsSync(writableDbPath) && fs.existsSync(seededSnapshotPath)) {
      fs.copyFileSync(seededSnapshotPath, writableDbPath)
    }

    databaseUrl = `file:${writableDbPath}`
  }

  const adapter = new PrismaLibSQL({ url: databaseUrl })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
