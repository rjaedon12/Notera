import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import fs from "node:fs/promises"
import path from "node:path"

const prisma = new PrismaClient()

// CSV helper - Each CSV has header "English & Pinyin,Chinese"
// Some English fields contain commas, so we split on the LAST comma.
function parseCsvToCards(csv: string) {
  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1)

  return rows
    .map((line) => {
      const sep = line.lastIndexOf(",")
      if (sep === -1) return null
      const englishAndPinyin = line.slice(0, sep).trim()
      const chinese = line.slice(sep + 1).trim()
      if (!englishAndPinyin || !chinese) return null
      return { term: chinese, definition: englishAndPinyin }
    })
    .filter((c): c is { term: string; definition: string } => c !== null)
    .map((c, i) => ({ ...c, orderIndex: i }))
}

const chineseCsvSets: { file: string; title: string; description: string }[] = [
  { file: "ap_mandarin_vocabulary_2_columns.csv", title: "AP Mandarin – Full Vocabulary", description: "Complete AP Mandarin vocabulary (~597 words). Chinese characters on the front; English meaning with pinyin on the back." },
  { file: "category_action_verbs_and_descriptions.csv", title: "Chinese Action Verbs & Descriptions", description: "Action verbs and descriptive words commonly tested in AP Chinese." },
  { file: "category_education_and_school.csv", title: "Chinese Education & School", description: "School, academics, and education-related vocabulary for AP Chinese." },
  { file: "category_feelings_and_emotions.csv", title: "Chinese Feelings & Emotions", description: "Feelings, emotions, and mental states vocabulary for AP Chinese." },
  { file: "category_food_health_and_living.csv", title: "Chinese Food, Health & Living", description: "Food, health, and daily living vocabulary for AP Chinese." },
  { file: "category_recreation_sports_and_arts.csv", title: "Chinese Recreation, Sports & Arts", description: "Recreation, sports, arts, and entertainment vocabulary for AP Chinese." },
  { file: "category_social_and_relationships.csv", title: "Chinese Social Life & Relationships", description: "Social skills, relationships, and personality vocabulary for AP Chinese." },
  { file: "category_time_and_frequency.csv", title: "Chinese Time & Frequency", description: "Time expressions, frequency words, and calendar vocabulary for AP Chinese." },
  { file: "category_traditions_and_history.csv", title: "Chinese Traditions & History", description: "Traditional holidays, historical terms, and cultural vocabulary for AP Chinese." },
  { file: "category_travel_and_geography.csv", title: "Chinese Travel & Geography", description: "Travel, geography, and location vocabulary for AP Chinese." },
  { file: "category_work_and_business.csv", title: "Chinese Work & Business", description: "Work, business, career, and money vocabulary for AP Chinese." },
  { file: "common_verbs_and_descriptions.csv", title: "Chinese Common Verbs & Descriptions", description: "High-frequency verbs and descriptive words for everyday Mandarin." },
  { file: "education_and_academia.csv", title: "Chinese Education & Academia", description: "Academic subjects, college, and school life vocabulary." },
  { file: "feelings_and_thoughts.csv", title: "Chinese Feelings & Thoughts", description: "Inner feelings, opinions, and thought-related expressions." },
  { file: "nature_science_and_weather.csv", title: "Chinese Nature, Science & Weather", description: "Nature, climate, science, and environmental vocabulary." },
  { file: "recreation_sports_and_arts.csv", title: "Chinese Sports & Creative Arts", description: "Sports, recreation, and arts vocabulary." },
  { file: "social_and_relationships.csv", title: "Chinese Social Interactions", description: "Social interactions, personality traits, and relationship vocabulary." },
  { file: "time_and_measurement.csv", title: "Chinese Time & Measurement", description: "Time, dates, measurement, and quantity vocabulary." },
  { file: "traditions_and_history.csv", title: "Chinese Cultural Traditions", description: "Cultural traditions, festivals, and historical vocabulary." },
  { file: "travel_and_geography.csv", title: "Chinese Travel & Places", description: "Travel destinations, geography, and location-related vocabulary." },
  { file: "work_business_and_money.csv", title: "Chinese Work, Business & Money", description: "Careers, business, finance, and work-life vocabulary." },
  { file: "subset_1_education_and_school.csv", title: "Chinese Quick Review – Education", description: "Focused subset: education and school terms for quick review." },
  { file: "subset_2_work_and_career.csv", title: "Chinese Quick Review – Work & Career", description: "Focused subset: work and career vocabulary for quick review." },
  { file: "subset_3_travel_and_places.csv", title: "Chinese Quick Review – Travel & Places", description: "Focused subset: travel and places vocabulary for quick review." },
  { file: "subset_4_people_and_personality.csv", title: "Chinese Quick Review – People & Personality", description: "Focused subset: people and personality vocabulary for quick review." },
  { file: "subset_5_feelings_and_opinions.csv", title: "Chinese Quick Review – Feelings & Opinions", description: "Focused subset: feelings and opinions vocabulary for quick review." },
  { file: "subset_6_sports_and_leisure.csv", title: "Chinese Quick Review – Sports & Leisure", description: "Focused subset: sports and leisure vocabulary for quick review." },
  { file: "subset_7_time_and_communication.csv", title: "Chinese Quick Review – Time & Communication", description: "Focused subset: time and communication vocabulary for quick review." },
  { file: "subset_8_nature_and_environment.csv", title: "Chinese Quick Review – Nature & Environment", description: "Focused subset: nature and environment vocabulary for quick review." },
  { file: "subset_9_traditions_and_history.csv", title: "Chinese Quick Review – Traditions & History", description: "Focused subset: traditions and history vocabulary for quick review." },
  { file: "subset_10_daily_life_and_health.csv", title: "Chinese Quick Review – Daily Life & Health", description: "Focused subset: daily life and health vocabulary for quick review." },
]

async function main() {
  console.log("🌱 Seeding database...")

  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: { email: "admin@example.com", name: "Admin User", passwordHash: adminPassword, role: "ADMIN" },
  })
  console.log("✓ Created admin user:", admin.email)

  const hashedPassword = await bcrypt.hash("password123", 10)
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: { email: "demo@example.com", name: "Demo User", passwordHash: hashedPassword },
  })
  console.log("✓ Created user:", user.email)

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
    { name: "Mandarin", slug: "mandarin", category: "Topic" },
    { name: "AP Chinese", slug: "ap-chinese", category: "Topic" },
    { name: "French", slug: "french", category: "Topic" },
    { name: "Vocabulary", slug: "vocabulary", category: "Type" },
    { name: "Dates & Events", slug: "dates-events", category: "Type" },
    { name: "Chinese", slug: "chinese", category: "Subject" },
  ]
  for (const tag of tagData) {
    await prisma.tag.upsert({ where: { slug: tag.slug }, update: {}, create: tag })
  }
  console.log("✓ Created", tagData.length, "tags")

  // AP World History
  const apWorldSet = await prisma.studySet.create({
    data: {
      title: "AP World Unit 8/9 Dates",
      description: "Key dates for AP World History Units 8 and 9 (1900-Present)",
      isPublic: true, isPremade: true, ownerId: admin.id,
      cards: { create: [
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
      ]},
    },
  })
  console.log("✓ Created:", apWorldSet.title, "(24 cards)")

  // US Presidents
  const presidentsSet = await prisma.studySet.create({
    data: {
      title: "US Presidents (20th Century)",
      description: "Presidents of the United States in the 20th century",
      isPublic: true, isPremade: true, ownerId: admin.id,
      cards: { create: [
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
      ]},
    },
  })
  console.log("✓ Created:", presidentsSet.title, "(18 cards)")

  // Spanish Basics
  const spanishSet = await prisma.studySet.create({
    data: {
      title: "Spanish Basics", description: "Common Spanish vocabulary words for beginners",
      isPublic: true, ownerId: user.id,
      cards: { create: [
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
      ]},
    },
  })
  console.log("✓ Created:", spanishSet.title, "(20 cards)")

  // ── Chinese CSV sets ────────────────────────────────────────────
  const chineseTag = await prisma.tag.findUnique({ where: { slug: "chinese" } })
  const mandarinTag = await prisma.tag.findUnique({ where: { slug: "mandarin" } })
  const apChineseTag = await prisma.tag.findUnique({ where: { slug: "ap-chinese" } })
  const apCoursesTag = await prisma.tag.findUnique({ where: { slug: "ap-courses" } })
  const languagesTag = await prisma.tag.findUnique({ where: { slug: "languages" } })
  const vocabTag = await prisma.tag.findUnique({ where: { slug: "vocabulary" } })

  const dataDir = path.join(process.cwd(), "prisma", "data")

  for (const csvDef of chineseCsvSets) {
    const csvPath = path.join(dataDir, csvDef.file)
    let csvContent: string
    try {
      csvContent = await fs.readFile(csvPath, "utf8")
    } catch {
      console.warn("⚠ Skipping missing file:", csvDef.file)
      continue
    }
    const cards = parseCsvToCards(csvContent)
    if (cards.length === 0) {
      console.warn("⚠ No valid cards in:", csvDef.file)
      continue
    }
    const studySet = await prisma.studySet.create({
      data: {
        title: csvDef.title,
        description: csvDef.description,
        isPublic: true,
        isPremade: true,
        ownerId: admin.id,
        cards: { create: cards },
      },
    })
    const tagIds = [chineseTag?.id, mandarinTag?.id, apChineseTag?.id, apCoursesTag?.id, languagesTag?.id, vocabTag?.id].filter((id): id is string => !!id)
    if (tagIds.length > 0) {
      await prisma.setTag.createMany({ data: tagIds.map((tagId) => ({ setId: studySet.id, tagId })) })
    }
    console.log("✓ Created:", csvDef.title, `(${cards.length} cards)`)
  }

  // ── Tag non-Chinese sets ────────────────────────────────────────
  const historyTag = await prisma.tag.findUnique({ where: { slug: "history" } })
  const worldHistoryTag = await prisma.tag.findUnique({ where: { slug: "world-history" } })
  const usHistoryTag = await prisma.tag.findUnique({ where: { slug: "us-history" } })
  const datesTag = await prisma.tag.findUnique({ where: { slug: "dates-events" } })
  const spanishTag = await prisma.tag.findUnique({ where: { slug: "spanish" } })
  const beginnerTag = await prisma.tag.findUnique({ where: { slug: "beginner" } })

  if (historyTag && worldHistoryTag && apCoursesTag && datesTag) {
    await prisma.setTag.createMany({ data: [
      { setId: apWorldSet.id, tagId: historyTag.id },
      { setId: apWorldSet.id, tagId: worldHistoryTag.id },
      { setId: apWorldSet.id, tagId: apCoursesTag.id },
      { setId: apWorldSet.id, tagId: datesTag.id },
    ]})
  }
  if (historyTag && usHistoryTag && datesTag) {
    await prisma.setTag.createMany({ data: [
      { setId: presidentsSet.id, tagId: historyTag.id },
      { setId: presidentsSet.id, tagId: usHistoryTag.id },
      { setId: presidentsSet.id, tagId: datesTag.id },
    ]})
  }
  if (spanishTag && languagesTag && beginnerTag && vocabTag) {
    await prisma.setTag.createMany({ data: [
      { setId: spanishSet.id, tagId: spanishTag.id },
      { setId: spanishSet.id, tagId: languagesTag.id },
      { setId: spanishSet.id, tagId: beginnerTag.id },
      { setId: spanishSet.id, tagId: vocabTag.id },
    ]})
  }
  console.log("✓ Tagged study sets")

  // ── Folder ──────────────────────────────────────────────────────
  const folder = await prisma.folder.create({ data: { name: "History", ownerId: user.id } })
  await prisma.folderSet.create({ data: { folderId: folder.id, setId: apWorldSet.id } })
  await prisma.folderSet.create({ data: { folderId: folder.id, setId: presidentsSet.id } })
  console.log("✓ Created folder:", folder.name)

  // ── Quiz ────────────────────────────────────────────────────────
  const historyQuizBank = await prisma.questionBank.create({
    data: {
      title: "World History – Empires & Religions",
      subject: "World History",
      description: "Test your knowledge of major empires, trade networks, and the spread of world religions.",
      isPublic: true, ownerId: admin.id,
      questions: { create: [
        {
          prompt: "Which of the following best explains the spread of Hinduism to Southeast Asia during the classical period?",
          explanation: "Indian merchants and Brahmin priests traveled along maritime trade routes.",
          correctChoiceId: "", orderIndex: 0,
          choices: { create: [
            { text: "Military conquest by the Maurya Empire into modern-day Thailand", isCorrect: false, orderIndex: 0 },
            { text: "Indian merchants and Brahmin priests traveling along maritime trade routes", isCorrect: true, orderIndex: 1 },
            { text: "The forced conversion of Southeast Asian peoples by Gupta rulers", isCorrect: false, orderIndex: 2 },
            { text: "Buddhist missionaries replacing local animist traditions with Hindu practices", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The Inca Empire used which of the following systems to manage its vast territory without a written language?",
          passage: "The Inca Empire, stretching over 2,500 miles along the western coast of South America, governed approximately 12 million people.",
          explanation: "The quipu was a recording system using knotted strings.",
          correctChoiceId: "", orderIndex: 1,
          choices: { create: [
            { text: "Cuneiform tablets adapted from Mesopotamian traders", isCorrect: false, orderIndex: 0 },
            { text: "A hieroglyphic writing system similar to the Maya", isCorrect: false, orderIndex: 1 },
            { text: "The quipu, a system of knotted strings for record keeping", isCorrect: true, orderIndex: 2 },
            { text: "Oral tradition exclusively, with no physical record-keeping tools", isCorrect: false, orderIndex: 3 },
          ]},
        },
      ]},
    },
    include: { questions: { include: { choices: true } } },
  })
  for (const question of historyQuizBank.questions) {
    const correctChoice = question.choices.find((c) => c.isCorrect)
    if (correctChoice) {
      await prisma.question.update({ where: { id: question.id }, data: { correctChoiceId: correctChoice.id } })
    }
  }
  console.log("✓ Created quiz:", historyQuizBank.title)

  console.log("\n✨ Database seeded successfully!")
  console.log("\nCredentials:")
  console.log("  Admin: admin@example.com / admin123")
  console.log("  Demo:  demo@example.com / password123")
}

main()
  .catch((e) => { console.error("Error seeding database:", e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
