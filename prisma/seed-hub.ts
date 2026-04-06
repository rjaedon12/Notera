/**
 * Seed the AP World History Hub — a special public classroom space.
 * Run independently: npx tsx prisma/seed-hub.ts
 */
import { PrismaClient } from "@prisma/client"
import { randomBytes } from "crypto"

const prisma = new PrismaClient()

const AP_WORLD_UNITS = [
  {
    unitNumber: 1,
    title: "The Global Tapestry",
    dateRange: "c. 1200–1450",
    overview:
      "Unit 1 explores the diverse political, economic, and cultural developments across the world from 1200 to 1450. " +
      "Topics include the Song Dynasty's innovations in China, the Delhi Sultanate in South Asia, the Mali and Great Zimbabwe kingdoms in Africa, " +
      "the Byzantine and Mongol empires in Eurasia, and the political systems of medieval Europe. " +
      "Students examine how states consolidated power through bureaucracy, religion, and trade, and how belief systems like Islam, Christianity, Buddhism, and Hinduism shaped societies.",
  },
  {
    unitNumber: 2,
    title: "Networks of Exchange",
    dateRange: "c. 1200–1450",
    overview:
      "Unit 2 focuses on the trade networks and cultural exchanges that connected regions across the globe from 1200 to 1450. " +
      "Key topics include the Silk Roads, Indian Ocean trade, trans-Saharan routes, and the spread of the Mongol Empire. " +
      "Students analyze how goods, technologies, religions, and diseases traveled along these networks, transforming economies and societies. " +
      "The unit also covers the environmental and demographic effects of exchange, including the impact of the Black Death.",
  },
  {
    unitNumber: 3,
    title: "Land-Based Empires",
    dateRange: "c. 1450–1750",
    overview:
      "Unit 3 examines the rise and consolidation of major land-based empires from 1450 to 1750. " +
      "This includes the Ottoman, Safavid, and Mughal empires in the Islamic world, the Ming and Qing dynasties in East Asia, and the Russian and Habsburg empires in Europe. " +
      "Students explore how rulers legitimized and maintained power through military force, bureaucratic systems, religious authority, monumental architecture, and legal codes. " +
      "The unit highlights strategies of imperial administration and the challenges of governing diverse populations.",
  },
  {
    unitNumber: 4,
    title: "Transoceanic Interconnections",
    dateRange: "c. 1450–1750",
    overview:
      "Unit 4 covers the transformation of global connections through maritime exploration and colonization from 1450 to 1750. " +
      "Major themes include European exploration, the Columbian Exchange, the Atlantic slave trade, the establishment of colonial empires in the Americas, " +
      "and the development of new economic systems like mercantilism. Students examine how these transoceanic encounters reshaped economies, environments, " +
      "labor systems, and social hierarchies across Europe, the Americas, Africa, and Asia.",
  },
  {
    unitNumber: 5,
    title: "Revolutions",
    dateRange: "c. 1750–1900",
    overview:
      "Unit 5 analyzes the wave of political and intellectual revolutions that swept the world from 1750 to 1900. " +
      "Topics include the Enlightenment, the American Revolution, the French Revolution, the Haitian Revolution, and Latin American independence movements. " +
      "Students explore how ideas about liberty, equality, and national sovereignty challenged existing political and social orders. " +
      "The unit also covers the rise of nationalism and the ways revolutionary ideals were applied — and limited — across different societies.",
  },
  {
    unitNumber: 6,
    title: "Consequences of Industrialization",
    dateRange: "c. 1750–1900",
    overview:
      "Unit 6 examines how the Industrial Revolution transformed economies, societies, and global power dynamics from 1750 to 1900. " +
      "Key topics include the origins of industrialization in Britain, the spread of factory systems, new technologies in transportation and communication, " +
      "the rise of capitalism and socialism, labor movements, urbanization, and the environmental consequences of industrialization. " +
      "Students also study how industrialization fueled imperialism as European powers sought raw materials and markets abroad.",
  },
  {
    unitNumber: 7,
    title: "Global Conflict",
    dateRange: "c. 1900–present",
    overview:
      "Unit 7 covers the causes and consequences of global conflicts in the twentieth century and beyond. " +
      "Major topics include World War I, the Russian Revolution, the rise of totalitarian regimes, World War II, and the Holocaust. " +
      "Students analyze how nationalism, imperialism, militarism, and ideological competition led to unprecedented violence. " +
      "The unit also explores the post-war establishment of international organizations like the United Nations and the shifting global order.",
  },
  {
    unitNumber: 8,
    title: "Cold War and Decolonization",
    dateRange: "c. 1900–present",
    overview:
      "Unit 8 explores the Cold War rivalry between the United States and the Soviet Union and the simultaneous wave of decolonization across Asia, Africa, and Latin America. " +
      "Topics include proxy wars (Korea, Vietnam, Afghanistan), the nuclear arms race, the Non-Aligned Movement, and independence movements led by figures like Gandhi, Nkrumah, and Ho Chi Minh. " +
      "Students examine how superpower competition and decolonization reshaped political boundaries, economies, and social structures around the world.",
  },
  {
    unitNumber: 9,
    title: "Globalization",
    dateRange: "c. 1900–present",
    overview:
      "Unit 9 examines the acceleration of global interconnectedness from the late twentieth century to the present. " +
      "Key themes include the spread of free-market economics, advances in communication and transportation technology, the growth of multinational corporations, " +
      "migration patterns, and cultural exchange. Students also analyze challenges of globalization, including economic inequality, environmental degradation, " +
      "resistance movements, and debates over cultural homogenization versus preservation of local traditions.",
  },
]

async function main() {
  console.log("🌍 Seeding AP World History Hub...\n")

  // Find the admin user
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    console.error("❌ No admin user found. Run the main seed first.")
    process.exit(1)
  }

  // Check if hub already exists
  const existing = await prisma.space.findUnique({ where: { hubSlug: "ap-world-history" } })
  if (existing) {
    console.log("ℹ️  AP World History hub already exists (id: " + existing.id + "). Updating units...")
    // Upsert units
    for (const unit of AP_WORLD_UNITS) {
      await prisma.hubUnit.upsert({
        where: { hubSlug_unitNumber: { hubSlug: "ap-world-history", unitNumber: unit.unitNumber } },
        update: { title: unit.title, dateRange: unit.dateRange, overview: unit.overview, orderIndex: unit.unitNumber },
        create: { hubSlug: "ap-world-history", unitNumber: unit.unitNumber, title: unit.title, dateRange: unit.dateRange, overview: unit.overview, orderIndex: unit.unitNumber },
      })
    }
    console.log("✅ Updated 9 hub units.")
    return
  }

  // Generate invite code (still needed as fallback/field is required)
  const inviteCode = randomBytes(3).toString("hex").toUpperCase()

  // Create the hub space
  const hub = await prisma.space.create({
    data: {
      name: "AP World History",
      description: "The official AP World History study hub — access flashcards, DBQs, FRQs, MCQs, and unit overviews to prepare for the AP exam.",
      inviteCode,
      type: "CLASSROOM",
      hubSlug: "ap-world-history",
      isPublic: true,
      bannerColor: "linear-gradient(135deg, #1e3a5f 0%, #2d6a4f 100%)",
      ownerId: admin.id,
      members: {
        create: { userId: admin.id, role: "OWNER" },
      },
    },
  })
  console.log(`✅ Created hub space: "${hub.name}" (id: ${hub.id})`)

  // Seed all 9 units
  for (const unit of AP_WORLD_UNITS) {
    await prisma.hubUnit.create({
      data: {
        hubSlug: "ap-world-history",
        unitNumber: unit.unitNumber,
        title: unit.title,
        dateRange: unit.dateRange,
        overview: unit.overview,
        orderIndex: unit.unitNumber,
      },
    })
  }
  console.log(`✅ Created ${AP_WORLD_UNITS.length} hub units`)

  console.log("\n🎉 AP World History Hub seeded successfully!")
  console.log(`   Hub ID: ${hub.id}`)
  console.log(`   Invite code (fallback): ${hub.inviteCode}`)
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
