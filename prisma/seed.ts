import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Clean existing data (in correct order for FK constraints)
  await prisma.groupSet.deleteMany()
  await prisma.groupMember.deleteMany()
  await prisma.group.deleteMany()
  await prisma.cardProgress.deleteMany()
  await prisma.studyProgress.deleteMany()
  await prisma.flashcard.deleteMany()
  await prisma.flashcardSet.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  // 1. Demo user
  const hashedPassword = await bcrypt.hash("demo1234", 12)
  const demoUser = await prisma.user.create({
    data: {
      email: "demo@koda.app",
      name: "Demo User",
      password: hashedPassword,
      streak: 3,
      lastStudied: new Date(),
    },
  })
  console.log(`✅ Created demo user: ${demoUser.email}`)

  // 2. Public flashcard set — US History
  const publicSet = await prisma.flashcardSet.create({
    data: {
      title: "US History — Key Events",
      description: "Important events in American history",
      isPublic: true,
      tags: ["history", "us-history"],
      userId: demoUser.id,
      cards: {
        create: [
          { term: "Declaration of Independence", definition: "Adopted July 4, 1776 — declared the 13 colonies free from British rule", order: 0 },
          { term: "Louisiana Purchase", definition: "1803 — the US acquired ~827,000 sq mi of territory from France for $15 million", order: 1 },
          { term: "Emancipation Proclamation", definition: "Issued by Abraham Lincoln on January 1, 1863 — freed enslaved people in Confederate states", order: 2 },
          { term: "19th Amendment", definition: "Ratified in 1920 — granted women the right to vote in the United States", order: 3 },
          { term: "Moon Landing", definition: "July 20, 1969 — Apollo 11, Neil Armstrong became the first person to walk on the Moon", order: 4 },
        ],
      },
    },
  })
  console.log(`✅ Created public set: ${publicSet.title}`)

  // 3. Private flashcard set — Spanish Basics
  const privateSet = await prisma.flashcardSet.create({
    data: {
      title: "Spanish Basics",
      description: "Common Spanish vocabulary for beginners",
      isPublic: false,
      tags: ["spanish", "language"],
      userId: demoUser.id,
      cards: {
        create: [
          { term: "Hola", definition: "Hello", order: 0 },
          { term: "Gracias", definition: "Thank you", order: 1 },
          { term: "Por favor", definition: "Please", order: 2 },
          { term: "Buenos días", definition: "Good morning", order: 3 },
          { term: "Adiós", definition: "Goodbye", order: 4 },
        ],
      },
    },
  })
  console.log(`✅ Created private set: ${privateSet.title}`)

  // 4. Group owned by demo user
  const group = await prisma.group.create({
    data: {
      name: "Study Squad",
      inviteCode: "KODA01",
      ownerId: demoUser.id,
      members: {
        create: {
          userId: demoUser.id,
          role: "OWNER",
        },
      },
      sets: {
        create: {
          setId: publicSet.id,
        },
      },
    },
  })
  console.log(`✅ Created group: ${group.name} (invite code: ${group.inviteCode})`)

  console.log("\n🎉 Seed complete!")
  console.log("   Login with: demo@koda.app / demo1234")
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
