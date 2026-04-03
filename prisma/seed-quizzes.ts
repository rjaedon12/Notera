/**
 * seed-quizzes.ts
 * Previously seeded premade AP History quiz banks.
 * All premade quiz seeds have been removed — Practice Tests are now user-created only.
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("🎓 Quiz seed skipped — premade quiz banks have been removed.")
  console.log("   Practice Tests are now created by users/teachers directly.")
}

main()
  .catch((e) => {
    console.error("Quiz seed error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())

