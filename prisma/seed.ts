import { PrismaClient } from "@prisma/client"
import { PrismaLibSql } from "@prisma/adapter-libsql"
import bcrypt from "bcryptjs"

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || "file:./prisma/dev.db",
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  })
  console.log(`✓ Created admin user: ${admin.email}`)

  // Create demo user
  const hashedPassword = await bcrypt.hash("password123", 10)
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      passwordHash: hashedPassword,
    },
  })
  console.log(`✓ Created user: ${user.email}`)

  // Create default tags
  const tagData = [
    { name: "History", slug: "history", category: "Subject" },
    { name: "Science", slug: "science", category: "Subject" },
    { name: "Math", slug: "math", category: "Subject" },
    { name: "Languages", slug: "languages", category: "Subject" },
    { name: "AP Courses", slug: "ap-courses", category: "Level" },
    { name: "SAT Prep", slug: "sat-prep", category: "Level" },
    { name: "Beginner", slug: "beginner", category: "Level" },
    { name: "Advanced", slug: "advanced", category: "Level" },
    { name: "World History", slug: "world-history", category: "Topic" },
    { name: "US History", slug: "us-history", category: "Topic" },
    { name: "Biology", slug: "biology", category: "Topic" },
    { name: "Chemistry", slug: "chemistry", category: "Topic" },
    { name: "Spanish", slug: "spanish", category: "Topic" },
    { name: "French", slug: "french", category: "Topic" },
    { name: "Vocabulary", slug: "vocabulary", category: "Type" },
    { name: "Dates & Events", slug: "dates-events", category: "Type" },
  ]

  for (const tag of tagData) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: tag,
    })
  }
  console.log(`✓ Created ${tagData.length} default tags`)

  // Create AP World History Unit 8/9 Dates study set
  const apWorldSet = await prisma.studySet.create({
    data: {
      title: "AP World Unit 8/9 Dates",
      description: "Key dates for AP World History Units 8 and 9 (1900-Present)",
      isPublic: true,
      isPremade: true,
      ownerId: admin.id,
      cards: {
        create: [
          { term: "1914-1918", definition: "World War I - The Great War involving major world powers", orderIndex: 0 },
          { term: "1917", definition: "Russian Revolution - Bolsheviks overthrow Tsar Nicholas II", orderIndex: 1 },
          { term: "1919", definition: "Treaty of Versailles - Ends WWI, creates League of Nations", orderIndex: 2 },
          { term: "1929", definition: "Great Depression begins with Wall Street Crash", orderIndex: 3 },
          { term: "1933", definition: "Hitler becomes Chancellor of Germany", orderIndex: 4 },
          { term: "1939-1945", definition: "World War II - Global conflict spanning Europe, Asia, Africa", orderIndex: 5 },
          { term: "1941", definition: "Pearl Harbor Attack - US enters WWII", orderIndex: 6 },
          { term: "1945", definition: "Atomic bombs dropped on Hiroshima and Nagasaki; UN founded", orderIndex: 7 },
          { term: "1947", definition: "Indian Independence and Partition; Cold War begins", orderIndex: 8 },
          { term: "1948", definition: "State of Israel established; Apartheid begins in South Africa", orderIndex: 9 },
          { term: "1949", definition: "Chinese Communist Revolution - Mao Zedong establishes PRC", orderIndex: 10 },
          { term: "1950-1953", definition: "Korean War - Division of Korea at 38th parallel", orderIndex: 11 },
          { term: "1955", definition: "Bandung Conference - Non-Aligned Movement begins", orderIndex: 12 },
          { term: "1959", definition: "Cuban Revolution - Fidel Castro comes to power", orderIndex: 13 },
          { term: "1961", definition: "Berlin Wall constructed", orderIndex: 14 },
          { term: "1962", definition: "Cuban Missile Crisis - Closest point to nuclear war", orderIndex: 15 },
          { term: "1964-1975", definition: "Vietnam War - US involvement in Southeast Asia", orderIndex: 16 },
          { term: "1966-1976", definition: "Chinese Cultural Revolution under Mao", orderIndex: 17 },
          { term: "1979", definition: "Iranian Revolution - Shah overthrown, Islamic Republic established", orderIndex: 18 },
          { term: "1989", definition: "Fall of Berlin Wall; Tiananmen Square protests", orderIndex: 19 },
          { term: "1991", definition: "Collapse of Soviet Union - End of Cold War", orderIndex: 20 },
          { term: "1994", definition: "End of Apartheid in South Africa - Mandela elected", orderIndex: 21 },
          { term: "2001", definition: "September 11 attacks - War on Terror begins", orderIndex: 22 },
          { term: "2008", definition: "Global Financial Crisis", orderIndex: 23 },
        ],
      },
    },
  })
  console.log(`✓ Created study set: ${apWorldSet.title} (24 cards)`)

  // Create US Presidents study set
  const presidentsSet = await prisma.studySet.create({
    data: {
      title: "US Presidents (20th Century)",
      description: "Presidents of the United States in the 20th century",
      isPublic: true,
      isPremade: true,
      ownerId: admin.id,
      cards: {
        create: [
          { term: "William McKinley", definition: "25th President (1897-1901) - Spanish-American War", orderIndex: 0 },
          { term: "Theodore Roosevelt", definition: "26th President (1901-1909) - Progressive Era, Trust Buster", orderIndex: 1 },
          { term: "William Howard Taft", definition: "27th President (1909-1913) - Dollar Diplomacy", orderIndex: 2 },
          { term: "Woodrow Wilson", definition: "28th President (1913-1921) - WWI, League of Nations", orderIndex: 3 },
          { term: "Warren G. Harding", definition: "29th President (1921-1923) - Return to Normalcy", orderIndex: 4 },
          { term: "Calvin Coolidge", definition: "30th President (1923-1929) - Roaring Twenties", orderIndex: 5 },
          { term: "Herbert Hoover", definition: "31st President (1929-1933) - Great Depression", orderIndex: 6 },
          { term: "Franklin D. Roosevelt", definition: "32nd President (1933-1945) - New Deal, WWII", orderIndex: 7 },
          { term: "Harry S. Truman", definition: "33rd President (1945-1953) - Atomic bomb, Cold War", orderIndex: 8 },
          { term: "Dwight D. Eisenhower", definition: "34th President (1953-1961) - Interstate highways", orderIndex: 9 },
          { term: "John F. Kennedy", definition: "35th President (1961-1963) - Cuban Missile Crisis", orderIndex: 10 },
          { term: "Lyndon B. Johnson", definition: "36th President (1963-1969) - Great Society, Vietnam", orderIndex: 11 },
          { term: "Richard Nixon", definition: "37th President (1969-1974) - Watergate, opened China", orderIndex: 12 },
          { term: "Gerald Ford", definition: "38th President (1974-1977) - Pardoned Nixon", orderIndex: 13 },
          { term: "Jimmy Carter", definition: "39th President (1977-1981) - Camp David Accords", orderIndex: 14 },
          { term: "Ronald Reagan", definition: "40th President (1981-1989) - Reaganomics, Cold War", orderIndex: 15 },
          { term: "George H.W. Bush", definition: "41st President (1989-1993) - Gulf War", orderIndex: 16 },
          { term: "Bill Clinton", definition: "42nd President (1993-2001) - Economic boom", orderIndex: 17 },
        ],
      },
    },
  })
  console.log(`✓ Created study set: ${presidentsSet.title} (18 cards)`)

  // Create Spanish Vocabulary study set
  const spanishSet = await prisma.studySet.create({
    data: {
      title: "Spanish Basics",
      description: "Common Spanish vocabulary words for beginners",
      isPublic: true,
      ownerId: user.id,
      cards: {
        create: [
          { term: "Hola", definition: "Hello", orderIndex: 0 },
          { term: "Adiós", definition: "Goodbye", orderIndex: 1 },
          { term: "Por favor", definition: "Please", orderIndex: 2 },
          { term: "Gracias", definition: "Thank you", orderIndex: 3 },
          { term: "De nada", definition: "You're welcome", orderIndex: 4 },
          { term: "Buenos días", definition: "Good morning", orderIndex: 5 },
          { term: "Buenas noches", definition: "Good night", orderIndex: 6 },
          { term: "¿Cómo estás?", definition: "How are you?", orderIndex: 7 },
          { term: "Bien", definition: "Good/Well", orderIndex: 8 },
          { term: "Mal", definition: "Bad", orderIndex: 9 },
          { term: "Sí", definition: "Yes", orderIndex: 10 },
          { term: "No", definition: "No", orderIndex: 11 },
          { term: "Agua", definition: "Water", orderIndex: 12 },
          { term: "Comida", definition: "Food", orderIndex: 13 },
          { term: "Casa", definition: "House", orderIndex: 14 },
          { term: "Familia", definition: "Family", orderIndex: 15 },
          { term: "Amigo/Amiga", definition: "Friend (male/female)", orderIndex: 16 },
          { term: "Tiempo", definition: "Time/Weather", orderIndex: 17 },
          { term: "Dinero", definition: "Money", orderIndex: 18 },
          { term: "Trabajo", definition: "Work/Job", orderIndex: 19 },
        ],
      },
    },
  })
  console.log(`✓ Created study set: ${spanishSet.title} (20 cards)`)

  // Tag the study sets
  const historyTag = await prisma.tag.findUnique({ where: { slug: "history" } })
  const worldHistoryTag = await prisma.tag.findUnique({ where: { slug: "world-history" } })
  const usHistoryTag = await prisma.tag.findUnique({ where: { slug: "us-history" } })
  const apCoursesTag = await prisma.tag.findUnique({ where: { slug: "ap-courses" } })
  const datesTag = await prisma.tag.findUnique({ where: { slug: "dates-events" } })
  const spanishTag = await prisma.tag.findUnique({ where: { slug: "spanish" } })
  const languagesTag = await prisma.tag.findUnique({ where: { slug: "languages" } })
  const beginnerTag = await prisma.tag.findUnique({ where: { slug: "beginner" } })
  const vocabTag = await prisma.tag.findUnique({ where: { slug: "vocabulary" } })

  // Tag AP World set
  if (historyTag && worldHistoryTag && apCoursesTag && datesTag) {
    await prisma.setTag.createMany({
      data: [
        { setId: apWorldSet.id, tagId: historyTag.id },
        { setId: apWorldSet.id, tagId: worldHistoryTag.id },
        { setId: apWorldSet.id, tagId: apCoursesTag.id },
        { setId: apWorldSet.id, tagId: datesTag.id },
      ]
    })
  }

  // Tag Presidents set
  if (historyTag && usHistoryTag && datesTag) {
    await prisma.setTag.createMany({
      data: [
        { setId: presidentsSet.id, tagId: historyTag.id },
        { setId: presidentsSet.id, tagId: usHistoryTag.id },
        { setId: presidentsSet.id, tagId: datesTag.id },
      ]
    })
  }

  // Tag Spanish set
  if (spanishTag && languagesTag && beginnerTag && vocabTag) {
    await prisma.setTag.createMany({
      data: [
        { setId: spanishSet.id, tagId: spanishTag.id },
        { setId: spanishSet.id, tagId: languagesTag.id },
        { setId: spanishSet.id, tagId: beginnerTag.id },
        { setId: spanishSet.id, tagId: vocabTag.id },
      ]
    })
  }
  console.log(`✓ Tagged study sets`)

  // Create a folder
  const folder = await prisma.folder.create({
    data: {
      name: "History",
      ownerId: user.id,
    },
  })
  console.log(`✓ Created folder: ${folder.name}`)

  // Add sets to folder using FolderSet junction table
  await prisma.folderSet.create({
    data: {
      folderId: folder.id,
      setId: apWorldSet.id,
    },
  })
  await prisma.folderSet.create({
    data: {
      folderId: folder.id,
      setId: presidentsSet.id,
    },
  })
  console.log(`✓ Added sets to folder`)

  // ============================================
  // QUIZ: World History – Empires & Religions
  // ============================================

  const historyQuizBank = await prisma.questionBank.create({
    data: {
      title: "World History – Empires & Religions",
      subject: "World History",
      description: "Test your knowledge of major empires, trade networks, and the spread of world religions across civilizations.",
      isPublic: true,
      ownerId: admin.id,
      questions: {
        create: [
          {
            prompt: "Which of the following best explains the spread of Hinduism to Southeast Asia during the classical period?",
            explanation: "Indian merchants and Brahmin priests traveled to Southeast Asian kingdoms along maritime trade routes, bringing Hindu religious practices, Sanskrit texts, and temple-building traditions. This cultural diffusion — not military conquest — is what primarily spread Hinduism to places like the Khmer Empire (Angkor Wat) and Java.",
            correctChoiceId: "", // Will be updated after choices are created
            orderIndex: 0,
            choices: {
              create: [
                { text: "Military conquest by the Maurya Empire into modern-day Thailand", isCorrect: false, orderIndex: 0 },
                { text: "Indian merchants and Brahmin priests traveling along maritime trade routes", isCorrect: true, orderIndex: 1 },
                { text: "The forced conversion of Southeast Asian peoples by Gupta rulers", isCorrect: false, orderIndex: 2 },
                { text: "Buddhist missionaries replacing local animist traditions with Hindu practices", isCorrect: false, orderIndex: 3 },
              ],
            },
          },
          {
            prompt: "The Inca Empire used which of the following systems to manage its vast territory without a written language?",
            passage: "The Inca Empire, stretching over 2,500 miles along the western coast of South America, governed approximately 12 million people from diverse ethnic and linguistic backgrounds. Despite lacking a traditional writing system, the Inca administration maintained detailed records of census data, tribute obligations, and resource inventories across its four provinces, known as suyus.",
            explanation: "The quipu was a recording system using knotted strings of different colors and lengths to encode numerical and possibly narrative information. Administered by specialized officials called quipucamayocs, the quipu system allowed the Inca to manage taxation, census data, and military logistics across their vast empire — all without a conventional writing system.",
            correctChoiceId: "", // Will be updated after choices are created
            orderIndex: 1,
            choices: {
              create: [
                { text: "Cuneiform tablets adapted from Mesopotamian traders", isCorrect: false, orderIndex: 0 },
                { text: "A hieroglyphic writing system similar to the Maya", isCorrect: false, orderIndex: 1 },
                { text: "The quipu, a system of knotted strings for record keeping", isCorrect: true, orderIndex: 2 },
                { text: "Oral tradition exclusively, with no physical record-keeping tools", isCorrect: false, orderIndex: 3 },
              ],
            },
          },
        ],
      },
    },
    include: {
      questions: {
        include: { choices: true },
      },
    },
  })

  // Update correctChoiceId for each question
  for (const question of historyQuizBank.questions) {
    const correctChoice = question.choices.find((c) => c.isCorrect)
    if (correctChoice) {
      await prisma.question.update({
        where: { id: question.id },
        data: { correctChoiceId: correctChoice.id },
      })
    }
  }

  console.log(`✓ Created question bank: ${historyQuizBank.title} (2 questions)`)

  console.log("\n✨ Database seeded successfully!")
  console.log("\nCredentials:")
  console.log("  Admin: admin@example.com / admin123")
  console.log("  Demo:  demo@example.com / password123")
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
