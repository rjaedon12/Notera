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

// New-format CSV helper - Header: "Chinese,Pinyin & English"
// Chinese character is first column (term/front), pinyin+english is second (definition/back).
function parseCsvNewFormat(csv: string) {
  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(1) // skip header

  return rows
    .map((line, i) => {
      const sep = line.indexOf(",")
      if (sep === -1) return null
      const chinese = line.slice(0, sep).trim()
      const pinyinAndEnglish = line.slice(sep + 1).trim()
      if (!chinese || !pinyinAndEnglish) return null
      return { term: chinese, definition: pinyinAndEnglish, orderIndex: i }
    })
    .filter((c): c is { term: string; definition: string; orderIndex: number } => c !== null)
}

const basicChineseCsvSets: { file: string; title: string; description: string }[] = [
  { file: "basic_01_school_education.csv", title: "Chinese Basics – School & Education", description: "Essential school and education vocabulary. Chinese characters on the front; pinyin and English on the back." },
  { file: "basic_02_body_health.csv", title: "Chinese Basics – Body & Health", description: "Body parts and health vocabulary. Chinese characters on the front; pinyin and English on the back." },
  { file: "basic_03_food_drink.csv", title: "Chinese Basics – Food & Drink", description: "Food, drink, and dining vocabulary. Chinese characters on the front; pinyin and English on the back." },
  { file: "basic_04_travel_transport.csv", title: "Chinese Basics – Travel & Transport", description: "Travel, directions, and transport vocabulary. Chinese characters on the front; pinyin and English on the back." },
  { file: "basic_05_home_daily_life.csv", title: "Chinese Basics – Home & Daily Life", description: "Home, household, and everyday life vocabulary. Chinese characters on the front; pinyin and English on the back." },
  { file: "basic_06_nature_animals.csv", title: "Chinese Basics – Nature & Animals", description: "Nature, seasons, animals, and environment vocabulary. Chinese characters on the front; pinyin and English on the back." },
  { file: "basic_07_people_relationships.csv", title: "Chinese Basics – People & Relationships", description: "Family, social relationships, and people vocabulary. Chinese characters on the front; pinyin and English on the back." },
  { file: "basic_08_emotions_personality.csv", title: "Chinese Basics – Emotions & Personality", description: "Emotions, feelings, and personality traits vocabulary. Chinese characters on the front; pinyin and English on the back." },
  { file: "basic_09_work_society_culture.csv", title: "Chinese Basics – Work, Society & Culture", description: "Work, society, news, and culture vocabulary. Chinese characters on the front; pinyin and English on the back." },
  { file: "basic_10_key_verbs_grammar.csv", title: "Chinese Basics – Key Verbs & Grammar", description: "High-frequency verbs and grammar words. Chinese characters on the front; pinyin and English on the back." },
]

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

  // ── Basic Chinese CSV sets (Chinese,Pinyin & English format) ────
  const beginnerTagForBasic = await prisma.tag.findUnique({ where: { slug: "beginner" } })

  for (const csvDef of basicChineseCsvSets) {
    const csvPath = path.join(dataDir, csvDef.file)
    let csvContent: string
    try {
      csvContent = await fs.readFile(csvPath, "utf8")
    } catch {
      console.warn("⚠ Skipping missing file:", csvDef.file)
      continue
    }
    const cards = parseCsvNewFormat(csvContent)
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
    const tagIds = [chineseTag?.id, mandarinTag?.id, languagesTag?.id, vocabTag?.id, beginnerTagForBasic?.id].filter((id): id is string => !!id)
    if (tagIds.length > 0) {
      await prisma.setTag.createMany({ data: tagIds.map((tagId) => ({ setId: studySet.id, tagId })) })
    }
    console.log("✓ Created:", csvDef.title, `(${cards.length} cards)`)
  }

  // ── Latin vocab set ────────────────────────────────────────────
  // Format: English (front/term) , Latin forms (back/definition)
  // The CSV has no header row; each line is: english,"latin forms"
  const latinCsvPath = path.join(dataDir, "latin_1_vocab.csv")
  let latinCsvContent: string
  try {
    latinCsvContent = await fs.readFile(latinCsvPath, "utf8")
  } catch {
    console.warn("⚠ Skipping missing file: latin_1_vocab.csv")
    latinCsvContent = ""
  }
  if (latinCsvContent) {
    const latinCards = latinCsvContent
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, i) => {
        // Handle quoted fields: split on first comma that is NOT inside quotes
        const match = line.match(/^"(.+)","(.+)"$/) ||
                      line.match(/^"(.+)",(.+)$/) ||
                      line.match(/^(.+?),"(.+)"$/) ||
                      line.match(/^(.+?),(.+)$/)
        if (!match) return null
        const english = match[1].trim()
        const latin = match[2].trim()
        if (!english || !latin) return null
        // term = English (front), definition = Latin (back)
        return { term: english, definition: latin, orderIndex: i }
      })
      .filter((c): c is { term: string; definition: string; orderIndex: number } => c !== null)

    const latinTag = await prisma.tag.upsert({ where: { slug: "latin" }, update: {}, create: { name: "Latin", slug: "latin", category: "Subject" } })
    const latinSet = await prisma.studySet.create({
      data: {
        title: "Latin 1 Vocabulary",
        description: "Complete Latin 1 vocabulary: nouns, verbs, adjectives, and prepositions. English on the front; Latin forms on the back.",
        isPublic: true,
        isPremade: true,
        ownerId: admin.id,
        cards: { create: latinCards },
      },
    })
    await prisma.setTag.createMany({ data: [
      { setId: latinSet.id, tagId: latinTag.id },
      ...(languagesTag ? [{ setId: latinSet.id, tagId: languagesTag.id }] : []),
      ...(vocabTag ? [{ setId: latinSet.id, tagId: vocabTag.id }] : []),
    ]})
    console.log("✓ Created: Latin 1 Vocabulary", `(${latinCards.length} cards)`)
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

  // ── Quiz Banks ──────────────────────────────────────────────────

  // Delete any duplicate quiz banks (keep only the most recent one per title)
  const allBanks = await prisma.questionBank.findMany({ select: { id: true, title: true, createdAt: true }, orderBy: { createdAt: "asc" } })
  const seen = new Map<string, string>()
  for (const bank of allBanks) {
    if (seen.has(bank.title)) {
      const oldId = seen.get(bank.title)!
      await prisma.questionBank.delete({ where: { id: oldId } })
      console.log(`✓ Removed duplicate quiz bank: "${bank.title}"`)
    }
    seen.set(bank.title, bank.id)
  }

  // Helper to fix correctChoiceId after nested create
  async function fixCorrectChoices(bank: { questions: Array<{ id: string; choices: Array<{ id: string; isCorrect: boolean }> }> }) {
    for (const question of bank.questions) {
      const correctChoice = question.choices.find((c) => c.isCorrect)
      if (correctChoice) {
        await prisma.question.update({ where: { id: question.id }, data: { correctChoiceId: correctChoice.id } })
      }
    }
  }

  // ── Quiz Bank 1: AP World History – Age of Imperialism & WWI ───
  const quiz1 = await prisma.questionBank.create({
    data: {
      title: "AP World History – Age of Imperialism & WWI",
      subject: "AP World History",
      description: "Stimulus-based questions on 19th-century imperialism, colonialism, and the causes and consequences of World War I.",
      isPublic: true, ownerId: admin.id,
      questions: { create: [
        {
          prompt: "The map above most directly reflects which of the following developments in the late nineteenth century?",
          passage: "[MAP DESCRIPTION] A political map of Africa dated 1914 shows almost the entire continent divided into European-colored territories: British (pink), French (purple), German (gray), Belgian (yellow), Portuguese (green), and Italian (orange). Only Ethiopia and Liberia remain uncolored.",
          explanation: "Correct: (B) European powers partitioned nearly all of Africa between 1880–1914 through the 'Scramble for Africa,' driven by industrial demands for raw materials and markets. (A) is wrong — the slave trade predated this map by centuries. (C) is wrong — African kingdoms largely resisted but were overpowered. (D) is wrong — this was not driven by religious conversion.",
          correctChoiceId: "", orderIndex: 0,
          choices: { create: [
            { text: "The decline of the Atlantic slave trade following British abolition", isCorrect: false, orderIndex: 0 },
            { text: "European imperial expansion driven by industrial capitalism and nationalism", isCorrect: true, orderIndex: 1 },
            { text: "The voluntary adoption of European political systems by African kingdoms", isCorrect: false, orderIndex: 2 },
            { text: "The spread of Christianity as the primary motive for European involvement in Africa", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above best illustrates which of the following justifications for imperialism?",
          passage: "\"It seems to me that God, with infinite wisdom and skill, is training the Anglo-Saxon race for an hour sure to come in the world's future... the representative of the largest liberty, the purest Christianity, the highest civilization... this race of unequalled energy, with all the majesty of numbers and the might of wealth behind it — the representative, let us hope, of the largest liberty, the purest Christianity, the highest civilization — having developed peculiarly aggressive traits calculated to impress its institutions upon mankind, will spread itself over the earth.\" — Josiah Strong, Our Country, 1885",
          explanation: "Correct: (C) Strong's passage is a textbook example of Social Darwinism applied to race — Anglo-Saxons are portrayed as evolutionarily superior. (A) is wrong — this is ideology, not economic analysis. (B) is wrong — it argues FOR expansion, not against it. (D) is wrong — Social Darwinism was pseudoscientific, not a religious critique of empire.",
          correctChoiceId: "", orderIndex: 1,
          choices: { create: [
            { text: "Economic arguments that colonies provided cheap raw materials and labor", isCorrect: false, orderIndex: 0 },
            { text: "Anti-imperial criticism of European exploitation of indigenous peoples", isCorrect: false, orderIndex: 1 },
            { text: "Social Darwinist ideology that portrayed Western peoples as racially superior", isCorrect: true, orderIndex: 2 },
            { text: "Religious opposition to the secular values spread by imperial powers", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The political cartoon above, published in 1898, most directly reflects tensions arising from which of the following?",
          passage: "[CARTOON DESCRIPTION] A cartoon titled 'A Bigger Bite Than He Can Chew' shows Uncle Sam at a table overflowing with dishes labeled Cuba, Puerto Rico, Hawaii, Guam, and the Philippines. Sam looks overwhelmed and is struggling to eat. European figures in the background watch with amusement.",
          explanation: "Correct: (A) The cartoon critiques U.S. overseas expansion after the Spanish-American War, questioning whether the U.S. could govern distant territories with diverse populations. (B) is wrong — the Monroe Doctrine was about keeping Europe out of the Americas, not U.S. overseas expansion. (C) is wrong — the cartoon shows concern about expansion, not isolationism. (D) is wrong — the Open Door Policy concerned trade with China.",
          correctChoiceId: "", orderIndex: 2,
          choices: { create: [
            { text: "Debate over whether the United States could successfully govern overseas territories acquired after 1898", isCorrect: true, orderIndex: 0 },
            { text: "Opposition to the Monroe Doctrine's restrictions on U.S. engagement with Europe", isCorrect: false, orderIndex: 1 },
            { text: "Concerns about isolationism preventing the U.S. from competing with European powers", isCorrect: false, orderIndex: 2 },
            { text: "Controversy over the Open Door Policy in China", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following causes of World War I?",
          passage: "\"Austria-Hungary must... be satisfied that Serbia's propaganda will be suppressed, that the greater-Serbian dream — which threatens the very existence of the Austro-Hungarian Monarchy — will be abandoned... We cannot allow the Slav peoples of our Empire to be lured away by Serbian promises of liberation.\" — Austro-Hungarian government memorandum, July 1914",
          explanation: "Correct: (B) This reflects rising nationalism — specifically Austro-Hungarian fear of Pan-Slavic nationalism inspired by Serbia threatening the multi-ethnic empire. (A) is wrong — imperialism refers to overseas colonies. (C) is wrong — militarism refers to military buildup, not nationalist threats. (D) is wrong — the alliance system was a separate structural cause.",
          correctChoiceId: "", orderIndex: 3,
          choices: { create: [
            { text: "European imperial competition over colonial territories in Africa and Asia", isCorrect: false, orderIndex: 0 },
            { text: "Nationalist tensions threatening the stability of multi-ethnic empires", isCorrect: true, orderIndex: 1 },
            { text: "The rapid militarization of European great powers after 1870", isCorrect: false, orderIndex: 2 },
            { text: "The entangling alliance system that obligated nations to defend one another", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Which of the following conclusions is best supported by the data in the table above?",
          passage: "[TABLE: European Military Expenditures 1870–1914]\n| Country       | 1870 (£ millions) | 1914 (£ millions) | % Increase |\n|---------------|-------------------|-------------------|------------|\n| Germany       | 8                 | 110               | 1,275%     |\n| Britain       | 23                | 77                | 235%       |\n| France        | 22                | 57                | 159%       |\n| Russia        | 22                | 88                | 300%       |\n| Austria-Hungary | 8              | 36                | 350%       |",
          explanation: "Correct: (A) Germany's 1,275% increase dwarfs all others, directly supporting fears of German militarism that contributed to WWI alliances. (B) is wrong — Britain still spent more than Austria-Hungary in absolute terms. (C) is wrong — France increased less than Germany or Russia. (D) is wrong — the data shows dramatic increases, not stability.",
          correctChoiceId: "", orderIndex: 4,
          choices: { create: [
            { text: "Germany's military growth between 1870 and 1914 was proportionally greater than any other European power", isCorrect: true, orderIndex: 0 },
            { text: "Britain spent less on military than Austria-Hungary throughout this period", isCorrect: false, orderIndex: 1 },
            { text: "France had the fastest rate of military growth among the major powers", isCorrect: false, orderIndex: 2 },
            { text: "Military expenditures remained relatively stable across all powers between 1870 and 1914", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The poem above was most likely written to express which of the following points of view?",
          passage: "\"Take up the White Man's burden —\nSend forth the best ye breed —\nGo bind your sons to exile\nTo serve your captives' need;\nTo wait in heavy harness,\nOn fluttered folk and wild —\nYour new-caught, sullen peoples,\nHalf-devil and half-child.\"\n— Rudyard Kipling, 1899",
          explanation: "Correct: (C) Kipling's poem argues that Western powers have a duty — a 'burden' — to civilize non-Western peoples, framing imperialism as a selfless obligation. (A) is wrong — Kipling supports imperial expansion. (B) is wrong — while the poem does dehumanize colonized peoples, its central argument is about imperial duty, not racial hierarchy as an end in itself. (D) is wrong — the poem was written in support of U.S. annexation of the Philippines.",
          correctChoiceId: "", orderIndex: 5,
          choices: { create: [
            { text: "Opposition to European and American imperialism on humanitarian grounds", isCorrect: false, orderIndex: 0 },
            { text: "Scientific racism arguing that non-European peoples were biologically inferior", isCorrect: false, orderIndex: 1 },
            { text: "The paternalistic belief that Western powers had a civilizing duty toward colonized peoples", isCorrect: true, orderIndex: 2 },
            { text: "Isolationist criticism of American foreign policy after the Spanish-American War", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above from a 1917 source best supports which of the following arguments about World War I?",
          passage: "\"We are fighting for the ultimate peace of the world and for the liberation of its peoples, the German peoples included: for the rights of nations great and small and the privilege of men everywhere to choose their way of life and of obedience. The world must be made safe for democracy.\" — Woodrow Wilson, War Message to Congress, April 2, 1917",
          explanation: "Correct: (B) Wilson frames U.S. entry into WWI as an ideological struggle for democracy and self-determination, not purely strategic interests. (A) is wrong — Wilson explicitly includes the German people as beneficiaries. (C) is wrong — the passage presents a universalist vision, not narrow national interest. (D) is wrong — Wilson's Fourteen Points actually called for reducing secret diplomacy and arms races.",
          correctChoiceId: "", orderIndex: 6,
          choices: { create: [
            { text: "The United States entered WWI primarily to punish Germany for aggressive militarism", isCorrect: false, orderIndex: 0 },
            { text: "Wilson justified U.S. intervention as a defense of democratic values and self-determination", isCorrect: true, orderIndex: 1 },
            { text: "American foreign policy during WWI was driven by economic self-interest rather than ideology", isCorrect: false, orderIndex: 2 },
            { text: "Wilson supported maintaining the pre-war European balance of power and alliance system", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The photograph above most directly illustrates which of the following aspects of World War I?",
          passage: "[PHOTOGRAPH DESCRIPTION] A black-and-white photograph shows a long zigzagging line of trenches dug into muddy ground in northern France, 1916. Soldiers in steel helmets crouch behind sandbag walls. Shell craters and barbed wire fill the landscape between the opposing trenches. No trees or vegetation are visible.",
          explanation: "Correct: (D) Trench warfare was the defining tactical reality of the Western Front — industrial weapons made open-field advances catastrophically costly, producing years of stalemate. (A) is wrong — the image shows defensive static warfare. (B) is wrong — new technology made warfare MORE destructive and static, not mobile. (C) is wrong — the image depicts European conditions, not colonial warfare.",
          correctChoiceId: "", orderIndex: 7,
          choices: { create: [
            { text: "The rapid mobile warfare strategy used by Germany in the Schlieffen Plan", isCorrect: false, orderIndex: 0 },
            { text: "How industrial technology made WWI a faster, more decisive conflict than previous wars", isCorrect: false, orderIndex: 1 },
            { text: "The use of colonial troops on the Western Front by the British Empire", isCorrect: false, orderIndex: 2 },
            { text: "How industrial weapons technology produced years of deadly stalemate on the Western Front", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The data above most directly supports which of the following conclusions about World War I?",
          passage: "[CHART: WWI Casualties by Nation]\n| Nation         | Military Deaths | Civilian Deaths | Total       |\n|----------------|-----------------|-----------------|-------------|\n| Russia         | 1,700,000       | 500,000         | 2,200,000   |\n| Germany        | 1,773,000       | 424,000         | 2,197,000   |\n| France         | 1,357,000       | 300,000         | 1,657,000   |\n| Austria-Hungary| 1,200,000       | 467,000         | 1,667,000   |\n| British Empire | 908,000         | 109,000         | 1,017,000   |\n| United States  | 116,000         | 757            | 116,757     |",
          explanation: "Correct: (A) The data shows that the nations bearing the most casualties were European, and that the U.S. (joining in 1917) suffered far fewer deaths — evidence of the war's devastating toll on European societies. (B) is wrong — Germany and Russia suffered nearly identical military deaths. (C) is wrong — civilian casualties were significant but smaller than military deaths. (D) is wrong — the British Empire suffered over one million casualties.",
          correctChoiceId: "", orderIndex: 8,
          choices: { create: [
            { text: "European nations suffered catastrophically higher casualties than the United States, reshaping the postwar global order", isCorrect: true, orderIndex: 0 },
            { text: "Germany suffered significantly more military deaths than any other nation in the war", isCorrect: false, orderIndex: 1 },
            { text: "Civilian casualties in WWI exceeded military deaths for most combatant nations", isCorrect: false, orderIndex: 2 },
            { text: "The British Empire avoided mass casualties due to its naval strategy", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The treaty excerpt above most directly reflects which of the following outcomes of World War I?",
          passage: "\"Article 231: Germany accepts the responsibility of Germany and her allies for causing all the loss and damage to which the Allied and Associated Governments and their nationals have been subjected as a consequence of the war imposed upon them by the aggression of Germany and her allies.\"\n— Treaty of Versailles, 1919",
          explanation: "Correct: (C) Article 231, the 'War Guilt Clause,' assigned sole blame for WWI to Germany, enabling the Allies to impose crippling reparations. Historians argue this humiliation fueled German resentment that helped bring Hitler to power. (A) is wrong — Wilson's self-determination was applied selectively, not universally. (B) is wrong — this article justified reparations, not disarmament. (D) is wrong — the League of Nations was a separate provision.",
          correctChoiceId: "", orderIndex: 9,
          choices: { create: [
            { text: "Wilson's principle of national self-determination being applied to all ethnic groups in Europe", isCorrect: false, orderIndex: 0 },
            { text: "Allied demands that Germany permanently dismantle its military to prevent future wars", isCorrect: false, orderIndex: 1 },
            { text: "The punitive peace imposed on Germany that many historians link to the rise of fascism", isCorrect: true, orderIndex: 2 },
            { text: "The creation of an international organization to maintain collective security", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The account above best illustrates which of the following developments in colonial Africa during the age of imperialism?",
          passage: "\"We were told that we must give up our land to the white settlers who needed it for their farms. Our cattle were taken as tax, our young men were forced to work in the mines for wages too small to live on, and if we refused, the soldiers came. Our chief was arrested and taken to the colonial prison. This is what they call 'civilization.'\" — Oral account from a Shona community, Southern Rhodesia, c. 1900",
          explanation: "Correct: (B) The account describes land dispossession, forced labor, tax coercion, and imprisonment of traditional leaders — the central mechanisms of European colonial economic exploitation. (A) is wrong — the passage describes resistance to, not adoption of, European systems. (C) is wrong — the passage does not mention technology transfer. (D) is wrong — the passage depicts harm, not 'civilization.'",
          correctChoiceId: "", orderIndex: 10,
          choices: { create: [
            { text: "African communities voluntarily adopting European administrative systems to gain economic benefits", isCorrect: false, orderIndex: 0 },
            { text: "How European colonizers used land seizure, taxation, and forced labor to control African populations", isCorrect: true, orderIndex: 1 },
            { text: "The transfer of industrial technology from Europe to African colonies", isCorrect: false, orderIndex: 2 },
            { text: "How European missionaries improved living standards in African communities", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The image above most directly reflects which of the following features of World War I?",
          passage: "[IMAGE DESCRIPTION] A British recruitment poster from 1915 shows a well-dressed father sitting with his young children. The daughter asks, 'Daddy, what did YOU do in the Great War?' The father stares blankly at the floor, shamed. The son plays with toy soldiers on the floor.",
          explanation: "Correct: (A) The poster uses emotional pressure — shame and family honor — to drive voluntary enlistment before conscription was introduced in Britain in 1916. (B) is wrong — the poster targets civilian men at home, not soldiers at the front. (C) is wrong — propaganda posters aimed to raise morale and recruit, not spread accurate information. (D) is wrong — the poster does not reference women in the workforce.",
          correctChoiceId: "", orderIndex: 11,
          choices: { create: [
            { text: "Government use of propaganda to mobilize civilian populations and encourage enlistment", isCorrect: true, orderIndex: 0 },
            { text: "The psychological trauma experienced by soldiers returning from the Western Front", isCorrect: false, orderIndex: 1 },
            { text: "Wartime censorship that prevented accurate reporting of conditions at the front", isCorrect: false, orderIndex: 2 },
            { text: "The role of women taking industrial jobs vacated by enlisted men", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following responses to European imperialism in the late nineteenth century?",
          passage: "\"Japan must become strong. We must build our army and navy, develop industry, send scholars to Europe to learn science and technology. We must reform our laws and government. Only then can we renegotiate the unequal treaties. We cannot resist the West while standing still — we must become the West's equal.\" — Japanese government official, Meiji period, c. 1870s",
          explanation: "Correct: (C) Japan's Meiji Restoration was the most successful example of a non-Western nation selectively adopting Western industrialization and political reforms to resist imperial domination. (A) is wrong — Japan actively sought change, not preservation of tradition. (B) is wrong — Japan pursued modernization, not armed resistance without modernization. (D) is wrong — Japan sought equality with, not rejection of, the West.",
          correctChoiceId: "", orderIndex: 12,
          choices: { create: [
            { text: "Resistance movements that sought to preserve traditional cultural practices against Western influence", isCorrect: false, orderIndex: 0 },
            { text: "Military uprisings against European colonizers inspired by nationalist ideology", isCorrect: false, orderIndex: 1 },
            { text: "Selective adoption of Western technology and institutions to resist imperial domination", isCorrect: true, orderIndex: 2 },
            { text: "Complete rejection of Western values in favor of indigenous political systems", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The source above most directly illustrates which of the following features of imperialism?",
          passage: "\"[Congo Free State, 1904] Rubber quotas could not be met. The soldiers of the Force Publique were ordered to bring back a hand for every cartridge fired — to prove they had not wasted ammunition. Villages that refused to meet their quota were burned. By some estimates, the population of the Congo fell by ten million people between 1880 and 1920.\" — Adapted from Adam Hochschild, King Leopold's Ghost, 1998",
          explanation: "Correct: (B) The Congo Free State under King Leopold II is the most extreme documented example of European colonial violence, forced labor, and population collapse. (A) is wrong — the passage explicitly shows the harm of colonialism. (C) is wrong — there is no evidence of resistance in this passage. (D) is wrong — Leopold's Congo was a private holding, not a product of European rivalry.",
          correctChoiceId: "", orderIndex: 13,
          choices: { create: [
            { text: "How European colonialism improved infrastructure and living standards in central Africa", isCorrect: false, orderIndex: 0 },
            { text: "The extreme violence and exploitation that characterized some forms of European colonial rule", isCorrect: true, orderIndex: 1 },
            { text: "African military resistance that successfully expelled European colonizers from the Congo Basin", isCorrect: false, orderIndex: 2 },
            { text: "Competition between European powers over trade routes in central Africa", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The map above most directly reflects which of the following developments after World War I?",
          passage: "[MAP DESCRIPTION] A map of the Middle East, 1920, showing the region divided into French and British 'mandate' territories: France controls Syria and Lebanon (shown in blue); Britain controls Iraq, Transjordan, and Palestine (shown in red). Former Ottoman territories are now administered by European powers.",
          explanation: "Correct: (D) The Sykes-Picot Agreement (1916) and subsequent League of Nations mandates awarded Britain and France control over former Ottoman territories, drawing borders that ignored ethnic and religious communities — boundaries that contributed to instability throughout the 20th century. (A) is wrong — Wilson's self-determination was denied to these populations. (B) is wrong — this shows European expansion of control, not retreat. (C) is wrong — the mandates replaced, not preserved, Ottoman administration.",
          correctChoiceId: "", orderIndex: 14,
          choices: { create: [
            { text: "The application of Wilson's Fourteen Points granting self-determination to Middle Eastern peoples", isCorrect: false, orderIndex: 0 },
            { text: "The decline of European influence in the Middle East following the Ottoman collapse", isCorrect: false, orderIndex: 1 },
            { text: "The continuation of Ottoman administrative structures under League of Nations supervision", isCorrect: false, orderIndex: 2 },
            { text: "European imperial powers redividing the Middle East after WWI, ignoring local self-determination", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The speech excerpt above most directly reflects which of the following aspects of early twentieth-century politics?",
          passage: "\"The workers have nothing to lose but their chains... The imperialist war has turned into a civil war. The bourgeoisie must be overthrown. All power to the Soviets! Peace, Land, Bread!\" — Vladimir Lenin, April Theses, April 1917",
          explanation: "Correct: (A) Lenin's April Theses called for ending Russian participation in WWI, transferring power to soviets (workers' councils), and overthrowing the Provisional Government — directly leading to the Bolshevik Revolution of October 1917. (B) is wrong — Lenin opposed liberal democracy and the Provisional Government. (C) is wrong — Lenin explicitly rejected the war and called for its end. (D) is wrong — 'Peace, Land, Bread' was Lenin's slogan, appealing to peasants and workers, not industrialists.",
          correctChoiceId: "", orderIndex: 15,
          choices: { create: [
            { text: "How Marxist ideology combined with wartime exhaustion to fuel revolutionary movements", isCorrect: true, orderIndex: 0 },
            { text: "Liberal democratic reform movements challenging autocratic government in Eastern Europe", isCorrect: false, orderIndex: 1 },
            { text: "Russian nationalism that encouraged continued military commitment in World War I", isCorrect: false, orderIndex: 2 },
            { text: "Industrial capitalists pushing for socialist policies to manage wartime production", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The graph above most directly supports which of the following conclusions about the effects of WWI?",
          passage: "[GRAPH DESCRIPTION] A line graph shows 'Women Employed in Industry' in Britain, 1914–1919. In 1914 the line is at approximately 3.2 million. It rises steeply to 4.9 million in 1916, peaks at 5.0 million in 1918, then drops sharply back to 3.4 million in 1919 as men returned from the front.",
          explanation: "Correct: (C) The graph shows a dramatic temporary increase in women's industrial employment during the war — evidence that WWI disrupted traditional gender roles, though the postwar drop shows these gains were largely reversed. (A) is wrong — the increase was temporary. (B) is wrong — the decline after 1918 shows the gains were not permanent. (D) is wrong — the rise started in 1914, before the war's end, when women replaced enlisted men.",
          correctChoiceId: "", orderIndex: 16,
          choices: { create: [
            { text: "WWI had little long-term effect on women's employment patterns in Britain", isCorrect: false, orderIndex: 0 },
            { text: "Women permanently replaced men in industrial jobs following World War I", isCorrect: false, orderIndex: 1 },
            { text: "World War I temporarily disrupted traditional gender roles but postwar society largely reverted to prewar norms", isCorrect: true, orderIndex: 2 },
            { text: "Women's industrial employment grew primarily after the war ended in response to economic reconstruction", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The source above best reflects which of the following continuities between pre-WWI imperialism and the post-WWI settlement?",
          passage: "\"We speak in the name of justice and civilization. We ask that the principle that China's territory and sovereignty shall be maintained intact be applied to Shandong — which was ceded to Germany and now is being handed to Japan. China fought alongside the Allies. We ask only what Wilson promised: self-determination for all peoples.\" — Chinese delegation at the Paris Peace Conference, 1919",
          explanation: "Correct: (B) Despite Wilson's rhetoric of self-determination, the Paris Peace Conference awarded Japan control of Germany's former Chinese concession (Shandong), enraging Chinese nationalists and sparking the May Fourth Movement. (A) is wrong — this shows the Fourteen Points were NOT applied to Asia. (C) is wrong — China was an Allied power, not a defeated nation. (D) is wrong — Wilson's principle was rejected here, not upheld.",
          correctChoiceId: "", orderIndex: 17,
          choices: { create: [
            { text: "Wilson's Fourteen Points were applied consistently to all nations, including those in Asia", isCorrect: false, orderIndex: 0 },
            { text: "Self-determination was selectively applied at Paris, favoring European nations over Asian ones", isCorrect: true, orderIndex: 1 },
            { text: "China was punished at Versailles as an enemy nation despite its Allied status", isCorrect: false, orderIndex: 2 },
            { text: "Wilson's principle of self-determination was enthusiastically adopted by all Allied delegations at Paris", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly supports which of the following conclusions about the causes of World War I?",
          passage: "\"If Austria attacks Serbia, Russia will mobilize. If Russia mobilizes, Germany must mobilize against Russia and France. If Germany mobilizes, France mobilizes. If France mobilizes, Germany must attack France through Belgium. If Germany violates Belgian neutrality, Britain enters the war. One pistol shot in Sarajevo and the whole structure comes crashing down.\" — British diplomat, July 1914 (paraphrase)",
          explanation: "Correct: (D) This passage is a textbook description of how the interlocking alliance system transformed a regional Austro-Serbian dispute into a continental war within weeks. (A) is wrong — it describes structural causes, not economic competition. (B) is wrong — colonial rivalries were background tensions, not the trigger mechanism described. (C) is wrong — nationalism was a cause but this passage specifically describes the alliance chain reaction.",
          correctChoiceId: "", orderIndex: 18,
          choices: { create: [
            { text: "Economic competition between industrial powers over global trade routes", isCorrect: false, orderIndex: 0 },
            { text: "Colonial rivalries in Africa directly caused the outbreak of war in Europe", isCorrect: false, orderIndex: 1 },
            { text: "Rising German nationalism made a major European war inevitable", isCorrect: false, orderIndex: 2 },
            { text: "The alliance system created a chain reaction that escalated a regional conflict into a world war", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above most directly reflects which of the following effects of World War I?",
          passage: "\"Before the war, Empires stood over half the world — the Romanovs over Russia, the Habsburgs over Austria-Hungary, the Hohenzollerns over Germany, the Ottomans over the Middle East. By 1923, all four had fallen. New nations arose from their ruins: Poland, Czechoslovakia, Yugoslavia, Hungary, Finland, Estonia, Latvia, Lithuania, Iraq, Syria, and others. The map of the world had been redrawn.\" — Modern historian, 2001",
          explanation: "Correct: (A) WWI was the direct cause of the collapse of four major empires and the creation of over a dozen new states, fundamentally redrawing the global political map. (B) is wrong — the passage says empires FELL, they did not modernize. (C) is wrong — democracy did not triumph — several new states quickly became authoritarian. (D) is wrong — the League of Nations was created but the passage focuses on imperial collapse.",
          correctChoiceId: "", orderIndex: 19,
          choices: { create: [
            { text: "The collapse of multi-ethnic empires and the redrawing of national boundaries across Europe and the Middle East", isCorrect: true, orderIndex: 0 },
            { text: "The modernization of European empires through democratic reforms following the war", isCorrect: false, orderIndex: 1 },
            { text: "The global spread of democratic governance as empires transitioned to republics", isCorrect: false, orderIndex: 2 },
            { text: "The creation of the League of Nations as the dominant international institution replacing empires", isCorrect: false, orderIndex: 3 },
          ]},
        },
      ]},
    },
    include: { questions: { include: { choices: true } } },
  })
  await fixCorrectChoices(quiz1)
  console.log("✓ Created quiz:", quiz1.title, `(${quiz1.questions.length} questions)`)

  // ── Quiz Bank 2: AP US History – Industrialization, Gilded Age & Progressive Era ───
  const quiz2 = await prisma.questionBank.create({
    data: {
      title: "AP US History – Gilded Age & Progressive Era",
      subject: "AP US History",
      description: "Stimulus-based questions on American industrialization, the Gilded Age, immigration, labor movements, and Progressive reform.",
      isPublic: true, ownerId: admin.id,
      questions: { create: [
        {
          prompt: "The photograph above most directly reflects which of the following developments in late nineteenth-century America?",
          passage: "[PHOTOGRAPH DESCRIPTION] An 1888 photograph shows the interior of a textile mill in Lowell, Massachusetts. Rows of spinning machines stretch the length of a large factory floor. Young women, many appearing to be teenagers, tend the machines. The ceiling is low; the room is densely packed. A clock on the wall reads 6:00.",
          explanation: "Correct: (B) The image shows the industrial working conditions of the Gilded Age — long hours, child/young female labor, and dangerous factory floors that drove the labor reform movement. (A) is wrong — skilled craft workers were displaced by industrial machines, not shown here. (C) is wrong — this predates the Progressive Era reforms. (D) is wrong — the image shows the opposite of efficiency — dangerous, cramped conditions.",
          correctChoiceId: "", orderIndex: 0,
          choices: { create: [
            { text: "The rise of skilled artisan craftsmanship enabled by industrialization", isCorrect: false, orderIndex: 0 },
            { text: "Dangerous industrial working conditions that fueled the labor reform movement", isCorrect: true, orderIndex: 1 },
            { text: "Progressive Era regulations that improved factory safety after 1900", isCorrect: false, orderIndex: 2 },
            { text: "How industrial technology created better-paying and safer jobs for American workers", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above best supports which of the following arguments about industrialists of the Gilded Age?",
          passage: "\"I have known something of the methods by which the Standard Oil Company has attained its present position. These methods were frequently, if not generally, an abuse of the authority conferred upon railroads... rebates and discriminations... which crushed all competition.\" — Ida Tarbell, The History of the Standard Oil Company, 1904",
          explanation: "Correct: (C) Tarbell's muckraking investigation documented how Rockefeller's Standard Oil used secret railroad rebates and predatory pricing to eliminate competition — a major target of Progressive Era antitrust action. (A) is wrong — Tarbell argues these methods were unfair, not legitimate. (B) is wrong — this is about business practices, not labor. (D) is wrong — Standard Oil used railroads to crush competition, not to expand markets abroad.",
          correctChoiceId: "", orderIndex: 1,
          choices: { create: [
            { text: "Industrial consolidation through free market competition benefited American consumers", isCorrect: false, orderIndex: 0 },
            { text: "Factory owners used violence against workers to prevent the formation of labor unions", isCorrect: false, orderIndex: 1 },
            { text: "Monopolists used corrupt relationships with railroads to crush competition and build industrial empires", isCorrect: true, orderIndex: 2 },
            { text: "American industrial corporations used railroads primarily to expand into foreign markets", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The data above most directly supports which of the following conclusions about immigration to the United States between 1880 and 1920?",
          passage: "[TABLE: U.S. Immigration by Region of Origin, 1880–1920]\n| Decade    | Northern/Western Europe | Southern/Eastern Europe | Asia   | Americas |\n|-----------|-------------------------|-------------------------|--------|----------|\n| 1880–1889 | 72%                     | 18%                     | 5%     | 5%       |\n| 1890–1899 | 54%                     | 39%                     | 3%     | 4%       |\n| 1900–1909 | 22%                     | 70%                     | 2%     | 6%       |\n| 1910–1919 | 17%                     | 60%                     | 4%     | 19%      |",
          explanation: "Correct: (A) The table shows a clear demographic shift in immigration from Northern/Western Europe (German, Irish, Scandinavian) to Southern/Eastern Europe (Italian, Polish, Russian, Jewish) — the 'New Immigration' that provoked nativist backlash and eventually the Immigration Acts of 1921 and 1924. (B) is wrong — Asian immigration was restricted by the Chinese Exclusion Act of 1882. (C) is wrong — the shift was toward Southern/Eastern Europe, not away from all Europe. (D) is wrong — the data shows an increase in Eastern European immigration.",
          correctChoiceId: "", orderIndex: 2,
          choices: { create: [
            { text: "Immigration patterns shifted dramatically from Northern/Western to Southern/Eastern European sources, fueling nativist backlash", isCorrect: true, orderIndex: 0 },
            { text: "Asian immigration increased substantially after 1900 as Chinese Exclusion was lifted", isCorrect: false, orderIndex: 1 },
            { text: "Immigration from Europe as a whole declined during this period relative to immigration from the Americas", isCorrect: false, orderIndex: 2 },
            { text: "Eastern European immigration declined after 1900 in response to improving conditions in Europe", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The political cartoon above most directly reflects which of the following Gilded Age developments?",
          passage: "[CARTOON DESCRIPTION] An 1881 cartoon titled 'The Bosses of the Senate' shows massive bags of money with corporate labels — 'Standard Oil Trust,' 'Steel Beam Trust,' 'Copper Trust,' 'Iron Trust,' 'Sugar Trust' — sitting in the Senate gallery looming over tiny senators below. A door in the back labeled 'Entrance for Monopolists' stands open; a door labeled 'People's Entrance' is barred shut.",
          explanation: "Correct: (B) The cartoon depicts how Gilded Age corporations dominated the U.S. Senate through bribery, lobbying, and corruption — a central grievance of Populist and Progressive reformers. (A) is wrong — the cartoon shows corporate influence over government, not workers. (C) is wrong — the cartoon critiques existing political corruption, not foreign policy. (D) is wrong — while Standard Oil is shown, the cartoon is about political corruption broadly.",
          correctChoiceId: "", orderIndex: 3,
          choices: { create: [
            { text: "Labor unions gaining unprecedented political influence in the federal government", isCorrect: false, orderIndex: 0 },
            { text: "Corporate monopolies using wealth to corrupt the political process and dominate government", isCorrect: true, orderIndex: 1 },
            { text: "Congressional debates over tariff policy and its effects on American industry", isCorrect: false, orderIndex: 2 },
            { text: "Standard Oil's monopoly being broken up by federal antitrust legislation", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following aspects of the Populist movement?",
          passage: "\"The newspapers are lying, the school books are lying, the colleges are teaching what the money power dictates... We will answer their demand for a gold standard by saying to them: You shall not press down upon the brow of labor this crown of thorns; you shall not crucify mankind upon a cross of gold!\" — William Jennings Bryan, Democratic National Convention, 1896",
          explanation: "Correct: (A) Bryan's Cross of Gold speech was the defining statement of agrarian Populism — arguing that the gold standard contracted the money supply and disadvantaged farmers burdened with debt. (B) is wrong — Bryan supported silver coinage to inflate currency, not a return to bimetallism as a conservative position. (C) is wrong — Bryan attacked the wealthy, not immigrants. (D) is wrong — Bryan was criticizing industrial capitalism and monetary policy, not advocating for labor unions specifically.",
          correctChoiceId: "", orderIndex: 4,
          choices: { create: [
            { text: "Agrarian grievances against the gold standard that contracted the money supply and disadvantaged indebted farmers", isCorrect: true, orderIndex: 0 },
            { text: "Conservative support for maintaining the gold standard to stabilize the U.S. economy", isCorrect: false, orderIndex: 1 },
            { text: "Nativist opposition to immigration fueling economic competition with American workers", isCorrect: false, orderIndex: 2 },
            { text: "Urban labor union demands for an eight-hour workday and better wages", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following experiences of immigrants in late nineteenth-century American cities?",
          passage: "\"In the tenement districts of New York's Lower East Side, families of six or eight slept in rooms barely large enough for two. The air was thick with the smells of cooking, unwashed bodies, and the refuse from the streets below. Children played in alleys between buildings that blocked all sunlight. Tuberculosis spread through the buildings at frightening speed.\" — Jacob Riis, How the Other Half Lives, 1890",
          explanation: "Correct: (C) Riis's photojournalism documented the appalling tenement conditions facing immigrants in New York — overcrowding, disease, and poverty. (A) is wrong — conditions described were horrific. (B) is wrong — this describes existing hardship, not political organizing. (D) is wrong — the passage describes urban immigrants, not rural farmers.",
          correctChoiceId: "", orderIndex: 5,
          choices: { create: [
            { text: "How settlement houses improved conditions for immigrants arriving in American cities", isCorrect: false, orderIndex: 0 },
            { text: "How immigrant communities organized politically to challenge corrupt machine politics", isCorrect: false, orderIndex: 1 },
            { text: "The overcrowded and dangerous conditions in urban immigrant neighborhoods that reformers sought to address", isCorrect: true, orderIndex: 2 },
            { text: "The challenges facing immigrant farmers who settled on the Great Plains in the late 1800s", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The graph above most directly supports which of the following conclusions about American industry in the Gilded Age?",
          passage: "[GRAPH DESCRIPTION] A bar graph shows U.S. steel production in millions of tons: 1870: 0.07 million tons; 1880: 1.2 million tons; 1890: 4.3 million tons; 1900: 10.2 million tons; 1910: 26.1 million tons. A second line shows average real wages of steel workers declining from 1880–1893 before recovering.",
          explanation: "Correct: (B) The data shows explosive industrial growth alongside stagnant or declining real wages for workers — the core Gilded Age contradiction that fueled labor activism and Progressive reform. (A) is wrong — wages declined in the early period even as output soared. (C) is wrong — wages recovered only after 1893. (D) is wrong — the data shows labor conditions lagging behind productivity gains.",
          correctChoiceId: "", orderIndex: 6,
          choices: { create: [
            { text: "Rising industrial output was matched by equally rising wages for steel workers throughout the Gilded Age", isCorrect: false, orderIndex: 0 },
            { text: "Industrial production grew dramatically while workers' real wages stagnated, fueling labor unrest", isCorrect: true, orderIndex: 1 },
            { text: "Real wages for industrial workers consistently improved throughout the 1870–1910 period", isCorrect: false, orderIndex: 2 },
            { text: "Workers shared equitably in the productivity gains of the Gilded Age steel industry", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above best illustrates which of the following Progressive Era beliefs?",
          passage: "\"We are convinced that in order to protect the health of American children, to ensure the safety of food, to clean up the political corruption of our cities, and to break the stranglehold of corporate monopoly, government must step in. The invisible hand of the market has given us child labor, poisoned food, and a United States Senate owned by the trusts. Reform requires the visible hand of the people acting through government.\" — Progressive Party Platform, 1912",
          explanation: "Correct: (A) The Progressive Era was defined by belief in using government power to correct the abuses of industrial capitalism — child labor laws, food safety (Pure Food and Drug Act), antitrust action, and direct democracy reforms. (B) is wrong — Progressives actively sought government intervention. (C) is wrong — this is the Progressive platform, not a conservative position. (D) is wrong — Progressives sought to regulate, not abolish, capitalism.",
          correctChoiceId: "", orderIndex: 7,
          choices: { create: [
            { text: "Government activism as the primary tool for correcting the social and economic abuses of industrial capitalism", isCorrect: true, orderIndex: 0 },
            { text: "Laissez-faire economics as the best way to create prosperity for all Americans", isCorrect: false, orderIndex: 1 },
            { text: "Conservative defense of corporate freedom from government interference", isCorrect: false, orderIndex: 2 },
            { text: "Socialist demands for the public ownership of major industries", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The account above most directly reflects which of the following labor conflicts of the Gilded Age?",
          passage: "\"On July 6, 1892, three hundred men — private detectives hired by the Carnegie Steel Company — came up the Monongahela River on barges before dawn. We had been locked out of our own mill because we refused to accept the company's new wage cuts. We had families to feed. When the barges landed, shots were fired. Men fell on both sides. The state militia came and put down our strike. The plant reopened with scab labor.\" — Amalgamated Association worker, Homestead Strike, 1892",
          explanation: "Correct: (D) The Homestead Strike of 1892 was the decisive Gilded Age labor conflict — Carnegie and Frick used Pinkerton detectives, lockouts, and state militia to break the union and set back organized labor for a generation. (A) is wrong — the excerpt describes a defeat for labor. (B) is wrong — the Pullman Strike was in 1894 and involved railroad workers. (C) is wrong — there is no mention of the eight-hour movement here.",
          correctChoiceId: "", orderIndex: 8,
          choices: { create: [
            { text: "The victory of organized labor in forcing Carnegie Steel to recognize union contracts", isCorrect: false, orderIndex: 0 },
            { text: "The Pullman Strike of 1894 and federal intervention on behalf of railroad corporations", isCorrect: false, orderIndex: 1 },
            { text: "The eight-hour workday movement that successfully reduced working hours in American steel mills", isCorrect: false, orderIndex: 2 },
            { text: "How industrial corporations used private security forces and government power to crush labor organizing", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The map above most directly reflects which of the following developments in late nineteenth-century America?",
          passage: "[MAP DESCRIPTION] A railroad map of the United States in 1890 shows a dense web of railroad lines east of the Mississippi. West of the Mississippi, four transcontinental lines connect the coasts. Shaded areas show land grants given to railroad companies — vast territories in the Great Plains and West shown in dark shading.",
          explanation: "Correct: (C) The transcontinental railroads were built with massive federal land grants — some 170 million acres — enabling rail expansion while creating monopolistic power that Populists and Progressives sought to regulate. (A) is wrong — the map shows existing railroads, not a future proposal. (B) is wrong — railroads promoted westward migration, not restrictions. (D) is wrong — federal support (land grants) was extensive, not limited.",
          correctChoiceId: "", orderIndex: 9,
          choices: { create: [
            { text: "Congressional proposals for a national railroad system to compete with private companies", isCorrect: false, orderIndex: 0 },
            { text: "How railroad expansion restricted westward settlement by controlling access to land", isCorrect: false, orderIndex: 1 },
            { text: "Federal land grants enabled railroad expansion but created powerful monopolies that became targets of reform", isCorrect: true, orderIndex: 2 },
            { text: "Limited federal involvement in railroad construction that left infrastructure to private initiative alone", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following arguments about Gilded Age economic inequality?",
          passage: "\"There is a growing feeling... that the millionaires and multi-millionaires of our day, who are the product of a system which rewards an individual's shrewdness... are actually impoverishing the masses. While Carnegie builds libraries with the profits extracted from his workers... those workers cannot afford to buy books. Charity does not address exploitation.\" — Henry George, Progress and Poverty, adapted, 1879",
          explanation: "Correct: (B) George's critique anticipates the Progressive Era — vast wealth accumulated at the top through industrial capitalism while workers were impoverished. Carnegie's philanthropy is presented as a smokescreen for exploitation. (A) is wrong — George critiques the system, not individual failure. (C) is wrong — George is criticizing Gilded Age capitalism, not defending it. (D) is wrong — George's critique is about structural inequality, not immigration.",
          correctChoiceId: "", orderIndex: 10,
          choices: { create: [
            { text: "The argument that poverty resulted from individual moral failure rather than structural economic inequality", isCorrect: false, orderIndex: 0 },
            { text: "The critique that industrial capitalism concentrated wealth at the top while impoverishing workers, making philanthropy insufficient", isCorrect: true, orderIndex: 1 },
            { text: "Defense of Carnegie's philanthropy as proof that industrial capitalism ultimately benefited all Americans", isCorrect: false, orderIndex: 2 },
            { text: "Nativist arguments that immigration was the primary cause of wage depression and poverty", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The source above most directly illustrates which of the following aspects of the Progressive Era?",
          passage: "\"We, the women of the United States, have come to Washington to demand that our voices be heard. We pay taxes. We raise soldiers. We educate children. Yet we have no vote. If democracy means government by the people, then half the people are excluded. The time for debate is over. The 19th Amendment must pass.\" — National American Woman Suffrage Association, 1919",
          explanation: "Correct: (A) The suffrage movement achieved its goal with the 19th Amendment (1920), arguing that women's civic contributions — taxation, raising soldiers, education — required political representation. This was a core Progressive Era democratic reform. (B) is wrong — this was specifically about federal voting rights, not a local issue. (C) is wrong — the women's rights movement predated the Progressive Era but reached its goal during it. (D) is wrong — the passage calls for immediate action, not gradual reform.",
          correctChoiceId: "", orderIndex: 11,
          choices: { create: [
            { text: "Women's suffrage as a Progressive Era democratic reform extending political rights to half the population", isCorrect: true, orderIndex: 0 },
            { text: "State-level voting rights for women as an alternative to a constitutional amendment", isCorrect: false, orderIndex: 1 },
            { text: "Women's rights activism beginning during the Progressive Era with no earlier roots", isCorrect: false, orderIndex: 2 },
            { text: "A gradual approach to women's suffrage that sought to educate male voters before seeking the vote", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following features of machine politics in Gilded Age cities?",
          passage: "\"When a family's breadwinner lost his job, it was not the government that came. It was my man — my ward captain — who was there with a bag of coal and a basket of food and the promise of work. When the immigrant arrived off the boat, confused and alone, it was Tammany Hall that met him and showed him how to become a citizen, how to vote, and how to survive. We gave them what they needed. In return they gave us their votes.\" — George Washington Plunkitt of Tammany Hall, c. 1905",
          explanation: "Correct: (C) Plunkitt's frank account describes the exchange at the heart of urban machine politics — social services, jobs, and help for immigrants in exchange for political loyalty. Progressives attacked this as corruption; defenders pointed to its welfare function. (A) is wrong — Plunkitt describes helping immigrants, not excluding them. (B) is wrong — this is the machine's own account, not a reform critique. (D) is wrong — Tammany Hall exploited, but also served, immigrant communities.",
          correctChoiceId: "", orderIndex: 12,
          choices: { create: [
            { text: "How urban political machines excluded recent immigrants from political participation", isCorrect: false, orderIndex: 0 },
            { text: "Progressive Era criticism of machine politics as inherently corrupt and anti-democratic", isCorrect: false, orderIndex: 1 },
            { text: "How political machines provided social services to immigrants in exchange for political loyalty", isCorrect: true, orderIndex: 2 },
            { text: "How machine bosses exploited immigrant communities without providing any real benefits", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above most directly supports which of the following conclusions about racial inequality in the Gilded Age?",
          passage: "\"We the colored citizens of this state do hereby protest the enactment of laws requiring separate railway cars for white and colored passengers. We are taxpayers. We are citizens. The Constitution grants us equal protection of the laws. These separate car laws are designed to humiliate and degrade us, to mark us as an inferior caste... We appeal to the courts and to the conscience of the nation.\" — New Orleans Citizens Committee, 1892 (challenging what became Plessy v. Ferguson)",
          explanation: "Correct: (B) The Citizens Committee challenged Louisiana's Separate Car Act, leading to the Plessy v. Ferguson (1896) Supreme Court ruling that upheld 'separate but equal' and entrenched Jim Crow for 58 years. (A) is wrong — the committee was protesting the law. (C) is wrong — they explicitly appealed to courts and the nation. (D) is wrong — segregation was imposed despite the 14th Amendment.",
          correctChoiceId: "", orderIndex: 13,
          choices: { create: [
            { text: "African American acceptance of segregation in exchange for economic advancement in the New South", isCorrect: false, orderIndex: 0 },
            { text: "African American resistance to Jim Crow segregation through legal challenges that ultimately led to Plessy v. Ferguson", isCorrect: true, orderIndex: 1 },
            { text: "African American abandonment of legal strategies in favor of emigration to the North", isCorrect: false, orderIndex: 2 },
            { text: "How the 14th Amendment successfully protected African American civil rights in the post-Reconstruction South", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following aspects of the early environmental conservation movement?",
          passage: "\"Thousands of tired, nerve-shaken, over-civilized people are beginning to find out that going to the mountains is going home; that wildness is a necessity... the forests of America, however slighted by man, must have been a great delight to God; for they were the best he ever planted.\" — John Muir, Our National Parks, 1901",
          explanation: "Correct: (A) Muir's writing articulated the preservationist argument — wilderness had spiritual, aesthetic, and psychological value beyond economic use — driving the creation of National Parks. This was distinct from Pinchot's utilitarian 'conservation.' (B) is wrong — Muir was a preservationist, not a utilitarian resource manager. (C) is wrong — Muir is talking about spiritual renewal, not scientific management. (D) is wrong — Muir is describing the wilderness he wants to protect, not lamenting destruction.",
          correctChoiceId: "", orderIndex: 14,
          choices: { create: [
            { text: "Preservationist arguments that wilderness had spiritual and aesthetic value beyond economic use", isCorrect: true, orderIndex: 0 },
            { text: "Utilitarian conservation arguments for managing natural resources for long-term economic use", isCorrect: false, orderIndex: 1 },
            { text: "Scientific arguments for government regulation of timber and mining on federal lands", isCorrect: false, orderIndex: 2 },
            { text: "Criticism of industrialization for destroying America's natural resources and landscapes", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The source above most directly reflects which of the following continuities between the Gilded Age and the Progressive Era?",
          passage: "\"The railroads were built with government land grants; their monopoly profits were made with government rate protection. The oil trust was built with government-enforced property rights. The steel barons used government courts and militia to break their unions. Yet when we ask government to regulate these corporations in the public interest, they cry 'socialism.' The question is not whether government will intervene — it always has — but whose side it will be on.\" — Robert La Follette, Progressive senator, c. 1908",
          explanation: "Correct: (D) La Follette's argument exposes the hypocrisy of laissez-faire ideology — corporations had always benefited from government intervention; Progressives were simply redirecting that intervention toward public rather than private benefit. (A) is wrong — La Follette argues government ALREADY intervened, but on the wrong side. (B) is wrong — La Follette is making the case for reform, not arguing it was impossible. (C) is wrong — this is about domestic economic policy, not imperialism.",
          correctChoiceId: "", orderIndex: 15,
          choices: { create: [
            { text: "The argument that free market capitalism operated without government interference throughout the Gilded Age", isCorrect: false, orderIndex: 0 },
            { text: "Progressive frustration that corporate power made meaningful reform impossible in the American political system", isCorrect: false, orderIndex: 1 },
            { text: "Populist arguments that American imperialism abroad was connected to corporate exploitation at home", isCorrect: false, orderIndex: 2 },
            { text: "The argument that government had always intervened in the economy — Progressives sought to redirect that intervention toward the public interest", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The data above most directly supports which of the following conclusions about urbanization in the Gilded Age?",
          passage: "[CHART: U.S. Urban vs. Rural Population, 1860–1920]\n| Year | Urban Population | Rural Population | % Urban |\n|------|-----------------|-----------------|----------|\n| 1860 | 6.2 million     | 25.2 million    | 19.8%    |\n| 1880 | 14.1 million    | 36.0 million    | 28.2%    |\n| 1900 | 30.2 million    | 45.8 million    | 39.7%    |\n| 1920 | 54.2 million    | 51.6 million    | 51.2%    |",
          explanation: "Correct: (A) The data shows the urban population growing from under 20% in 1860 to over 50% in 1920 — a transformation driven by industrialization and immigration that fundamentally changed American society and politics. (B) is wrong — rural population was still larger than urban as late as 1910. (C) is wrong — the trend shows rapid urbanization, not slowing. (D) is wrong — urban and rural populations were roughly equal only in 1920.",
          correctChoiceId: "", orderIndex: 16,
          choices: { create: [
            { text: "Rapid industrialization and immigration transformed the U.S. from a predominantly rural to a predominantly urban society between 1860 and 1920", isCorrect: true, orderIndex: 0 },
            { text: "Rural populations began declining in absolute numbers after 1880 as people migrated to cities", isCorrect: false, orderIndex: 1 },
            { text: "The rate of urbanization slowed after 1900 as immigration restrictions took effect", isCorrect: false, orderIndex: 2 },
            { text: "Urban and rural populations were roughly equal throughout the late nineteenth century", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above most directly reflects which of the following developments of the Progressive Era?",
          passage: "\"The provisions of this Act shall apply to all foods, drugs, medicines, and liquors... The Secretary of Agriculture is hereby authorized to inspect all establishments where food and drugs are manufactured, processed, or packed... Any article adulterated or misbranded shall be seized and condemned.\" — Pure Food and Drug Act, 1906",
          explanation: "Correct: (C) The Pure Food and Drug Act (1906), along with the Meat Inspection Act of the same year (inspired by Upton Sinclair's The Jungle), was the landmark Progressive Era consumer protection legislation — a direct use of federal power to regulate corporate behavior in the public interest. (A) is wrong — this is federal, not state, regulation. (B) is wrong — this specifically covers food and drugs, not broader economic monopolies. (D) is wrong — this Act regulated food and drug safety, not agricultural prices.",
          correctChoiceId: "", orderIndex: 17,
          choices: { create: [
            { text: "State-level regulation of food safety as an alternative to federal intervention", isCorrect: false, orderIndex: 0 },
            { text: "Federal antitrust legislation targeting monopolies in the food and drug industries", isCorrect: false, orderIndex: 1 },
            { text: "Progressive Era federal consumer protection legislation using government power to regulate corporate behavior", isCorrect: true, orderIndex: 2 },
            { text: "Federal price controls on agricultural products designed to help American farmers", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The image above most directly illustrates which of the following developments in the Gilded Age American West?",
          passage: "[IMAGE DESCRIPTION] An 1889 painting shows a line of Native American figures on horseback on a hilltop, silhouetted against the sky, watching a steam train pass through the valley below. The valley is surrounded by recently fenced cattle ranches and a small wooden town. Buffalo skulls litter the foreground.",
          explanation: "Correct: (B) The image synthesizes the multiple forces that destroyed Plains Indian life — railroads, fenced ranches, settler towns, and the extermination of the buffalo — as Native Americans watch the transformation of their homeland. (A) is wrong — the image shows dispossession, not coexistence. (C) is wrong — there is no evidence of reservation life in the image. (D) is wrong — the train is shown as an instrument of dispossession, not economic opportunity.",
          correctChoiceId: "", orderIndex: 18,
          choices: { create: [
            { text: "Peaceful coexistence between Native American communities and westward-expanding settlers on the Great Plains", isCorrect: false, orderIndex: 0 },
            { text: "How railroad expansion, ranching, and the destruction of the buffalo undermined Plains Indian ways of life", isCorrect: true, orderIndex: 1 },
            { text: "Native American adaptation to reservation life and participation in the market economy", isCorrect: false, orderIndex: 2 },
            { text: "How the railroad offered Native Americans economic opportunities by connecting them to eastern markets", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following arguments made by advocates of the 'New South'?",
          passage: "\"There is a New South — not through protest against the old, but because of new conditions, new adjustments, and if you please, new ideas and aspirations... We have established the fact that in the general summary the Free Negro counts more than the slave... We have fallen in love with work. We have established thrift... We have sowed towns and cities in the place of theories.\" — Henry Grady, 'The New South' speech, 1886",
          explanation: "Correct: (A) Grady's 'New South' speech argued that the post-Civil War South should embrace industrialization, reconcile with the North, and move beyond slavery — while simultaneously defending racial hierarchy. (B) is wrong — Grady celebrated, not criticized, the end of the old slave economy. (C) is wrong — Grady was arguing for reconciliation with the North and industrial development. (D) is wrong — Grady was a booster of industrialization.",
          correctChoiceId: "", orderIndex: 19,
          choices: { create: [
            { text: "Advocates of Southern industrialization who argued the South should embrace economic development and Northern investment while maintaining white supremacy", isCorrect: true, orderIndex: 0 },
            { text: "Former Confederates who mourned the destruction of the antebellum plantation economy", isCorrect: false, orderIndex: 1 },
            { text: "Southern Republicans who supported continued federal intervention in Southern racial politics", isCorrect: false, orderIndex: 2 },
            { text: "Labor organizers who argued that industrialization would create economic equality between Black and white Southerners", isCorrect: false, orderIndex: 3 },
          ]},
        },
      ]},
    },
    include: { questions: { include: { choices: true } } },
  })
  await fixCorrectChoices(quiz2)
  console.log("✓ Created quiz:", quiz2.title, `(${quiz2.questions.length} questions)`)

  // ── Quiz Bank 3: AP World History – Cold War & Decolonization ───
  const quiz3 = await prisma.questionBank.create({
    data: {
      title: "AP World History – Cold War & Decolonization",
      subject: "AP World History",
      description: "Stimulus-based questions on the Cold War, nuclear arms race, proxy conflicts, and the decolonization movements of Asia and Africa.",
      isPublic: true, ownerId: admin.id,
      questions: { create: [
        {
          prompt: "The speech excerpt above most directly reflects which of the following developments in post-WWII international relations?",
          passage: "\"From Stettin in the Baltic to Trieste in the Adriatic, an iron curtain has descended across the Continent. Behind that line lie all the capitals of the ancient states of Central and Eastern Europe... all are subject, in one form or another, not only to Soviet influence but to a very high and in some cases increasing measure of control from Moscow.\" — Winston Churchill, Fulton, Missouri, March 1946",
          explanation: "Correct: (A) Churchill's 'Iron Curtain' speech was one of the first major articulations of the Cold War division of Europe — a symbolic marker of the beginning of the superpower rivalry. (B) is wrong — the speech is about Soviet control of Eastern Europe, not German rearmament. (C) is wrong — Churchill was describing the beginning of Cold War division, not its resolution. (D) is wrong — the NATO alliance came later in 1949.",
          correctChoiceId: "", orderIndex: 0,
          choices: { create: [
            { text: "The beginning of the Cold War division of Europe into Soviet and Western spheres of influence", isCorrect: true, orderIndex: 0 },
            { text: "Western fears of German rearmament following World War II", isCorrect: false, orderIndex: 1 },
            { text: "The resolution of territorial disputes in Europe through diplomatic negotiation", isCorrect: false, orderIndex: 2 },
            { text: "The formation of NATO as a collective defense alliance against Soviet expansion", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The document above most directly reflects which of the following U.S. foreign policy strategies during the Cold War?",
          passage: "\"I believe that it must be the policy of the United States to support free peoples who are resisting attempted subjugation by armed minorities or by outside pressures... I believe that we must assist free peoples to work out their own destinies in their own way. I believe that our help should be primarily through economic and financial aid which is essential to economic stability and orderly political processes.\" — Harry S. Truman, address to Congress, March 12, 1947",
          explanation: "Correct: (C) The Truman Doctrine (1947) established the policy of containment — using American economic and military aid to prevent Soviet expansion. It was first applied to Greece and Turkey. (A) is wrong — this was the Truman Doctrine, not the Marshall Plan (though related). (B) is wrong — Truman explicitly calls for assisting 'free peoples,' not withdrawing from Europe. (D) is wrong — the Truman Doctrine addressed the whole world, not just Asia.",
          correctChoiceId: "", orderIndex: 1,
          choices: { create: [
            { text: "The Marshall Plan's economic recovery program for Western Europe after World War II", isCorrect: false, orderIndex: 0 },
            { text: "American isolationism and withdrawal from European affairs following World War II", isCorrect: false, orderIndex: 1 },
            { text: "The containment policy committing the U.S. to resisting Soviet expansion globally", isCorrect: true, orderIndex: 2 },
            { text: "The domino theory applied to justifying military intervention in Southeast Asia", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The map above most directly reflects which of the following Cold War developments?",
          passage: "[MAP DESCRIPTION] A map of Africa dated 1960 shows the continent at a moment of dramatic change: yellow shading marks territories that achieved independence between 1956 and 1960; orange marks territories that became independent 1961–1975; large areas still in white show remaining colonial territories. The year '1960' is labeled 'The Year of Africa' in the caption.",
          explanation: "Correct: (B) 1960 saw 17 African nations gain independence in a single year — the acceleration of decolonization driven by WWI and WWII weakening European colonial powers, nationalist movements, and Cold War superpowers supporting independence to gain allies. (A) is wrong — decolonization was a process over decades, not a single event. (C) is wrong — the map shows Africa, not Asia. (D) is wrong — the Cold War divided some newly independent nations but the map shows decolonization broadly.",
          correctChoiceId: "", orderIndex: 2,
          choices: { create: [
            { text: "A single wave of decolonization that granted all African colonies independence simultaneously in 1960", isCorrect: false, orderIndex: 0 },
            { text: "The rapid acceleration of African decolonization between the 1950s and 1970s driven by nationalist movements and Cold War pressures", isCorrect: true, orderIndex: 1 },
            { text: "Asian decolonization movements that inspired similar independence struggles in sub-Saharan Africa", isCorrect: false, orderIndex: 2 },
            { text: "How Cold War competition between the U.S. and USSR divided Africa into competing blocs of aligned nations", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following arguments about Cold War competition?",
          passage: "\"We will bury you... Whether you like it or not, history is on our side. Your grandchildren will live under communism... Your capitalists will sell us the rope with which we will hang them.\" — Nikita Khrushchev, 1956",
          explanation: "Correct: (A) Khrushchev's rhetoric expressed Soviet confidence in ideological inevitability — communism would triumph through historical forces, not necessarily military conquest. This fed American fears that justified containment. (B) is wrong — Khrushchev says 'we will bury you,' not that nuclear war is planned. (C) is wrong — this is triumphalist rhetoric, not diplomatic outreach. (D) is wrong — Khrushchev was confident, not defensive.",
          correctChoiceId: "", orderIndex: 3,
          choices: { create: [
            { text: "Soviet belief in the historical inevitability of communism's global triumph that fueled Cold War ideological competition", isCorrect: true, orderIndex: 0 },
            { text: "Soviet plans for nuclear first-strike against the United States and Western Europe", isCorrect: false, orderIndex: 1 },
            { text: "Soviet diplomatic overtures toward peaceful coexistence with the United States", isCorrect: false, orderIndex: 2 },
            { text: "Soviet fear of American economic and military power dominating the postwar world", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The photograph above most directly illustrates which of the following aspects of the Cuban Missile Crisis?",
          passage: "[PHOTOGRAPH DESCRIPTION] A grainy black-and-white aerial reconnaissance photograph taken by a U-2 spy plane, October 1962. Annotations added by U.S. analysts label missile transporters, launch positions, and fuel trucks at a site labeled 'San Cristóbal MRBM Site No. 1, Cuba.' The image was presented to the United Nations Security Council.",
          explanation: "Correct: (C) The U-2 reconnaissance photographs were the critical evidence Kennedy used to confront the Soviet Union — they were presented publicly at the UN, transforming a secret intelligence discovery into an international crisis. (A) is wrong — the U-2 was a surveillance plane, not a weapon. (B) is wrong — the U-2 flew in 1962; the Bay of Pigs was 1961. (D) is wrong — the photographs triggered the crisis, not the resolution.",
          correctChoiceId: "", orderIndex: 4,
          choices: { create: [
            { text: "American air strikes against Soviet missile installations in Cuba during the crisis", isCorrect: false, orderIndex: 0 },
            { text: "CIA aerial reconnaissance that preceded the failed Bay of Pigs invasion of 1961", isCorrect: false, orderIndex: 1 },
            { text: "How aerial surveillance evidence was used to expose Soviet missile deployment and build international support against it", isCorrect: true, orderIndex: 2 },
            { text: "The diplomatic negotiations that led to the peaceful resolution of the Cuban Missile Crisis", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The speech excerpt above most directly reflects which of the following aspects of decolonization in Asia?",
          passage: "\"Long years ago we made a tryst with destiny, and now the time comes when we shall redeem our pledge... At the stroke of the midnight hour, when the world sleeps, India will awake to life and freedom. A moment comes, which comes but rarely in history, when we step out from the old to the new, when an age ends, and when the soul of a nation, long suppressed, finds utterance.\" — Jawaharlal Nehru, August 14, 1947",
          explanation: "Correct: (B) Nehru's 'Tryst with Destiny' speech marked Indian independence from Britain on August 15, 1947 — the culmination of decades of nationalist struggle. (A) is wrong — India gained independence in 1947, not after partition violence. (C) is wrong — Nehru was a nationalist leader, not a communist. (D) is wrong — India became independent in 1947, before the People's Republic of China was established in 1949.",
          correctChoiceId: "", orderIndex: 5,
          choices: { create: [
            { text: "Indian independence from British colonial rule achieved through decades of nationalist struggle", isCorrect: true, orderIndex: 0 },
            { text: "Nehru's response to the partition violence that accompanied Indian independence", isCorrect: false, orderIndex: 1 },
            { text: "Communist revolutionary ideology inspiring Asian independence movements against European colonialism", isCorrect: false, orderIndex: 2 },
            { text: "The Non-Aligned Movement's declaration of independence from both Cold War superpowers", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly illustrates which of the following debates within the U.S. during the Cold War?",
          passage: "\"Are you now or have you ever been a member of the Communist Party?... The Committee is not here to persecute innocent people. But we cannot allow Communist infiltrators to remain in positions of influence in the United States government, military, or entertainment industry. The security of the nation demands it.\" — House Un-American Activities Committee hearing, 1950s",
          explanation: "Correct: (D) HUAC and McCarthyism represented the domestic Cold War fear of communist subversion — investigations that destroyed careers and civil liberties in the name of national security. (A) is wrong — these were not espionage convictions, but accusations at hearings. (B) is wrong — this is HUAC targeting individuals, not foreign policy debates. (C) is wrong — this is domestic anti-communism, not nuclear strategy.",
          correctChoiceId: "", orderIndex: 6,
          choices: { create: [
            { text: "Successful FBI investigations that uncovered Soviet spy networks within the U.S. government", isCorrect: false, orderIndex: 0 },
            { text: "Congressional debates over the Truman Doctrine and Marshall Plan commitments in Europe", isCorrect: false, orderIndex: 1 },
            { text: "American debates about nuclear strategy and deterrence against Soviet missile threats", isCorrect: false, orderIndex: 2 },
            { text: "How Cold War anti-communist hysteria threatened civil liberties and careers through the Red Scare", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above most directly reflects which of the following features of the Non-Aligned Movement?",
          passage: "\"We, the leaders of Asia and Africa, assembled here in Bandung... declare that colonialism in all its manifestations is an evil which should speedily be brought to an end. We affirm the right of all nations to equality and self-determination. We believe that the rights of all nations, large and small, rich and poor, must be respected. We are committed to peace, but we are not committed to the blocs of either power.\" — Bandung Conference Declaration, 1955",
          explanation: "Correct: (C) The Bandung Conference (1955) was the founding moment of the Non-Aligned Movement — 29 Asian and African nations declaring independence from both Cold War blocs while uniting against colonialism. (A) is wrong — the declaration explicitly rejects alignment with either bloc. (B) is wrong — the declaration opposes colonialism, not specifically Western capitalism. (D) is wrong — the Bandung nations were not communist; they rejected alignment with both superpowers.",
          correctChoiceId: "", orderIndex: 7,
          choices: { create: [
            { text: "Asian and African nations joining the Soviet-led bloc to oppose Western imperialism", isCorrect: false, orderIndex: 0 },
            { text: "Newly independent nations creating an economic alternative to Western capitalism", isCorrect: false, orderIndex: 1 },
            { text: "Newly independent Asian and African nations asserting independence from both Cold War superpowers while opposing colonialism", isCorrect: true, orderIndex: 2 },
            { text: "Communist revolutionary movements in Asia and Africa coordinating through Soviet-sponsored conferences", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The data above most directly supports which of the following conclusions about the nuclear arms race?",
          passage: "[TABLE: U.S. and Soviet Nuclear Warhead Stockpiles, 1950–1985]\n| Year | U.S. Warheads | Soviet Warheads | Global Total |\n|------|---------------|-----------------|-------------|\n| 1950 | 299           | 5               | 304          |\n| 1960 | 18,638        | 1,627           | 20,265       |\n| 1970 | 26,119        | 11,643          | 37,762       |\n| 1980 | 24,304        | 30,062          | 54,366       |\n| 1985 | 23,368        | 39,197          | 62,565       |",
          explanation: "Correct: (A) The data shows nuclear warheads growing from 304 globally in 1950 to over 62,000 by 1985 — far beyond any rational military need, illustrating the 'action-reaction' dynamic of the arms race. (B) is wrong — the USSR surpassed the U.S. in warhead count by 1978. (C) is wrong — both nations massively expanded arsenals from the 1950s through the 1980s. (D) is wrong — the data shows an arms race, not stable deterrence.",
          correctChoiceId: "", orderIndex: 8,
          choices: { create: [
            { text: "The nuclear arms race produced tens of thousands of warheads far exceeding any rational military necessity", isCorrect: true, orderIndex: 0 },
            { text: "The United States maintained nuclear superiority over the Soviet Union throughout the Cold War", isCorrect: false, orderIndex: 1 },
            { text: "Both superpowers chose to limit nuclear weapons growth to reduce the risk of accidental war", isCorrect: false, orderIndex: 2 },
            { text: "The doctrine of Mutually Assured Destruction (MAD) produced stable deterrence with minimal warhead growth", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following aspects of the Vietnam War?",
          passage: "\"We are not about to send American boys nine or ten thousand miles away from home to do what Asian boys ought to be doing for themselves.\" — Lyndon B. Johnson, campaign speech, October 1964\n\n[Three months later, Johnson authorized the first deployment of U.S. combat troops to Vietnam.]",
          explanation: "Correct: (B) Johnson's statement and the subsequent deployment illustrate the 'credibility gap' — the growing mistrust of government as official statements repeatedly contradicted military realities. (A) is wrong — Johnson's later actions escalated the war. (C) is wrong — this is specifically about Vietnam. (D) is wrong — this shows LBJ's contradiction, not congressional debate.",
          correctChoiceId: "", orderIndex: 9,
          choices: { create: [
            { text: "Johnson's consistent anti-escalation position that guided U.S. strategy in Vietnam", isCorrect: false, orderIndex: 0 },
            { text: "The credibility gap between official government statements and actual military escalation in Vietnam", isCorrect: true, orderIndex: 1 },
            { text: "Johnson's application of containment theory to justify early American involvement in Indochina", isCorrect: false, orderIndex: 2 },
            { text: "Congressional debate over the Gulf of Tonkin Resolution and authorization of military force", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The speech excerpt above most directly illustrates which of the following aspects of decolonization in Africa?",
          passage: "\"Africa is at last at the crossroads. And it is for us, the people of Africa, to decide whether we are to achieve unity or to disintegrate. We must unite now or perish... The independent states of Africa must merge into a Union Government. Our economics must be united. Our defenses must be united. Africa must speak with one voice.\" — Kwame Nkrumah, speech, 1963",
          explanation: "Correct: (C) Nkrumah, Ghana's first president, was the leading advocate of Pan-Africanism — the idea that politically independent but economically weak African states must unite to resist neocolonialism. The OAU (1963) was a partial realization. (A) is wrong — Nkrumah is pushing for more unity, not satisfied with current progress. (B) is wrong — this is not about military non-alignment. (D) is wrong — Nkrumah is arguing against economic fragmentation.",
          correctChoiceId: "", orderIndex: 10,
          choices: { create: [
            { text: "African celebration of achieved unity following the end of colonialism across the continent", isCorrect: false, orderIndex: 0 },
            { text: "Non-Aligned Movement rhetoric rejecting military alliances with either Cold War superpower", isCorrect: false, orderIndex: 1 },
            { text: "Pan-African calls for political and economic unity to prevent neocolonial dependency after independence", isCorrect: true, orderIndex: 2 },
            { text: "African arguments for maintaining existing colonial economic relationships while seeking political independence", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above most directly reflects which of the following outcomes of the Korean War?",
          passage: "\"After three years of fighting, millions of casualties, and the use of sixteen nations' forces under the United Nations flag, the armistice restored the boundary between North and South Korea to roughly the 38th parallel — nearly exactly where it had been when the war began in June 1950. The Demilitarized Zone was drawn. No peace treaty was signed.\" — adapted from Korean War historical summary",
          explanation: "Correct: (A) The Korean War ended in armistice with no territorial change — a fundamental characteristic that gave it the label 'The Forgotten War' and illustrated the limits of containment as a strategy. (B) is wrong — Korea remained divided; there was no unification. (C) is wrong — the armistice was not a decisive American victory. (D) is wrong — the Korean War involved large-scale conventional fighting, not primarily guerrilla tactics.",
          correctChoiceId: "", orderIndex: 11,
          choices: { create: [
            { text: "The Korean War ended in a stalemate with no territorial change, demonstrating the limited aims of Cold War containment", isCorrect: true, orderIndex: 0 },
            { text: "The Korean War resulted in the unification of Korea under a pro-Western government", isCorrect: false, orderIndex: 1 },
            { text: "U.S. and UN forces achieved a decisive military victory but chose to limit the conflict to avoid confrontation with China", isCorrect: false, orderIndex: 2 },
            { text: "The Korean War was primarily a guerrilla conflict that the U.S. could not win with conventional military forces", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The speech excerpt above most directly reflects which of the following aspects of the Cold War at home?",
          passage: "\"In the councils of government, we must guard against the acquisition of unwarranted influence, whether sought or unsought, by the military-industrial complex. The potential for the disastrous rise of misplaced power exists and will persist. We must never let the weight of this combination endanger our liberties or democratic processes.\" — Dwight D. Eisenhower, Farewell Address, January 1961",
          explanation: "Correct: (D) Eisenhower — a five-star general and two-term president — warned on leaving office that the permanent wartime economy and defense industry created an institutional force pushing for continued military spending, threatening democratic governance. (A) is wrong — Eisenhower is warning against this complex, not defending it. (B) is wrong — this is about domestic institutional power, not Soviet threats. (C) is wrong — this is about the alliance of military and industry, not communist infiltration.",
          correctChoiceId: "", orderIndex: 12,
          choices: { create: [
            { text: "Defense of military spending as essential to maintaining deterrence against Soviet nuclear forces", isCorrect: false, orderIndex: 0 },
            { text: "Soviet infiltration of American defense industries as a major national security threat", isCorrect: false, orderIndex: 1 },
            { text: "Communist Party influence on American foreign policy through sympathizers in government", isCorrect: false, orderIndex: 2 },
            { text: "How the permanent Cold War defense economy created institutional forces threatening democratic governance", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The source above most directly reflects which of the following features of decolonization in Algeria?",
          passage: "\"We are not fighting to replace French administrators with Algerian ones. We are fighting to destroy the whole colonial system... The Algerian people, through eight years of war, have reclaimed their dignity and sovereignty. France came to Algeria with the cross and the sword; we answer with the gun and the Quran. Independence is not negotiated; it is seized.\" — Front de Libération Nationale (FLN), Algeria, c. 1960",
          explanation: "Correct: (B) Algeria's war of independence (1954–1962) was one of the most violent decolonization conflicts — unlike India's largely nonviolent independence, the FLN waged armed revolution against a French settler colony of one million Europeans. (A) is wrong — the passage explicitly rejects mere administrative transfer. (C) is wrong — the FLN rejected negotiation in favor of armed struggle. (D) is wrong — the passage frames independence as anti-colonial revolution, not Cold War alignment.",
          correctChoiceId: "", orderIndex: 13,
          choices: { create: [
            { text: "Negotiated independence transfers in which colonizers peacefully handed power to indigenous administrators", isCorrect: false, orderIndex: 0 },
            { text: "Violent revolutionary decolonization that sought to destroy colonial systems, not merely replace colonial administrators", isCorrect: true, orderIndex: 1 },
            { text: "Nationalist movements that achieved independence through diplomatic pressure at the United Nations", isCorrect: false, orderIndex: 2 },
            { text: "Cold War-aligned independence movements that sought Soviet support against Western colonial powers", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The cartoon above most directly reflects which of the following Cold War developments?",
          passage: "[CARTOON DESCRIPTION] A 1962 political cartoon shows Khrushchev and Kennedy arm-wrestling across a table while sitting on nuclear missiles. The table is labeled 'Cuba.' Both men are sweating and straining. In the background, a city is visible through a window. The caption reads: 'Who will blink first?'",
          explanation: "Correct: (C) The cartoon captures the MAD dynamic of the Cuban Missile Crisis — both superpowers were deterred from nuclear use by the certainty of mutual destruction; the crisis was resolved when Khrushchev withdrew missiles in exchange for a U.S. pledge not to invade Cuba and a secret removal of U.S. missiles from Turkey. (A) is wrong — the cartoon shows tension between leaders, not military confrontation. (B) is wrong — Kennedy's naval blockade was the key tactic. (D) is wrong — the cartoon shows the crisis, not its diplomatic resolution.",
          correctChoiceId: "", orderIndex: 14,
          choices: { create: [
            { text: "Direct military confrontation between American and Soviet naval forces in the Atlantic", isCorrect: false, orderIndex: 0 },
            { text: "Kennedy's naval blockade strategy to prevent Soviet missiles from reaching Cuba", isCorrect: false, orderIndex: 1 },
            { text: "The nuclear brinkmanship and mutual deterrence that characterized Cold War superpower confrontations", isCorrect: true, orderIndex: 2 },
            { text: "Diplomatic negotiations that resolved the Cuban Missile Crisis without public knowledge", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The excerpt above most directly reflects which of the following developments in the Cold War during the 1970s?",
          passage: "\"The United States and the People's Republic of China agree that... The United States acknowledges that all Chinese on either side of the Taiwan Strait maintain there is but one China and that Taiwan is a part of China... The two sides agreed that it is desirable to normalize relations between the two countries.\" — Shanghai Communiqué, February 1972",
          explanation: "Correct: (A) Nixon's opening to China in 1972 — facilitated by Kissinger's secret diplomacy — was the defining act of détente and realpolitik: exploiting the Sino-Soviet split to create a strategic triangle that weakened the Soviet position. (B) is wrong — the U.S. did not formally recognize Taiwan's independence. (C) is wrong — Nixon opened to China; Vietnam continued separately. (D) is wrong — the communiqué was about political normalization, not trade primarily.",
          correctChoiceId: "", orderIndex: 15,
          choices: { create: [
            { text: "Nixon's opening to China as a realpolitik strategy exploiting the Sino-Soviet split to shift Cold War dynamics", isCorrect: true, orderIndex: 0 },
            { text: "U.S. formal recognition of Taiwan's independence from the People's Republic of China", isCorrect: false, orderIndex: 1 },
            { text: "Nixon's diplomatic strategy linking Chinese support for ending the Vietnam War to normalized relations", isCorrect: false, orderIndex: 2 },
            { text: "American efforts to open Chinese markets to U.S. trade as part of détente economic policy", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above most directly reflects which of the following debates about the Cold War in the Global South?",
          passage: "\"We asked for teachers and tractors. We got guns and ideology. When the Americans came they said they were fighting communism. When the Soviets came they said they were fighting imperialism. Both meant: we will arm one faction to kill another faction, and when the dust clears, we will extract your resources. The Congolese people were never consulted.\" — Congolese academic, 1980s (reconstructed)",
          explanation: "Correct: (B) The passage critiques Cold War proxy warfare in the Global South — both superpowers used local conflicts as arenas for ideological competition, arming factions, destabilizing governments, and extracting resources without regard for local populations. (A) is wrong — the passage shows both superpowers behaving similarly. (C) is wrong — the passage rejects both superpower claims. (D) is wrong — the passage is specifically about external intervention, not internal African politics.",
          correctChoiceId: "", orderIndex: 16,
          choices: { create: [
            { text: "Soviet imperialism as uniquely destructive compared to American Cold War intervention in Africa", isCorrect: false, orderIndex: 0 },
            { text: "How Cold War proxy conflicts served superpower interests at the expense of local populations in the developing world", isCorrect: true, orderIndex: 1 },
            { text: "African rejection of both capitalism and communism in favor of indigenous political and economic systems", isCorrect: false, orderIndex: 2 },
            { text: "Internal political conflicts within African nations caused by the legacy of European colonialism", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The speech excerpt above most directly reflects which of the following causes of the Cold War's end?",
          passage: "\"The Soviet system is not reformable. It was built on a lie, maintained by terror, and is now collapsing under the weight of its own contradictions. We are witnessing the end of an empire. Our task is to manage this collapse peacefully... The people of Eastern Europe have decided their own fate. The Wall is down. The choice belongs to them.\" — Mikhail Gorbachev, 1989 (paraphrase)",
          explanation: "Correct: (D) Gorbachev's reforms (glasnost and perestroika) and his refusal to use force to save Soviet satellite states in Eastern Europe enabled the peaceful revolutions of 1989 — the fall of the Berlin Wall, the end of Communist rule in Eastern Europe, and ultimately the dissolution of the USSR in 1991. (A) is wrong — the passage describes Soviet collapse, not Western victory through arms. (B) is wrong — this was about peaceful reform, not military defeat. (C) is wrong — economic competition was a background cause; Gorbachev's choice not to use force was decisive.",
          correctChoiceId: "", orderIndex: 17,
          choices: { create: [
            { text: "American military strength and the Reagan defense buildup forcing the Soviet Union into economic collapse", isCorrect: false, orderIndex: 0 },
            { text: "Soviet military defeat in Afghanistan leading directly to the collapse of communist governments in Eastern Europe", isCorrect: false, orderIndex: 1 },
            { text: "Economic competition with the capitalist West proving communism's inability to produce consumer goods", isCorrect: false, orderIndex: 2 },
            { text: "Gorbachev's reform policies and decision not to use force, enabling peaceful democratic revolutions in Eastern Europe", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The data above most directly supports which of the following conclusions about the Cold War arms race?",
          passage: "[GRAPH DESCRIPTION] A graph shows U.S. and Soviet military spending as a percentage of GDP, 1950–1990. The U.S. line peaks at 15% of GDP in 1952 (Korean War), fluctuates between 5–9% through the 1960s–70s, rises to 6.5% in 1986 (Reagan buildup), then declines. The Soviet line consistently runs at 15–20% of GDP throughout 1960–1985, then drops sharply after 1985.",
          explanation: "Correct: (C) The data shows the USSR spending 15–20% of GDP on defense — a crushing burden for a smaller economy — throughout the Cold War, while the U.S. spent 5–9%. This structural strain is cited as a key cause of Soviet economic weakness and eventual collapse. (A) is wrong — Soviet spending was consistently higher as a share of GDP. (B) is wrong — Reagan's buildup reached 6.5%, still far below Soviet levels. (D) is wrong — the data shows Soviet spending didn't decline until after 1985.",
          correctChoiceId: "", orderIndex: 18,
          choices: { create: [
            { text: "The United States and Soviet Union maintained roughly equal defense spending as a share of GDP throughout the Cold War", isCorrect: false, orderIndex: 0 },
            { text: "Reagan's military buildup caused the United States to spend as much as the Soviet Union proportionally", isCorrect: false, orderIndex: 1 },
            { text: "The Soviet Union's consistently high defense burden — 15–20% of GDP — placed unsustainable strain on its economy", isCorrect: true, orderIndex: 2 },
            { text: "Soviet military spending declined throughout the 1970s due to détente agreements limiting the arms race", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above most directly reflects which of the following aspects of the Vietnam War's impact on American society?",
          passage: "\"We are told we must support our boys overseas. I did support them — I marched against the war that was killing them. I was spat upon, called a traitor. The government told us we were winning; the body bags told us something different. My brother came back from Da Nang and wouldn't speak about what he saw. We broke faith with an entire generation — those we sent and those we asked to protest.\" — American anti-war protester, late 1960s",
          explanation: "Correct: (A) The passage captures the deep social fractures of the Vietnam era — the 'credibility gap,' the trauma of veterans, the persecution of protesters, and the generational division the war created. (B) is wrong — the passage is about domestic division, not diplomatic failure. (C) is wrong — this is about Vietnam specifically. (D) is wrong — the passage describes social division, not student movement tactics.",
          correctChoiceId: "", orderIndex: 19,
          choices: { create: [
            { text: "How the Vietnam War created deep social divisions, eroded trust in government, and traumatized both veterans and protesters", isCorrect: true, orderIndex: 0 },
            { text: "How American diplomatic failures in Southeast Asia prevented a negotiated peace in Vietnam", isCorrect: false, orderIndex: 1 },
            { text: "How the Korean War precedent shaped American military strategy in Vietnam", isCorrect: false, orderIndex: 2 },
            { text: "How the student anti-war movement's tactics alienated mainstream American public opinion from the peace cause", isCorrect: false, orderIndex: 3 },
          ]},
        },
      ]},
    },
    include: { questions: { include: { choices: true } } },
  })
  await fixCorrectChoices(quiz3)
  console.log("✓ Created quiz:", quiz3.title, `(${quiz3.questions.length} questions)`)

  // ── Quiz Bank 4: AP World History – Ancient Civilizations & Classical Empires ───
  const quiz4 = await prisma.questionBank.create({
    data: {
      title: "AP World History – Ancient Civilizations & Classical Empires",
      subject: "AP World History",
      description: "Stimulus-based questions on river valley civilizations, classical empires (Rome, Han, Maurya, Persian), trade networks, and the spread of world religions.",
      isPublic: true, ownerId: admin.id,
      questions: { create: [

        // ── STIMULUS A: Map of River Valley Civilizations (Qs 1-3) ──
        {
          prompt: "The map above most directly supports which of the following conclusions about early river valley civilizations?",
          passage: "[MAP DESCRIPTION] A world map circa 3000 BCE marks four river-valley civilizations: Mesopotamia (Tigris-Euphrates, labeled 'Sumer/Babylon'), Egypt (Nile delta), Indus Valley (Harappa/Mohenjo-daro), and Yellow River China (Shang). All four sites are highlighted with fertile floodplain shading. The surrounding areas are shown as desert, steppe, or mountains.",
          explanation: "Correct: (B) All four early civilizations emerged in river valleys where annual flooding deposited rich silt. The geography — not just culture — made agriculture, surplus food, and complex society possible. (A) is wrong — the civilizations were geographically isolated from one another in this period. (C) is wrong — river flooding was a benefit, not a disaster. (D) is wrong — all four relied on agriculture, not trade as their primary base.",
          correctChoiceId: "", orderIndex: 0,
          choices: { create: [
            { text: "Early civilizations arose in river valleys because rivers enabled military conquest of surrounding peoples", isCorrect: false, orderIndex: 0 },
            { text: "Fertile river floodplains enabled agricultural surpluses that supported the development of complex urban societies", isCorrect: true, orderIndex: 1 },
            { text: "River flooding was the primary obstacle that early civilizations had to overcome to survive", isCorrect: false, orderIndex: 2 },
            { text: "Early civilizations depended on long-distance trade along rivers rather than agriculture", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Which of the following best explains why the civilizations shown on the map above developed systems of writing independently of one another?",
          passage: "[MAP DESCRIPTION] A world map circa 3000 BCE marks four river-valley civilizations: Mesopotamia (Tigris-Euphrates, labeled 'Sumer/Babylon'), Egypt (Nile delta), Indus Valley (Harappa/Mohenjo-daro), and Yellow River China (Shang). All four sites are highlighted with fertile floodplain shading. The surrounding areas are shown as desert, steppe, or mountains.",
          explanation: "Correct: (A) Complex societies require recordkeeping — to track agricultural surpluses, tax collection, trade transactions, and religious obligations. Each civilization independently developed writing to manage these administrative needs. (B) is wrong — there is no evidence the civilizations were in contact with one another at this point. (C) is wrong — writing systems were created by specialists (scribes), not ordinary farmers. (D) is wrong — writing was a product of, not a cause of, social complexity.",
          correctChoiceId: "", orderIndex: 1,
          choices: { create: [
            { text: "The administrative demands of managing agricultural surpluses, taxation, and trade created the need for written recordkeeping", isCorrect: true, orderIndex: 0 },
            { text: "Writing spread from Mesopotamia to the other civilizations through early long-distance trade networks", isCorrect: false, orderIndex: 1 },
            { text: "Farmers in river valleys invented writing to record crop-planting schedules and weather patterns", isCorrect: false, orderIndex: 2 },
            { text: "Writing was developed primarily to create religious texts recording the beliefs of early civilizations", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "A historian studying the map above would most likely argue that the geographic features shown explain which of the following patterns?",
          passage: "[MAP DESCRIPTION] A world map circa 3000 BCE marks four river-valley civilizations: Mesopotamia (Tigris-Euphrates, labeled 'Sumer/Babylon'), Egypt (Nile delta), Indus Valley (Harappa/Mohenjo-daro), and Yellow River China (Shang). All four sites are highlighted with fertile floodplain shading. The surrounding areas are shown as desert, steppe, or mountains.",
          explanation: "Correct: (D) The civilizations are surrounded by deserts, mountains, and steppes — natural barriers that limited contact and allowed each to develop independently. This geographic isolation explains their separate development of writing, religion, and political structures. (A) is wrong — isolation limited, not promoted, trade. (B) is wrong — there is no evidence of early warfare between these distant civilizations. (C) is wrong — the map shows fertile river valleys, not resource scarcity.",
          correctChoiceId: "", orderIndex: 2,
          choices: { create: [
            { text: "Why long-distance trade networks connected all four civilizations by 2500 BCE", isCorrect: false, orderIndex: 0 },
            { text: "Why these civilizations frequently waged war against one another for agricultural land", isCorrect: false, orderIndex: 1 },
            { text: "Why all four civilizations collapsed simultaneously due to resource depletion", isCorrect: false, orderIndex: 2 },
            { text: "Why early civilizations developed independently, producing diverse cultures, religions, and writing systems", isCorrect: true, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS B: Code of Hammurabi (Qs 4-6) ──
        {
          prompt: "The law code excerpted above most directly reflects which of the following features of early Mesopotamian society?",
          passage: "\"If a man destroys the eye of another man, they shall destroy his eye... If a builder has built a house for a man and his work is not strong, and if the house he has built falls in and kills the householder, that builder shall be slain. If a slave says to his master 'You are not my master,' his master shall cut off his ear. If a man strikes his father, his hands shall be cut off.\"\n— Code of Hammurabi, c. 1754 BCE (selected laws)",
          explanation: "Correct: (C) The Code of Hammurabi — one of the earliest written legal codes — reflects a hierarchical society with slaves, free commoners, and nobles, in which punishments varied by social class. It established the principle of codified law as a tool of social order. (A) is wrong — the code reinforces hierarchy and class difference. (B) is wrong — the code uses harsh physical punishments. (D) is wrong — the code explicitly upholds slavery.",
          correctChoiceId: "", orderIndex: 3,
          choices: { create: [
            { text: "A society in which all people were treated equally under the law regardless of social rank", isCorrect: false, orderIndex: 0 },
            { text: "A legal system that avoided physical punishment in favor of fines and restitution", isCorrect: false, orderIndex: 1 },
            { text: "A hierarchical society in which written law codified social order, including the institution of slavery", isCorrect: true, orderIndex: 2 },
            { text: "A legal tradition that granted slaves the right to purchase their freedom through labor", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The law code above is historically significant primarily because it illustrates which of the following developments?",
          passage: "\"If a man destroys the eye of another man, they shall destroy his eye... If a builder has built a house for a man and his work is not strong, and if the house he has built falls in and kills the householder, that builder shall be slain. If a slave says to his master 'You are not my master,' his master shall cut off his ear. If a man strikes his father, his hands shall be cut off.\"\n— Code of Hammurabi, c. 1754 BCE (selected laws)",
          explanation: "Correct: (A) Written law codes are a marker of state development — they allowed a centralized authority to define, enforce, and publicize standards of behavior across a large territory, replacing clan-based customary law. (B) is wrong — the code is specific to Mesopotamia, not universal. (C) is wrong — the code reinforces existing hierarchy, not democratic rights. (D) is wrong — Hammurabi was a ruler who consolidated power, not a philosopher.",
          correctChoiceId: "", orderIndex: 4,
          choices: { create: [
            { text: "How early states used written legal codes to standardize governance and enforce social hierarchy across large territories", isCorrect: true, orderIndex: 0 },
            { text: "The universal adoption of written law codes across all early civilizations simultaneously", isCorrect: false, orderIndex: 1 },
            { text: "How early legal codes protected individual rights against government overreach", isCorrect: false, orderIndex: 2 },
            { text: "The philosophical tradition of natural law that began with Babylonian civilization", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "A critic of Hammurabi's Code might most logically argue which of the following based on the excerpt above?",
          passage: "\"If a man destroys the eye of another man, they shall destroy his eye... If a builder has built a house for a man and his work is not strong, and if the house he has built falls in and kills the householder, that builder shall be slain. If a slave says to his master 'You are not my master,' his master shall cut off his ear. If a man strikes his father, his hands shall be cut off.\"\n— Code of Hammurabi, c. 1754 BCE (selected laws)",
          explanation: "Correct: (B) While the Code establishes retributive (eye-for-an-eye) justice, it also mandates death for a builder whose work causes a client's death — applying professional accountability — and amputates the ear of a slave who claims freedom. A modern critic would note the code enforces brutal punishments while legitimizing slavery. (A) is wrong — the code does apply consistently within class categories. (C) is wrong — the code was public (carved on a stele). (D) is wrong — the code includes property law, family law, and criminal law.",
          correctChoiceId: "", orderIndex: 5,
          choices: { create: [
            { text: "The code was inconsistently applied, making it an ineffective legal system", isCorrect: false, orderIndex: 0 },
            { text: "While establishing consistent rules, the code normalized extreme punishments and the institution of slavery", isCorrect: true, orderIndex: 1 },
            { text: "The code was kept secret, making it impossible for ordinary people to know the law", isCorrect: false, orderIndex: 2 },
            { text: "The code only addressed criminal law and ignored civil disputes between citizens", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS C: Silk Road Trade Network (Qs 7-9) ──
        {
          prompt: "The map above most directly supports which of the following conclusions about the Silk Road?",
          passage: "[MAP DESCRIPTION] A map of Eurasia, c. 100 CE, shows the Silk Road as a network of overland and maritime routes. Overland routes run from Chang'an (China) through Central Asia, Persia, and Mesopotamia to the Mediterranean. Maritime routes run from southern China around India to the Persian Gulf and Red Sea. Cities along the routes are labeled: Samarkand, Kashgar, Ctesiphon, Alexandria. Arrows show the direction of silk, spices, glass, and gold.",
          explanation: "Correct: (C) The Silk Road was not a single road but a network of overland and maritime routes connecting East Asia, South Asia, Central Asia, the Middle East, and the Mediterranean — enabling the exchange of goods, ideas, and diseases across thousands of miles. (A) is wrong — China did not politically control the entire route. (B) is wrong — silk moved East to West; other goods moved the other direction. (D) is wrong — many intermediary merchants (Sogdians, Arabs) profited from the trade.",
          correctChoiceId: "", orderIndex: 6,
          choices: { create: [
            { text: "The Silk Road was controlled entirely by the Han Chinese Empire, which taxed all goods passing through Central Asia", isCorrect: false, orderIndex: 0 },
            { text: "Goods only flowed from West to East, with Rome exporting manufactured products to China", isCorrect: false, orderIndex: 1 },
            { text: "The Silk Road was an interconnected network of land and sea routes that facilitated exchange across Eurasia", isCorrect: true, orderIndex: 2 },
            { text: "The Silk Road was exclusively used by Roman merchants seeking direct access to Chinese silk", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "In addition to luxury goods, which of the following was most significantly transmitted along the routes shown on the map above?",
          passage: "[MAP DESCRIPTION] A map of Eurasia, c. 100 CE, shows the Silk Road as a network of overland and maritime routes. Overland routes run from Chang'an (China) through Central Asia, Persia, and Mesopotamia to the Mediterranean. Maritime routes run from southern China around India to the Persian Gulf and Red Sea. Cities along the routes are labeled: Samarkand, Kashgar, Ctesiphon, Alexandria. Arrows show the direction of silk, spices, glass, and gold.",
          explanation: "Correct: (D) The Silk Road transmitted Buddhism, Islam, and Christianity along with goods. Buddhism spread from India to Central Asia and China via the overland routes. Disease (including the Bubonic Plague) also spread along the same corridors. (A) is wrong — democracy was a Greek concept that did not spread widely via the Silk Road. (B) is wrong — printing technology developed in China but spread much later. (C) is wrong — iron smelting developed in multiple regions independently before the Silk Road period.",
          correctChoiceId: "", orderIndex: 7,
          choices: { create: [
            { text: "Democratic political ideas from Athens to the Han Dynasty", isCorrect: false, orderIndex: 0 },
            { text: "Printing technology from Rome to China that transformed literacy", isCorrect: false, orderIndex: 1 },
            { text: "Iron-smelting technology from Persia to East Asia", isCorrect: false, orderIndex: 2 },
            { text: "Religious traditions, artistic styles, and diseases that spread alongside commercial exchange", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The trade network shown on the map best illustrates which of the following characteristics of classical-era empires?",
          passage: "[MAP DESCRIPTION] A map of Eurasia, c. 100 CE, shows the Silk Road as a network of overland and maritime routes. Overland routes run from Chang'an (China) through Central Asia, Persia, and Mesopotamia to the Mediterranean. Maritime routes run from southern China around India to the Persian Gulf and Red Sea. Cities along the routes are labeled: Samarkand, Kashgar, Ctesiphon, Alexandria. Arrows show the direction of silk, spices, glass, and gold.",
          explanation: "Correct: (A) The Silk Road flourished under the Pax Romana and Han peace because large stable empires provided security for merchants crossing vast territories. When empires fragmented, trade disrupted. (B) is wrong — the map shows complementary, not competitive, trade. (C) is wrong — states profited from taxing trade, but didn't control it all. (D) is wrong — the maritime routes show sea-borne trade was equally important.",
          correctChoiceId: "", orderIndex: 8,
          choices: { create: [
            { text: "How political stability under large empires enabled long-distance commerce across Eurasia", isCorrect: true, orderIndex: 0 },
            { text: "How imperial powers competed militarily to monopolize Silk Road trade profits", isCorrect: false, orderIndex: 1 },
            { text: "How states controlled all aspects of long-distance trade through state-owned merchant fleets", isCorrect: false, orderIndex: 2 },
            { text: "How overland routes were always more important than maritime trade in the classical period", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS D: Roman Colosseum Image (Qs 10-12) ──
        {
          prompt: "The structure above most directly reflects which of the following aspects of Roman civilization?",
          passage: "[IMAGE DESCRIPTION] A photograph of the Roman Colosseum (Flavian Amphitheatre) in Rome, c. 80 CE. The four-story elliptical structure of travertine stone and concrete shows arched galleries on each level. The image shows the interior floor removed, revealing the hypogeum (underground tunnels) below. The structure seated approximately 50,000–80,000 spectators.",
          explanation: "Correct: (B) The Colosseum demonstrates Roman engineering mastery — concrete (opus caementicium), arched construction, and innovative drainage — as well as Roman political culture, in which emperors used public spectacles to maintain popular support (panem et circenses — 'bread and circuses'). (A) is wrong — gladiatorial combat was entertainment, not religious worship. (C) is wrong — the Colosseum was built, not 'collapsed' from decline. (D) is wrong — the Colosseum reflects urban, not military, infrastructure.",
          correctChoiceId: "", orderIndex: 9,
          choices: { create: [
            { text: "The religious practices of Roman citizens who used the Colosseum for temple worship", isCorrect: false, orderIndex: 0 },
            { text: "Roman engineering sophistication and the political use of mass entertainment to maintain public loyalty", isCorrect: true, orderIndex: 1 },
            { text: "Roman military decline that forced emperors to divert resources from defense to entertainment", isCorrect: false, orderIndex: 2 },
            { text: "Roman military infrastructure used to train legions for imperial expansion", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "A historian would most likely use the structure above as evidence to support which of the following arguments about the Roman Empire?",
          passage: "[IMAGE DESCRIPTION] A photograph of the Roman Colosseum (Flavian Amphitheatre) in Rome, c. 80 CE. The four-story elliptical structure of travertine stone and concrete shows arched galleries on each level. The image shows the interior floor removed, revealing the hypogeum (underground tunnels) below. The structure seated approximately 50,000–80,000 spectators.",
          explanation: "Correct: (C) The Colosseum's seating was stratified by social class — senators in the bottom tier, equestrians above, commoners higher, and women and slaves at the top — reflecting and reinforcing Roman social hierarchy even in entertainment. (A) is wrong — the Colosseum was built c. 80 CE, during the Empire's height. (B) is wrong — the Colosseum used slave and paid free labor. (D) is wrong — the Colosseum is in Rome, not on a frontier.",
          correctChoiceId: "", orderIndex: 10,
          choices: { create: [
            { text: "That the Roman Empire was already in economic decline when the Colosseum was built", isCorrect: false, orderIndex: 0 },
            { text: "That Roman construction relied exclusively on the free labor of Roman citizens", isCorrect: false, orderIndex: 1 },
            { text: "That Roman social hierarchy was reinforced even in public spaces, with seating reflecting one's class position", isCorrect: true, orderIndex: 2 },
            { text: "That Roman architecture was primarily designed to serve military rather than civic purposes", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The structure above best illustrates which of the following continuities between the Roman Empire and later Western civilization?",
          passage: "[IMAGE DESCRIPTION] A photograph of the Roman Colosseum (Flavian Amphitheatre) in Rome, c. 80 CE. The four-story elliptical structure of travertine stone and concrete shows arched galleries on each level. The image shows the interior floor removed, revealing the hypogeum (underground tunnels) below. The structure seated approximately 50,000–80,000 spectators.",
          explanation: "Correct: (D) Roman architectural innovations — the arch, concrete, the oval stadium form — were rediscovered and adapted during the Renaissance and remain foundational to modern architecture. Modern sports stadiums replicate the Colosseum's basic form. (A) is wrong — gladiatorial combat did not continue. (B) is wrong — Christianity ended, not continued, Roman religious practices. (C) is wrong — the Western Roman Empire collapsed in 476 CE.",
          correctChoiceId: "", orderIndex: 11,
          choices: { create: [
            { text: "Gladiatorial combat as a form of public entertainment that persisted through the medieval period", isCorrect: false, orderIndex: 0 },
            { text: "Roman polytheism that was adopted and preserved by Christian civilization in Europe", isCorrect: false, orderIndex: 1 },
            { text: "Roman imperial political structures that continued uninterrupted in Western Europe after 476 CE", isCorrect: false, orderIndex: 2 },
            { text: "Roman architectural and engineering innovations that were later adapted by Renaissance and modern builders", isCorrect: true, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS E: Comparison of Classical Empires (Qs 13-15) ──
        {
          prompt: "Which of the following conclusions is best supported by the comparison table above?",
          passage: "[TABLE: Comparison of Classical Empires, c. 200 BCE–200 CE]\n| Feature             | Han China           | Roman Empire        | Maurya Empire (India) |\n|---------------------|---------------------|---------------------|----------------------|\n| Population (est.)   | 60 million          | 55 million          | 50 million           |\n| Government          | Centralized bureaucracy | Senate/Emperor | Centralized monarchy |\n| Official religion   | Confucianism (state) | Polytheism/later Christianity | Buddhism (state) |\n| Key infrastructure  | Grand Canal, walls  | Roads, aqueducts    | Royal roads, stupas  |\n| Decline factor      | Peasant revolts, nomads | Overextension, migration | Fragmentation after Ashoka |",
          explanation: "Correct: (A) The table shows that all three classical empires shared comparable populations, centralized governments, state-supported religions, and major infrastructure investment — evidence of parallel state-building processes in widely separated regions. (B) is wrong — all three empires used centralized, not democratic, structures. (C) is wrong — the table shows different religions in each empire. (D) is wrong — the decline factors are different for each empire.",
          correctChoiceId: "", orderIndex: 12,
          choices: { create: [
            { text: "All three classical empires developed comparable features — large populations, centralized governments, state religions, and infrastructure — despite having no direct contact", isCorrect: true, orderIndex: 0 },
            { text: "Classical empires uniformly adopted democratic political structures to manage large populations", isCorrect: false, orderIndex: 1 },
            { text: "All three classical empires shared the same official religion, enabling cultural exchange", isCorrect: false, orderIndex: 2 },
            { text: "All three classical empires collapsed for identical reasons, suggesting a common pattern of imperial decline", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The table above most directly supports which of the following arguments about the relationship between religion and classical empires?",
          passage: "[TABLE: Comparison of Classical Empires, c. 200 BCE–200 CE]\n| Feature             | Han China           | Roman Empire        | Maurya Empire (India) |\n|---------------------|---------------------|---------------------|----------------------|\n| Population (est.)   | 60 million          | 55 million          | 50 million           |\n| Government          | Centralized bureaucracy | Senate/Emperor | Centralized monarchy |\n| Official religion   | Confucianism (state) | Polytheism/later Christianity | Buddhism (state) |\n| Key infrastructure  | Grand Canal, walls  | Roads, aqueducts    | Royal roads, stupas  |\n| Decline factor      | Peasant revolts, nomads | Overextension, migration | Fragmentation after Ashoka |",
          explanation: "Correct: (B) All three empires used officially sponsored religion — Confucianism, Roman polytheism/Christianity, Buddhism — as a tool of political legitimacy and social control. Ashoka's promotion of Buddhism and the Roman emperors' use of religion both illustrate this pattern. (A) is wrong — religion was promoted by governments, not kept separate. (C) is wrong — state-sponsored religions served political purposes but also spread organically. (D) is wrong — Buddhism spread beyond the Maurya Empire through missionary activity.",
          correctChoiceId: "", orderIndex: 13,
          choices: { create: [
            { text: "Classical empires maintained strict separation between religious institutions and state power", isCorrect: false, orderIndex: 0 },
            { text: "Classical empires used officially sponsored religious traditions to legitimize rule and promote social cohesion", isCorrect: true, orderIndex: 1 },
            { text: "Religion in classical empires was entirely a private matter with no political dimensions", isCorrect: false, orderIndex: 2 },
            { text: "Buddhism spread beyond India because the Maurya Empire forcibly converted neighboring peoples", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "A historian studying the decline factors listed in the table above would most likely argue which of the following?",
          passage: "[TABLE: Comparison of Classical Empires, c. 200 BCE–200 CE]\n| Feature             | Han China           | Roman Empire        | Maurya Empire (India) |\n|---------------------|---------------------|---------------------|----------------------|\n| Population (est.)   | 60 million          | 55 million          | 50 million           |\n| Government          | Centralized bureaucracy | Senate/Emperor | Centralized monarchy |\n| Official religion   | Confucianism (state) | Polytheism/later Christianity | Buddhism (state) |\n| Key infrastructure  | Grand Canal, walls  | Royal roads, aqueducts    | Royal roads, stupas  |\n| Decline factor      | Peasant revolts, nomads | Overextension, migration | Fragmentation after Ashoka |",
          explanation: "Correct: (D) While the specific triggers differ (nomads for China, overextension for Rome, fragmentation for Maurya), all three empires declined due to the structural difficulty of maintaining centralized control over vast, diverse populations. This is a common pattern in large pre-modern empires. (A) is wrong — different factors caused each collapse. (B) is wrong — economic collapse was a factor in Rome but not the primary one listed for all three. (C) is wrong — religion is not listed as a primary decline factor.",
          correctChoiceId: "", orderIndex: 14,
          choices: { create: [
            { text: "All three empires collapsed for the same reason: foreign military invasion overwhelmed their defenses", isCorrect: false, orderIndex: 0 },
            { text: "Economic collapse caused by overtrading was the primary factor in the decline of all three empires", isCorrect: false, orderIndex: 1 },
            { text: "The adoption of new religions destabilized all three classical empires from within", isCorrect: false, orderIndex: 2 },
            { text: "Despite different specific triggers, all three empires faced the common challenge of maintaining centralized control over vast diverse territories", isCorrect: true, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS F: Spread of World Religions (Qs 16-18) ──
        {
          prompt: "The map above best supports which of the following conclusions about the spread of Buddhism?",
          passage: "[MAP DESCRIPTION] A map of Asia, c. 500 CE, showing the spread of Buddhism from its origin in northern India (marked with a dot at Lumbini/Bodh Gaya). Arrows radiate outward: one arrow runs northwest along the Silk Road through Central Asia to China and Korea; another runs south to Sri Lanka; a third runs east to Southeast Asia by sea. Shaded zones show regions with Buddhist majorities. The map notes that Buddhism largely declined in India itself by 1200 CE.",
          explanation: "Correct: (C) Buddhism spread along trade routes — the Silk Road carried it to China, while maritime trade spread it to Southeast Asia. Missionaries (monks) traveled with merchants. Meanwhile Buddhism declined in its homeland as Hinduism reasserted itself and Islam arrived. (A) is wrong — Buddhism spread through persuasion and trade, not military conquest. (B) is wrong — Buddhism spread widely but did not become universal. (D) is wrong — Buddhism declined in India by 1200 CE.",
          correctChoiceId: "", orderIndex: 15,
          choices: { create: [
            { text: "Buddhism spread primarily through military conquest by Buddhist empires in Asia", isCorrect: false, orderIndex: 0 },
            { text: "Buddhism became the universal religion of Asia by 500 CE, replacing all prior traditions", isCorrect: false, orderIndex: 1 },
            { text: "Buddhism spread along trade routes and through missionary activity while paradoxically declining in its Indian homeland", isCorrect: true, orderIndex: 2 },
            { text: "Buddhism remained strongest in India and spread only marginally to surrounding regions", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The pattern shown on the map above most directly illustrates which of the following broader historical processes?",
          passage: "[MAP DESCRIPTION] A map of Asia, c. 500 CE, showing the spread of Buddhism from its origin in northern India (marked with a dot at Lumbini/Bodh Gaya). Arrows radiate outward: one arrow runs northwest along the Silk Road through Central Asia to China and Korea; another runs south to Sri Lanka; a third runs east to Southeast Asia by sea. Shaded zones show regions with Buddhist majorities. The map notes that Buddhism largely declined in India itself by 1200 CE.",
          explanation: "Correct: (A) The spread of Buddhism mirrors that of Christianity (from Palestine along Roman roads) and later Islam (from Arabia along trade routes) — religions often 'rode' existing trade and communication networks to reach distant populations. (B) is wrong — Buddhist missionaries actively sought converts in new regions. (C) is wrong — the map shows expansion, not suppression. (D) is wrong — Buddhism adapted to local cultures (Zen Buddhism in Japan, Theravada in Southeast Asia) rather than remaining identical.",
          correctChoiceId: "", orderIndex: 16,
          choices: { create: [
            { text: "How trade networks served as vectors for the spread of religious and cultural ideas across large distances", isCorrect: true, orderIndex: 0 },
            { text: "How Buddhist missionaries refused to travel beyond South Asia to preserve doctrinal purity", isCorrect: false, orderIndex: 1 },
            { text: "How political authorities in China suppressed Buddhism, preventing its spread to East Asia", isCorrect: false, orderIndex: 2 },
            { text: "How Buddhism remained doctrinally identical across all regions where it spread", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The decline of Buddhism in India noted on the map above is best explained by which of the following?",
          passage: "[MAP DESCRIPTION] A map of Asia, c. 500 CE, showing the spread of Buddhism from its origin in northern India (marked with a dot at Lumbini/Bodh Gaya). Arrows radiate outward: one arrow runs northwest along the Silk Road through Central Asia to China and Korea; another runs south to Sri Lanka; a third runs east to Southeast Asia by sea. Shaded zones show regions with Buddhist majorities. The map notes that Buddhism largely declined in India itself by 1200 CE.",
          explanation: "Correct: (B) Buddhism's decline in India resulted from multiple factors: the revival of Hindu devotional movements (bhakti) that absorbed Buddhist ideas, the destruction of Buddhist monasteries and universities (Nalanda) by Muslim Turkic invaders in the 12th century, and the loss of royal patronage. (A) is wrong — Buddhist ideas were absorbed into Hinduism rather than violently suppressed initially. (C) is wrong — Buddhism continued to grow in East and Southeast Asia while declining in India. (D) is wrong — Buddhist monasteries were economically important, not isolated.",
          correctChoiceId: "", orderIndex: 17,
          choices: { create: [
            { text: "Buddhist leaders chose to relocate to China because of better opportunities for conversion", isCorrect: false, orderIndex: 0 },
            { text: "The revival of Hindu traditions and the destruction of Buddhist institutions by Muslim invaders contributed to Buddhism's decline in India", isCorrect: true, orderIndex: 1 },
            { text: "Buddhism's global popularity made Indian practitioners abandon it in favor of more exclusive local traditions", isCorrect: false, orderIndex: 2 },
            { text: "Buddhist monasteries in India became economically isolated and ceased to attract followers", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS G: Confucius Quotation (Qs 19-20) ──
        {
          prompt: "The passage above most directly reflects which of the following aspects of Confucian philosophy?",
          passage: "\"When you know a thing, hold that you know it; and when you do not know a thing, allow that you do not know it — this is knowledge... The superior man is catholic and no partisan. The mean man is partisan and not catholic... To govern means to correct. If you lead the people with correctness, who will dare not be correct?\"\n— Confucius, Analects (selected passages, c. 500 BCE)",
          explanation: "Correct: (D) The passages reflect core Confucian ideas: epistemological humility (knowing the limits of one's knowledge), the 'superior man' (junzi) as a moral ideal, and the belief that good governance flows from the ruler's personal virtue rather than law or force. (A) is wrong — Confucius emphasizes moral virtue, not military power. (B) is wrong — Confucius is about correct behavior, not mysticism or nature. (C) is wrong — Confucius emphasizes hierarchy and learning, not equality.",
          correctChoiceId: "", orderIndex: 18,
          choices: { create: [
            { text: "The importance of military discipline and conquest in building a well-ordered state", isCorrect: false, orderIndex: 0 },
            { text: "The Daoist belief that rulers should align themselves with nature rather than imposing human rules", isCorrect: false, orderIndex: 1 },
            { text: "The Legalist argument that strict laws and punishments are the only way to maintain social order", isCorrect: false, orderIndex: 2 },
            { text: "The role of personal virtue, moral self-cultivation, and ethical leadership in creating a well-ordered society", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above most directly explains why Confucianism became the official ideology of which of the following?",
          passage: "\"When you know a thing, hold that you know it; and when you do not know a thing, allow that you do not know it — this is knowledge... The superior man is catholic and no partisan. The mean man is partisan and not catholic... To govern means to correct. If you lead the people with correctness, who will dare not be correct?\"\n— Confucius, Analects (selected passages, c. 500 BCE)",
          explanation: "Correct: (A) The Han Dynasty adopted Confucianism as its official state ideology because it legitimized a hierarchical bureaucratic state: the emperor ruled by virtue, officials were selected for moral knowledge through examinations, and society was organized around proper relationships (ruler-subject, parent-child). This system persisted through multiple Chinese dynasties until 1905. (B) is wrong — the Qin Dynasty used Legalism. (C) is wrong — Confucianism was Chinese, not Roman. (D) is wrong — Confucianism was not the basis of Mauryan governance.",
          correctChoiceId: "", orderIndex: 19,
          choices: { create: [
            { text: "The Han Dynasty's civil service examination system, which selected officials based on Confucian learning", isCorrect: true, orderIndex: 0 },
            { text: "The Qin Dynasty's Legalist system of harsh laws and centralized control", isCorrect: false, orderIndex: 1 },
            { text: "The Roman imperial cult that used philosophical teachings to legitimize emperor worship", isCorrect: false, orderIndex: 2 },
            { text: "The Maurya Dynasty's Buddhist administration under Emperor Ashoka", isCorrect: false, orderIndex: 3 },
          ]},
        },

      ]},
    },
    include: { questions: { include: { choices: true } } },
  })
  await fixCorrectChoices(quiz4)
  console.log("✓ Created quiz:", quiz4.title, `(${quiz4.questions.length} questions)`)

  // ── Quiz Bank 5: AP US History – Civil War & Reconstruction ───
  const quiz5 = await prisma.questionBank.create({
    data: {
      title: "AP US History – Civil War & Reconstruction",
      subject: "AP US History",
      description: "Stimulus-based questions covering the causes of the Civil War, emancipation, military turning points, Reconstruction amendments, and the retreat from Reconstruction.",
      isPublic: true, ownerId: admin.id,
      questions: { create: [

        // ── STIMULUS A: Lincoln-Douglas Debate Excerpt (Qs 1-3) ──
        {
          prompt: "The excerpt above most directly reflects which of the following political debates of the 1850s?",
          passage: "\"A house divided against itself cannot stand. I believe this government cannot endure, permanently, half slave and half free. I do not expect the Union to be dissolved — I do not expect the house to fall — but I do expect it will cease to be divided. It will become all one thing, or all the other.\"\n— Abraham Lincoln, Republican nomination acceptance speech, Springfield, Illinois, June 16, 1858",
          explanation: "Correct: (B) Lincoln's 'House Divided' speech argued that the nation could not permanently survive with slavery in some states and freedom in others — it must eventually resolve the contradiction one way or the other. This was the central tension of the 1850s. (A) is wrong — Lincoln was not calling for immediate abolition at this point. (C) is wrong — Lincoln explicitly said the Union would NOT dissolve. (D) is wrong — this speech was about the slavery debate, not westward expansion per se.",
          correctChoiceId: "", orderIndex: 0,
          choices: { create: [
            { text: "Lincoln's demand for the immediate and complete abolition of slavery in all states", isCorrect: false, orderIndex: 0 },
            { text: "The unsustainable contradiction between slavery and freedom that was driving the nation toward crisis", isCorrect: true, orderIndex: 1 },
            { text: "Lincoln's belief that Southern secession was inevitable and should be allowed peacefully", isCorrect: false, orderIndex: 2 },
            { text: "Debates over whether slavery should be permitted in newly acquired western territories", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Lincoln's argument in the passage above was most directly a response to which of the following earlier developments?",
          passage: "\"A house divided against itself cannot stand. I believe this government cannot endure, permanently, half slave and half free. I do not expect the Union to be dissolved — I do not expect the house to fall — but I do expect it will cease to be divided. It will become all one thing, or all the other.\"\n— Abraham Lincoln, Republican nomination acceptance speech, Springfield, Illinois, June 16, 1858",
          explanation: "Correct: (C) Lincoln's speech directly responded to the Kansas-Nebraska Act (1854) and the principle of 'popular sovereignty' championed by his opponent Stephen Douglas — the idea that each territory could decide slavery for itself. Lincoln argued this 'compromise' could not hold. (A) is wrong — the Missouri Compromise was 1820; Lincoln's speech was in 1858. (B) is wrong — the Dred Scott decision (1857) had just occurred and reinforced Lincoln's concerns, but his speech targets popular sovereignty broadly. (D) is wrong — John Brown's raid (Harpers Ferry) was October 1859, after this speech.",
          correctChoiceId: "", orderIndex: 1,
          choices: { create: [
            { text: "The Missouri Compromise of 1820 that Lincoln believed had permanently settled the slavery question", isCorrect: false, orderIndex: 0 },
            { text: "The Dred Scott decision which Lincoln supported as constitutional", isCorrect: false, orderIndex: 1 },
            { text: "The Kansas-Nebraska Act and popular sovereignty doctrine that Lincoln believed would spread slavery nationwide", isCorrect: true, orderIndex: 2 },
            { text: "John Brown's raid on Harpers Ferry that Lincoln condemned as counterproductive to abolition", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Which of the following outcomes of the Civil War era most directly fulfilled the prediction Lincoln made in the passage above?",
          passage: "\"A house divided against itself cannot stand. I believe this government cannot endure, permanently, half slave and half free. I do not expect the Union to be dissolved — I do not expect the house to fall — but I do expect it will cease to be divided. It will become all one thing, or all the other.\"\n— Abraham Lincoln, Republican nomination acceptance speech, Springfield, Illinois, June 16, 1858",
          explanation: "Correct: (A) Lincoln's prediction that the nation would become 'all one thing' was fulfilled by the 13th Amendment (1865), which abolished slavery in all states, making the country uniformly free. The house became 'all one thing.' (B) is wrong — the secession crisis proved Lincoln wrong in the short term, though the Union was preserved. (C) is wrong — the Emancipation Proclamation (1863) was a war measure, not the permanent resolution Lincoln described. (D) is wrong — Reconstruction extended federal authority over the South, not the other way around.",
          correctChoiceId: "", orderIndex: 2,
          choices: { create: [
            { text: "The 13th Amendment's abolition of slavery throughout the entire United States", isCorrect: true, orderIndex: 0 },
            { text: "Southern secession, which proved Lincoln correct that the Union could not survive half-slave and half-free", isCorrect: false, orderIndex: 1 },
            { text: "The Emancipation Proclamation, which permanently resolved the slavery question in all states", isCorrect: false, orderIndex: 2 },
            { text: "Southern states gaining sovereignty over their own labor laws during Reconstruction", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS B: Casualty Data / Battle of Antietam Chart (Qs 4-6) ──
        {
          prompt: "The data above most directly supports which of the following conclusions about the Civil War?",
          passage: "[TABLE: Selected Civil War Battles — Casualties]\n| Battle             | Date      | Union Casualties | Confederate Casualties | Military Significance          |\n|--------------------|-----------|-----------------|----------------------|--------------------------------|\n| First Bull Run     | July 1861 | 2,896           | 1,982                | Confederate victory; war won't be quick |\n| Antietam           | Sept 1862 | 12,401          | 10,316               | Bloodiest single day; tactical Union draw; Lincoln issues Emancipation Proclamation |\n| Gettysburg         | July 1863 | 23,049          | 28,063               | Union victory; turns tide of the war      |\n| Chancellorsville   | May 1863  | 17,304          | 12,764               | Confederate tactical victory; Lee at peak |\n| Appomattox         | April 1865| 164             | 500                  | Confederate surrender; war ends          |",
          explanation: "Correct: (B) The table shows catastrophic casualties at major battles — 22,000 in a single day at Antietam, over 50,000 at Gettysburg — demonstrating that the Civil War was far deadlier than either side anticipated after First Bull Run. Industrial weapons (rifled muskets, artillery) combined with Napoleonic tactics produced mass casualties. (A) is wrong — the Union suffered significant casualties throughout. (C) is wrong — Confederate losses exceeded Union at Gettysburg. (D) is wrong — the data shows tactical wins on both sides before the final Union victory.",
          correctChoiceId: "", orderIndex: 3,
          choices: { create: [
            { text: "Union forces consistently suffered fewer casualties than Confederate forces throughout the war", isCorrect: false, orderIndex: 0 },
            { text: "The Civil War produced catastrophically high casualties, far exceeding early expectations from both sides", isCorrect: true, orderIndex: 1 },
            { text: "Confederate forces suffered far greater losses than Union forces at every major battle", isCorrect: false, orderIndex: 2 },
            { text: "The Union won every major engagement of the Civil War through superior numbers and strategy", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The data in the table above most directly explains why Lincoln issued the Emancipation Proclamation following which of the listed battles?",
          passage: "[TABLE: Selected Civil War Battles — Casualties]\n| Battle             | Date      | Union Casualties | Confederate Casualties | Military Significance          |\n|--------------------|-----------|-----------------|----------------------|--------------------------------|\n| First Bull Run     | July 1861 | 2,896           | 1,982                | Confederate victory; war won't be quick |\n| Antietam           | Sept 1862 | 12,401          | 10,316               | Bloodiest single day; tactical Union draw; Lincoln issues Emancipation Proclamation |\n| Gettysburg         | July 1863 | 23,049          | 28,063               | Union victory; turns tide of the war      |\n| Chancellorsville   | May 1863  | 17,304          | 12,764               | Confederate tactical victory; Lee at peak |\n| Appomattox         | April 1865| 164             | 500                  | Confederate surrender; war ends          |",
          explanation: "Correct: (C) Lincoln needed to issue the Emancipation Proclamation after a Union 'victory' to avoid appearing desperate. Antietam (Sept 1862) halted Lee's northern invasion — though bloody — and gave Lincoln the military success he needed to announce emancipation from a position of strength rather than weakness. (A) is wrong — First Bull Run was a Union defeat. (B) is wrong — Gettysburg came after the Proclamation (January 1863). (D) is wrong — Chancellorsville was a Confederate victory.",
          correctChoiceId: "", orderIndex: 4,
          choices: { create: [
            { text: "First Bull Run, because the Confederate victory convinced Lincoln that emancipation was militarily necessary", isCorrect: false, orderIndex: 0 },
            { text: "Gettysburg, because the decisive Union victory gave Lincoln the momentum he needed", isCorrect: false, orderIndex: 1 },
            { text: "Antietam, because Lincoln needed to announce emancipation from a position of at least partial military success", isCorrect: true, orderIndex: 2 },
            { text: "Chancellorsville, because Lincoln feared the war was being lost and used emancipation to reverse Union fortunes", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "A historian studying the table above would most likely cite which of the following as a primary cause of the extremely high casualty figures?",
          passage: "[TABLE: Selected Civil War Battles — Casualties]\n| Battle             | Date      | Union Casualties | Confederate Casualties | Military Significance          |\n|--------------------|-----------|-----------------|----------------------|--------------------------------|\n| First Bull Run     | July 1861 | 2,896           | 1,982                | Confederate victory; war won't be quick |\n| Antietam           | Sept 1862 | 12,401          | 10,316               | Bloodiest single day; tactical Union draw; Lincoln issues Emancipation Proclamation |\n| Gettysburg         | July 1863 | 23,049          | 28,063               | Union victory; turns tide of the war      |\n| Chancellorsville   | May 1863  | 17,304          | 12,764               | Confederate tactical victory; Lee at peak |\n| Appomattox         | April 1865| 164             | 500                  | Confederate surrender; war ends          |",
          explanation: "Correct: (D) The Civil War's unprecedented casualties resulted from a lethal mismatch: armies still used Napoleonic offensive tactics (massed frontal assaults) against new industrial weapons (rifled muskets with much greater range and accuracy than smoothbores). Defenders behind fortifications could kill attackers long before they reached the line. (A) is wrong — incompetent generals were a factor but not THE explanation for universal high casualties. (B) is wrong — armies had used cavalry for centuries. (C) is wrong — armies were large but the key factor was weapons technology vs. tactics.",
          correctChoiceId: "", orderIndex: 5,
          choices: { create: [
            { text: "The incompetence of Union and Confederate generals who wasted soldiers in unnecessary frontal assaults", isCorrect: false, orderIndex: 0 },
            { text: "The first use of cavalry charges, which proved catastrophically vulnerable to infantry fire", isCorrect: false, orderIndex: 1 },
            { text: "The unprecedented size of Civil War armies, which made battles inherently more deadly", isCorrect: false, orderIndex: 2 },
            { text: "Industrial weapons technology (rifled muskets, artillery) made old Napoleonic offensive tactics catastrophically deadly", isCorrect: true, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS C: Emancipation Proclamation / 13th Amendment (Qs 7-9) ──
        {
          prompt: "The document above most directly reflects which of the following limitations on executive power during the Civil War?",
          passage: "\"That on the first day of January, in the year of our Lord one thousand eight hundred and sixty-three, all persons held as slaves within any State or designated part of a State, the people whereof shall then be in rebellion against the United States, shall be then, thenceforward, and forever free...\"\n— Emancipation Proclamation, Abraham Lincoln, January 1, 1863",
          explanation: "Correct: (A) The Emancipation Proclamation notably did NOT free slaves in the border states (Missouri, Kentucky, Maryland, Delaware) that had not seceded, nor in Confederate territories already under Union control. Lincoln justified it only as a war measure under his commander-in-chief powers — not as a moral abolition of slavery. (B) is wrong — it freed slaves in Confederate states, not all states. (C) is wrong — Lincoln acted unilaterally; Congress wasn't involved. (D) is wrong — the Proclamation did not address citizenship.",
          correctChoiceId: "", orderIndex: 6,
          choices: { create: [
            { text: "Lincoln justified emancipation as a war measure and limited it to Confederate states, leaving slavery intact in the border states", isCorrect: true, orderIndex: 0 },
            { text: "The Emancipation Proclamation immediately freed all enslaved people in every state of the Union", isCorrect: false, orderIndex: 1 },
            { text: "Congress passed the Proclamation over Lincoln's veto as a radical Republican measure", isCorrect: false, orderIndex: 2 },
            { text: "The Proclamation granted citizenship and voting rights to all formerly enslaved people simultaneously", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above most directly changed the nature of the Civil War by accomplishing which of the following?",
          passage: "\"That on the first day of January, in the year of our Lord one thousand eight hundred and sixty-three, all persons held as slaves within any State or designated part of a State, the people whereof shall then be in rebellion against the United States, shall be then, thenceforward, and forever free...\"\n— Emancipation Proclamation, Abraham Lincoln, January 1, 1863",
          explanation: "Correct: (C) The Proclamation transformed the war's character by making it explicitly a war against slavery, not merely a war to preserve the Union. This discouraged Britain and France — who had abolished slavery — from recognizing the Confederacy, and it authorized Black men to serve in the Union Army (eventually ~180,000 Black soldiers). (A) is wrong — the Proclamation escalated the war's moral stakes, not ended it. (B) is wrong — it weakened Confederate morale but did not cause immediate Confederate collapse. (D) is wrong — the 13th Amendment (1865) permanently abolished slavery; the Proclamation was a war measure.",
          correctChoiceId: "", orderIndex: 7,
          choices: { create: [
            { text: "It ended the war by convincing Confederate states to surrender rather than face slave rebellions", isCorrect: false, orderIndex: 0 },
            { text: "It caused the immediate collapse of Confederate military resistance in the Deep South", isCorrect: false, orderIndex: 1 },
            { text: "It reframed the war as a struggle against slavery, deterring European recognition of the Confederacy and enabling Black military service", isCorrect: true, orderIndex: 2 },
            { text: "It permanently abolished slavery throughout the United States, making additional amendments unnecessary", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Which of the following best explains why the 13th Amendment was necessary following the Emancipation Proclamation?",
          passage: "\"That on the first day of January, in the year of our Lord one thousand eight hundred and sixty-three, all persons held as slaves within any State or designated part of a State, the people whereof shall then be in rebellion against the United States, shall be then, thenceforward, and forever free...\"\n— Emancipation Proclamation, Abraham Lincoln, January 1, 1863",
          explanation: "Correct: (B) The Emancipation Proclamation was issued under Lincoln's war powers as commander-in-chief and applied only to Confederate states. It could potentially be reversed after the war or challenged legally. The 13th Amendment (1865) permanently abolished slavery everywhere in the United States through a constitutional change that could not be undone by a future president. (A) is wrong — the Proclamation did apply to Confederate states. (C) is wrong — Lincoln supported the 13th Amendment. (D) is wrong — the 13th Amendment was ratified before Reconstruction formally began.",
          correctChoiceId: "", orderIndex: 8,
          choices: { create: [
            { text: "The Emancipation Proclamation had failed to free any enslaved people because Confederate states ignored it", isCorrect: false, orderIndex: 0 },
            { text: "The Proclamation was a temporary war measure that could be reversed; a constitutional amendment was needed to permanently abolish slavery nationwide", isCorrect: true, orderIndex: 1 },
            { text: "Lincoln opposed the 13th Amendment and Congress passed it against his wishes", isCorrect: false, orderIndex: 2 },
            { text: "The 13th Amendment was necessary because the Proclamation had not addressed slavery in Northern states", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS D: Reconstruction Amendments & Black Codes (Qs 10-12) ──
        {
          prompt: "The document above most directly reflects which of the following conflicts of the Reconstruction era?",
          passage: "\"Section 1: All persons born or naturalized in the United States... are citizens of the United States and of the State wherein they reside. No State shall make or enforce any law which shall abridge the privileges or immunities of citizens of the United States; nor shall any State deprive any person of life, liberty, or property, without due process of law; nor deny to any person within its jurisdiction the equal protection of the laws.\"\n— 14th Amendment to the U.S. Constitution, 1868",
          explanation: "Correct: (A) The 14th Amendment was a direct constitutional response to the Black Codes enacted by Southern states after the war — laws that restricted the rights of freedpeople. The Amendment's equal protection and due process clauses were designed to prevent states from re-enslaving Black Americans through discriminatory law. (B) is wrong — the 14th Amendment addressed state discrimination, not federal law. (C) is wrong — the Amendment was passed by Congress over Andrew Johnson's objections. (D) is wrong — citizenship was already being denied; the Amendment established it.",
          correctChoiceId: "", orderIndex: 9,
          choices: { create: [
            { text: "Congress's response to Southern states' attempts to re-impose racial hierarchy through Black Codes after emancipation", isCorrect: true, orderIndex: 0 },
            { text: "Federal government discrimination against freedpeople that Radical Republicans sought to correct", isCorrect: false, orderIndex: 1 },
            { text: "Andrew Johnson's proposal for reconstructing Southern state governments that Congress agreed with", isCorrect: false, orderIndex: 2 },
            { text: "The question of whether African Americans born into slavery could become citizens after emancipation", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above is most historically significant because it established which of the following principles?",
          passage: "\"Section 1: All persons born or naturalized in the United States... are citizens of the United States and of the State wherein they reside. No State shall make or enforce any law which shall abridge the privileges or immunities of citizens of the United States; nor shall any State deprive any person of life, liberty, or property, without due process of law; nor deny to any person within its jurisdiction the equal protection of the laws.\"\n— 14th Amendment to the U.S. Constitution, 1868",
          explanation: "Correct: (C) The 14th Amendment established the constitutional foundation for federal protection of civil rights against state violation — a principle that would be dormant for decades but became the basis for 20th-century civil rights legislation and Supreme Court decisions (Brown v. Board of Education). (A) is wrong — this is about citizenship and equal protection, not voting rights (that was the 15th Amendment). (B) is wrong — federal supremacy was established by the Constitution itself. (D) is wrong — the amendment addresses individual rights, not economic policy.",
          correctChoiceId: "", orderIndex: 10,
          choices: { create: [
            { text: "The right of all male citizens to vote regardless of race, color, or previous servitude", isCorrect: false, orderIndex: 0 },
            { text: "The supremacy of federal law over state law in all matters including economic policy", isCorrect: false, orderIndex: 1 },
            { text: "Federal constitutional protection of individual rights against state infringement — the legal foundation for future civil rights laws", isCorrect: true, orderIndex: 2 },
            { text: "The federal government's right to redistribute confiscated Confederate land to freedpeople", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "A historian studying the period immediately after the 14th Amendment's ratification would most likely note which of the following paradoxes?",
          passage: "\"Section 1: All persons born or naturalized in the United States... are citizens of the United States and of the State wherein they reside. No State shall make or enforce any law which shall abridge the privileges or immunities of citizens of the United States; nor shall any State deprive any person of life, liberty, or property, without due process of law; nor deny to any person within its jurisdiction the equal protection of the laws.\"\n— 14th Amendment to the U.S. Constitution, 1868",
          explanation: "Correct: (D) Despite the 14th Amendment's equal protection guarantee, the Supreme Court's narrow rulings (Slaughterhouse Cases, 1873; Civil Rights Cases, 1883; Plessy v. Ferguson, 1896) allowed states to continue racial discrimination. The Amendment's promise was not realized until the 20th century. (A) is wrong — the Klan used violence, not ignored the amendment openly. (B) is wrong — the amendment was successfully ratified. (C) is wrong — freedpeople knew about the amendment and tried to use its protections.",
          correctChoiceId: "", orderIndex: 11,
          choices: { create: [
            { text: "Southern states openly defied the amendment by refusing to follow even its most basic citizenship provisions", isCorrect: false, orderIndex: 0 },
            { text: "Congress failed to secure enough states to ratify the 14th Amendment until the 20th century", isCorrect: false, orderIndex: 1 },
            { text: "Freedpeople were unaware of their constitutional rights under the new amendment", isCorrect: false, orderIndex: 2 },
            { text: "Despite its guarantees, narrow Supreme Court interpretations allowed states to continue racial discrimination for nearly a century", isCorrect: true, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS E: Compromise of 1877 / End of Reconstruction (Qs 13-15) ──
        {
          prompt: "The graph above most directly supports which of the following conclusions about Reconstruction?",
          passage: "[GRAPH DESCRIPTION] A bar graph shows 'Black Elected Officials in Former Confederate States, 1868–1900.' In 1868: approximately 320 officials. In 1870: approximately 640 (peak). In 1876: approximately 490. In 1880: approximately 310. In 1890: approximately 90. In 1900: approximately 15. A vertical line marks 1877 labeled 'Federal Troops Withdrawn.'",
          explanation: "Correct: (B) The data shows Black political representation peaked during Reconstruction and collapsed after federal troops were withdrawn in 1877 following the Compromise of 1877 — evidence that Reconstruction's political gains were directly tied to federal enforcement. (A) is wrong — the data shows a peak followed by dramatic decline. (C) is wrong — the decline was caused by disenfranchisement, not by choice. (D) is wrong — the sharp decline after 1877 shows federal protection was essential.",
          correctChoiceId: "", orderIndex: 12,
          choices: { create: [
            { text: "Black political participation increased consistently throughout the Reconstruction period and beyond", isCorrect: false, orderIndex: 0 },
            { text: "Black political gains during Reconstruction were directly dependent on federal enforcement and collapsed when federal troops withdrew", isCorrect: true, orderIndex: 1 },
            { text: "Black voters voluntarily withdrew from politics after 1877 due to disillusionment with the Republican Party", isCorrect: false, orderIndex: 2 },
            { text: "Black political participation was maintained at consistent levels even after Reconstruction ended", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Which of the following best explains the trend shown in the graph above after 1877?",
          passage: "[GRAPH DESCRIPTION] A bar graph shows 'Black Elected Officials in Former Confederate States, 1868–1900.' In 1868: approximately 320 officials. In 1870: approximately 640 (peak). In 1876: approximately 490. In 1880: approximately 310. In 1890: approximately 90. In 1900: approximately 15. A vertical line marks 1877 labeled 'Federal Troops Withdrawn.'",
          explanation: "Correct: (C) After federal troops withdrew in 1877, Southern Democrats used poll taxes, literacy tests, grandfather clauses, and white primary elections to systematically disenfranchise Black voters — backed by Ku Klux Klan and Red Shirt violence against those who tried to vote. (A) is wrong — economic factors alone don't explain the near-total elimination of Black officeholders. (B) is wrong — the 15th Amendment was not repealed; it was circumvented. (D) is wrong — Black voters were driven out by force and discriminatory laws, not migration.",
          correctChoiceId: "", orderIndex: 13,
          choices: { create: [
            { text: "Economic hardship from the Panic of 1873 discouraged Black voters from participating in elections", isCorrect: false, orderIndex: 0 },
            { text: "The Supreme Court struck down the 15th Amendment, stripping Black men of their voting rights", isCorrect: false, orderIndex: 1 },
            { text: "Southern states used voter suppression laws, violence, and intimidation to systematically disenfranchise Black voters", isCorrect: true, orderIndex: 2 },
            { text: "Black Southerners migrated north in such large numbers that Southern Black voting power collapsed", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The graph above most directly challenges which of the following historical interpretations of Reconstruction?",
          passage: "[GRAPH DESCRIPTION] A bar graph shows 'Black Elected Officials in Former Confederate States, 1868–1900.' In 1868: approximately 320 officials. In 1870: approximately 640 (peak). In 1876: approximately 490. In 1880: approximately 310. In 1890: approximately 90. In 1900: approximately 15. A vertical line marks 1877 labeled 'Federal Troops Withdrawn.'",
          explanation: "Correct: (A) The graph directly refutes the Lost Cause / Dunning School argument (popular in early 20th-century textbooks) that Reconstruction was a corrupt failure because Black men were unfit to hold office. The data shows hundreds of capable Black officials holding office — and that their removal was the result of violent disenfranchisement, not incompetence. (B) is wrong — the graph supports, not challenges, the idea that Reconstruction achievements were real. (C) is wrong — the graph doesn't address Northern motives. (D) is wrong — the graph shows collapse of Black representation, not its continuation.",
          correctChoiceId: "", orderIndex: 14,
          choices: { create: [
            { text: "The 'Dunning School' interpretation that Reconstruction was a corrupt failure caused by unqualified Black officeholders", isCorrect: true, orderIndex: 0 },
            { text: "The revisionist argument that Reconstruction achieved meaningful political gains for Black Americans", isCorrect: false, orderIndex: 1 },
            { text: "The argument that Northern Republicans supported Reconstruction purely for economic reasons", isCorrect: false, orderIndex: 2 },
            { text: "The interpretation that Black political representation persisted in the South through the Progressive Era", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS F: Freedmen's Bureau / Education (Qs 16-18) ──
        {
          prompt: "The account above most directly reflects which of the following aspects of the Reconstruction period?",
          passage: "\"We worked from before sunup to after dark on that plantation for nothing but our keep and a little patch for a garden. Then the Freedmen's Bureau man came and said we could now make a contract — wages for our labor, land to rent if we could. My husband signed his name with an X, but we understood: the Bureau was telling us we were free people with rights. Our children would go to the Bureau school. That was more than we had ever dreamed possible.\"\n— Oral account from a formerly enslaved woman, South Carolina, c. 1866",
          explanation: "Correct: (B) The Freedmen's Bureau (1865–1872) provided legal contracts, education, and basic relief to formerly enslaved people — representing the first major federal social welfare program and a genuine effort to enable freedpeople to exercise their new rights. (A) is wrong — the account describes empowerment and opportunity, not continued oppression. (C) is wrong — the Bureau was a federal agency helping freedpeople, not restricting them. (D) is wrong — the Bureau operated before the Compromise of 1877 ended Reconstruction.",
          correctChoiceId: "", orderIndex: 15,
          choices: { create: [
            { text: "How the plantation system continued unchanged after emancipation, trapping freedpeople in conditions resembling slavery", isCorrect: false, orderIndex: 0 },
            { text: "How federal Reconstruction institutions like the Freedmen's Bureau created real opportunities for formerly enslaved people to claim their freedom", isCorrect: true, orderIndex: 1 },
            { text: "How federal agents worked to restrict freedpeople's labor choices by enforcing plantation work contracts", isCorrect: false, orderIndex: 2 },
            { text: "How the withdrawal of federal troops in 1877 devastated the Freedmen's Bureau programs", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The account above most directly challenges which of the following arguments about freedpeople's priorities during Reconstruction?",
          passage: "\"We worked from before sunup to after dark on that plantation for nothing but our keep and a little patch for a garden. Then the Freedmen's Bureau man came and said we could now make a contract — wages for our labor, land to rent if we could. My husband signed his name with an X, but we understood: the Bureau was telling us we were free people with rights. Our children would go to the Bureau school. That was more than we had ever dreamed possible.\"\n— Oral account from a formerly enslaved woman, South Carolina, c. 1866",
          explanation: "Correct: (D) The account shows freedpeople eagerly pursuing education, legal contracts, and land rental — directly contradicting the Lost Cause / Dunning School argument that freedpeople were content with or suited only for agricultural labor under white supervision. (A) is wrong — the account shows freedpeople actively claiming rights. (B) is wrong — there is evidence of strong desire for education. (C) is wrong — the Bureau is helping this family, not failing them.",
          correctChoiceId: "", orderIndex: 16,
          choices: { create: [
            { text: "The argument that freedpeople were passive recipients of Reconstruction policy rather than active agents demanding rights", isCorrect: false, orderIndex: 0 },
            { text: "The claim that freedpeople were uninterested in formal education because literacy had no practical value", isCorrect: false, orderIndex: 1 },
            { text: "The argument that the Freedmen's Bureau consistently failed to deliver meaningful assistance", isCorrect: false, orderIndex: 2 },
            { text: "The Lost Cause argument that freedpeople were better suited for dependent agricultural labor than independent citizenship", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The source above best illustrates which of the following continuities between the antebellum and Reconstruction periods?",
          passage: "\"We worked from before sunup to after dark on that plantation for nothing but our keep and a little patch for a garden. Then the Freedmen's Bureau man came and said we could now make a contract — wages for our labor, land to rent if we could. My husband signed his name with an X, but we understood: the Bureau was telling us we were free people with rights. Our children would go to the Bureau school. That was more than we had ever dreamed possible.\"\n— Oral account from a formerly enslaved woman, South Carolina, c. 1866",
          explanation: "Correct: (A) The fact that the husband 'signed his name with an X' reflects the antebellum prohibition on slave literacy — reading and writing were illegal for enslaved people in most Southern states. The desire to educate their children reflects freedpeople's awareness of this deprivation and their determination to ensure the next generation was not similarly limited. (B) is wrong — the account shows profound change in legal status. (C) is wrong — the account shows a woman with agency, not a passive victim. (D) is wrong — the family is accessing the plantation's agricultural economy but is NOT trapped in the same conditions.",
          correctChoiceId: "", orderIndex: 17,
          choices: { create: [
            { text: "The antebellum denial of literacy to enslaved people, which Reconstruction-era freedpeople sought to overcome through education", isCorrect: true, orderIndex: 0 },
            { text: "The continuation of slavery under a different name through the sharecropping and debt peonage systems", isCorrect: false, orderIndex: 1 },
            { text: "The passive role of enslaved women who deferred entirely to white authority during and after enslavement", isCorrect: false, orderIndex: 2 },
            { text: "How the plantation economy remained largely unchanged between the antebellum and Reconstruction periods", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS G: Causes of the Civil War — Excerpt from Confederate VP Stephens (Qs 19-20) ──
        {
          prompt: "The speech above most directly reflects which of the following historical debates about the Civil War?",
          passage: "\"Our new government is founded upon exactly the opposite idea [of the Founders' belief that slavery was wrong]; its foundations are laid, its cornerstone rests, upon the great truth that the negro is not equal to the white man; that slavery — subordination to the superior race — is his natural and normal condition. This, our new government, is the first, in the history of the world, based upon this great physical, philosophical, and moral truth.\"\n— Alexander Stephens, Confederate Vice President, 'Cornerstone Speech,' March 21, 1861",
          explanation: "Correct: (C) Stephens's 'Cornerstone Speech' is the most direct primary source refuting the 'states' rights' interpretation of the Civil War — the Confederate Vice President himself stated that the Confederate government was explicitly founded on white supremacy and slavery. This makes the speech crucial evidence in the historiographical debate about the war's causes. (A) is wrong — Stephens is celebrating white supremacy, not defending general states' rights. (B) is wrong — this is about the foundation of the Confederacy, not Lincoln's policies. (D) is wrong — economic interpretations focus on industrialism vs. agrarianism; Stephens explicitly states the cause is racial slavery.",
          correctChoiceId: "", orderIndex: 18,
          choices: { create: [
            { text: "Whether Northern economic protectionism rather than Southern rights was the primary cause of the war", isCorrect: false, orderIndex: 0 },
            { text: "Whether Lincoln's election alone caused secession or whether long-term sectional tensions were responsible", isCorrect: false, orderIndex: 1 },
            { text: "Whether slavery or states' rights was the primary cause of Southern secession — with Stephens explicitly naming slavery and white supremacy", isCorrect: true, orderIndex: 2 },
            { text: "Whether the economic differences between industrial North and agrarian South were more important than racial ideology", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The speech above most directly refutes which of the following arguments about the Confederacy?",
          passage: "\"Our new government is founded upon exactly the opposite idea [of the Founders' belief that slavery was wrong]; its foundations are laid, its cornerstone rests, upon the great truth that the negro is not equal to the white man; that slavery — subordination to the superior race — is his natural and normal condition. This, our new government, is the first, in the history of the world, based upon this great physical, philosophical, and moral truth.\"\n— Alexander Stephens, Confederate Vice President, 'Cornerstone Speech,' March 21, 1861",
          explanation: "Correct: (B) The 'Lost Cause' mythology argues that the Confederacy fought primarily for states' rights and Southern culture, not slavery. Stephens's speech — given by the Confederacy's own vice president weeks before the war began — directly contradicts this by naming slavery and white supremacy as the Confederacy's explicit founding principles. (A) is wrong — Stephens supports, not opposes, slavery. (C) is wrong — Stephens is speaking in favor of secession. (D) is wrong — this speech was given before Lincoln took any action against slavery.",
          correctChoiceId: "", orderIndex: 19,
          choices: { create: [
            { text: "The abolitionist argument that all Confederates were personally committed to the expansion of slavery", isCorrect: false, orderIndex: 0 },
            { text: "The 'Lost Cause' narrative that the Confederacy fought primarily for states' rights rather than for the preservation of slavery", isCorrect: true, orderIndex: 1 },
            { text: "The argument that moderate Confederates supported secession only reluctantly, under pressure from slaveholders", isCorrect: false, orderIndex: 2 },
            { text: "Lincoln's argument that the Emancipation Proclamation changed the South's motivation for fighting the war", isCorrect: false, orderIndex: 3 },
          ]},
        },

      ]},
    },
    include: { questions: { include: { choices: true } } },
  })
  await fixCorrectChoices(quiz5)
  console.log("✓ Created quiz:", quiz5.title, `(${quiz5.questions.length} questions)`)

  // ── Quiz Bank 6: AP European History – Renaissance through French Revolution ───
  const quiz6 = await prisma.questionBank.create({
    data: {
      title: "AP European History – Renaissance to French Revolution",
      subject: "AP European History",
      description: "Stimulus-based questions covering the Renaissance, Reformation, Scientific Revolution, Absolutism, Enlightenment, and the French Revolution.",
      isPublic: true, ownerId: admin.id,
      questions: { create: [

        // ── STIMULUS A: Raphael's School of Athens / Renaissance Humanism (Qs 1-3) ──
        {
          prompt: "The painting above most directly reflects which of the following characteristics of Renaissance humanism?",
          passage: "[IMAGE DESCRIPTION] Raphael's 'School of Athens' (1509–1511), a large fresco painting in the Vatican. The massive arched hall is filled with ancient Greek philosophers: Plato and Aristotle walk at the center — Plato points upward (toward ideal forms) and Aristotle gestures horizontally (toward earthly reality). Around them, Socrates, Pythagoras, Euclid, Diogenes, and others discuss, calculate, and argue. The architecture shows classical Roman arches and perspective.",
          explanation: "Correct: (A) Raphael's fresco celebrates ancient Greek and Roman learning — placing pagan philosophers at the center of intellectual life — reflecting the Renaissance humanist recovery and celebration of classical antiquity as the foundation of knowledge. The painting was commissioned by Pope Julius II for the Vatican, symbolizing the fusion of classical learning and Christian culture. (B) is wrong — the painting celebrates reason and philosophy, not faith. (C) is wrong — the fresco features pagan philosophers, not Christian saints. (D) is wrong — this predates the Scientific Revolution.",
          correctChoiceId: "", orderIndex: 0,
          choices: { create: [
            { text: "Renaissance admiration for classical Greek and Roman learning as a model for human intellectual and cultural achievement", isCorrect: true, orderIndex: 0 },
            { text: "Medieval scholasticism that subordinated ancient philosophy to Christian theological authority", isCorrect: false, orderIndex: 1 },
            { text: "The Counter-Reformation emphasis on Christian piety and rejection of pagan classical influences", isCorrect: false, orderIndex: 2 },
            { text: "The Scientific Revolution's use of empirical observation to overthrow ancient Greek natural philosophy", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The commission of the painting above by the Catholic Church most directly illustrates which of the following Renaissance developments?",
          passage: "[IMAGE DESCRIPTION] Raphael's 'School of Athens' (1509–1511), a large fresco painting in the Vatican. The massive arched hall is filled with ancient Greek philosophers: Plato and Aristotle walk at the center — Plato points upward (toward ideal forms) and Aristotle gestures horizontally (toward earthly reality). Around them, Socrates, Pythagoras, Euclid, Diogenes, and others discuss, calculate, and argue. The architecture shows classical Roman arches and perspective.",
          explanation: "Correct: (C) The Vatican commissioning a painting celebrating pagan Greek philosophers reflects the Renaissance synthesis — Church leaders, merchants, and rulers competed to patronize artists and scholars, using art to display wealth, power, and cultural prestige. Without Church and Medici patronage, the Renaissance would not have been possible. (A) is wrong — the Church was embracing, not opposing, classical learning at this point. (B) is wrong — this preceded the Reformation. (D) is wrong — patronage was not an economic reform.",
          correctChoiceId: "", orderIndex: 1,
          choices: { create: [
            { text: "The Catholic Church's opposition to humanist scholarship and its efforts to suppress classical learning", isCorrect: false, orderIndex: 0 },
            { text: "Protestant challenges to papal authority that forced the Church to use art as propaganda", isCorrect: false, orderIndex: 1 },
            { text: "The role of wealthy patrons — including the Church — in funding art and learning as expressions of power and prestige", isCorrect: true, orderIndex: 2 },
            { text: "Economic reforms that allowed the Church to invest surplus wealth in cultural projects", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The contrast between Plato pointing upward and Aristotle gesturing outward in the painting above best illustrates which of the following Renaissance intellectual tensions?",
          passage: "[IMAGE DESCRIPTION] Raphael's 'School of Athens' (1509–1511), a large fresco painting in the Vatican. The massive arched hall is filled with ancient Greek philosophers: Plato and Aristotle walk at the center — Plato points upward (toward ideal forms) and Aristotle gestures horizontally (toward earthly reality). Around them, Socrates, Pythagoras, Euclid, Diogenes, and others discuss, calculate, and argue. The architecture shows classical Roman arches and perspective.",
          explanation: "Correct: (B) Raphael's visual contrast between Plato (idealism — truth exists in a higher realm beyond the senses) and Aristotle (empiricism — truth is found in the physical world through observation) represents the two major traditions of Western philosophy that Renaissance thinkers sought to reconcile. Aristotle's gesture toward the earth anticipates the Scientific Revolution's empirical method. (A) is wrong — neither philosopher was a Christian. (C) is wrong — this contrast is philosophical, not about the Church. (D) is wrong — this is about philosophical methods, not political theory.",
          correctChoiceId: "", orderIndex: 2,
          choices: { create: [
            { text: "The Christian debate between faith in God's revelation and reason as guides to truth", isCorrect: false, orderIndex: 0 },
            { text: "The philosophical tension between Platonic idealism (truth exists beyond the senses) and Aristotelian empiricism (truth is found through observation of the physical world)", isCorrect: true, orderIndex: 1 },
            { text: "The conflict between Church authority and individual conscience that sparked the Protestant Reformation", isCorrect: false, orderIndex: 2 },
            { text: "The Renaissance debate between monarchy and republicanism as ideal forms of government", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS B: Luther's 95 Theses / Protestant Reformation (Qs 4-6) ──
        {
          prompt: "The document above most directly reflects which of the following causes of the Protestant Reformation?",
          passage: "\"Out of love for the truth and the desire to bring it to light, the following propositions will be discussed at Wittenberg, under the presidency of the Reverend Father Martin Luther... Thesis 27: There is no divine authority for preaching that the soul flies out of the purgatory immediately the money clinks in the collection-box. Thesis 86: Why does the Pope, whose wealth today is greater than the wealth of the richest Crassus, build the basilica of St. Peter with the money of poor believers rather than with his own money?\"\n— Martin Luther, 95 Theses (selected), 1517",
          explanation: "Correct: (C) Luther's 95 Theses attacked the Catholic practice of selling indulgences (pardons for sin) and questioned papal wealth — specifically criticizing the Church for using indulgence revenue to fund St. Peter's Basilica while the poor were deceived. This challenged both Church doctrine and institutional corruption. (A) is wrong — Luther attacked Church financial corruption, not just doctrinal errors. (B) is wrong — Luther was criticizing Church authority, not defending it. (D) is wrong — Luther published the Theses to challenge the Church, not to support it.",
          correctChoiceId: "", orderIndex: 3,
          choices: { create: [
            { text: "Luther's approval of the Catholic Church's practice of selling indulgences as a legitimate source of revenue", isCorrect: false, orderIndex: 0 },
            { text: "The Church's defense of indulgences as a purely doctrinal matter unrelated to financial corruption", isCorrect: false, orderIndex: 1 },
            { text: "Criticism of Church financial corruption, specifically the sale of indulgences to fund papal building projects", isCorrect: true, orderIndex: 2 },
            { text: "Luther's attempt to reform the Church from within by proposing minor improvements to the indulgence system", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Which of the following developments most directly enabled Luther's 95 Theses to spark a Reformation across Europe?",
          passage: "\"Out of love for the truth and the desire to bring it to light, the following propositions will be discussed at Wittenberg, under the presidency of the Reverend Father Martin Luther... Thesis 27: There is no divine authority for preaching that the soul flies out of the purgatory immediately the money clinks in the collection-box. Thesis 86: Why does the Pope, whose wealth today is greater than the wealth of the richest Crassus, build the basilica of St. Peter with the money of poor believers rather than with his own money?\"\n— Martin Luther, 95 Theses (selected), 1517",
          explanation: "Correct: (A) Gutenberg's printing press (c. 1440) made it possible to distribute Luther's writings rapidly and cheaply across Europe. Within weeks, the 95 Theses had spread across Germany; within months, across Europe. Previous reformers (Jan Hus, John Wycliffe) had been suppressed partly because their ideas spread slowly. (B) is wrong — the Church opposed Luther. (C) is wrong — the Reformation was about religion, though politics played a role. (D) is wrong — Erasmus supported Church reform but did not support Luther's break with Rome.",
          correctChoiceId: "", orderIndex: 4,
          choices: { create: [
            { text: "The printing press allowed Luther's ideas to spread rapidly across Europe, reaching audiences that previous reformers had never been able to reach", isCorrect: true, orderIndex: 0 },
            { text: "Pope Leo X's decision to publish and discuss Luther's Theses publicly, inadvertently spreading his ideas", isCorrect: false, orderIndex: 1 },
            { text: "The Holy Roman Emperor's support for religious reform that allowed Luther's movement to grow without opposition", isCorrect: false, orderIndex: 2 },
            { text: "Erasmus's public endorsement of Luther's theology that gave the Reformation intellectual credibility", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Luther's challenge in the passage above most directly contributed to which of the following long-term consequences?",
          passage: "\"Out of love for the truth and the desire to bring it to light, the following propositions will be discussed at Wittenberg, under the presidency of the Reverend Father Martin Luther... Thesis 27: There is no divine authority for preaching that the soul flies out of the purgatory immediately the money clinks in the collection-box. Thesis 86: Why does the Pope, whose wealth today is greater than the wealth of the richest Crassus, build the basilica of St. Peter with the money of poor believers rather than with his own money?\"\n— Martin Luther, 95 Theses (selected), 1517",
          explanation: "Correct: (D) Luther's challenge to papal authority — by claiming Scripture alone (sola scriptura) as the basis for Christian truth — broke the Catholic Church's monopoly on scriptural interpretation, eventually producing hundreds of Protestant denominations and a century of religious warfare (Thirty Years' War, 1618–1648). (A) is wrong — the Church lost power rather than regained it. (B) is wrong — Luther opposed peasant revolts in 1525. (C) is wrong — secularism grew from the Wars of Religion but was not Luther's intent.",
          correctChoiceId: "", orderIndex: 5,
          choices: { create: [
            { text: "The strengthening of papal authority as the Church successfully suppressed the Reformation through the Inquisition", isCorrect: false, orderIndex: 0 },
            { text: "The German Peasants' War in which Luther led a social revolution against feudal landlords", isCorrect: false, orderIndex: 1 },
            { text: "The immediate secularization of European society as religious authority collapsed", isCorrect: false, orderIndex: 2 },
            { text: "The permanent fragmentation of Western Christianity into competing denominations and a century of religious conflict", isCorrect: true, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS C: Galileo / Scientific Revolution (Qs 7-9) ──
        {
          prompt: "The account above most directly reflects which of the following conflicts of the Scientific Revolution?",
          passage: "\"I was in Rome, before the Holy Office, and was made to abjure, curse, and detest the aforesaid errors and heresies... being that I held and believed that the sun is the centre of the world and immovable, and that the earth is not the centre... After the abjuration they released me, but only to the custody of my villa at Arcetri... and here I end, blind, deaf, broken, useless, awaiting the end.\"\n— Galileo Galilei, letter, c. 1638 (adapted)",
          explanation: "Correct: (B) Galileo's condemnation by the Inquisition for supporting the heliocentric Copernican theory directly illustrates the conflict between the new empirical science (based on observation through the telescope) and Church authority (based on Scripture and Aristotelian cosmology). (A) is wrong — Galileo was using observation, not just mathematics. (C) is wrong — Galileo was condemned for heliocentrism, which challenged both Scripture and Aristotle. (D) is wrong — Galileo was a devout Catholic; the conflict was not between faith and atheism.",
          correctChoiceId: "", orderIndex: 6,
          choices: { create: [
            { text: "The conflict between mathematicians and experimental scientists over the proper method of scientific inquiry", isCorrect: false, orderIndex: 0 },
            { text: "The conflict between empirical scientific observation and Church authority based on Scripture and Aristotelian cosmology", isCorrect: true, orderIndex: 1 },
            { text: "Protestant challenges to Catholic teaching that inspired natural philosophers to seek alternative worldviews", isCorrect: false, orderIndex: 2 },
            { text: "The conflict between religious faith and atheism that the Scientific Revolution allegedly produced", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The passage above most directly illustrates which of the following broader consequences of the Scientific Revolution?",
          passage: "\"I was in Rome, before the Holy Office, and was made to abjure, curse, and detest the aforesaid errors and heresies... being that I held and believed that the sun is the centre of the world and immovable, and that the earth is not the centre... After the abjuration they released me, but only to the custody of my villa at Arcetri... and here I end, blind, deaf, broken, useless, awaiting the end.\"\n— Galileo Galilei, letter, c. 1638 (adapted)",
          explanation: "Correct: (C) Galileo's case illustrates the long-term shift in European intellectual authority: as scientific observation produced results that contradicted Church teaching, the Church's ability to suppress new knowledge weakened. Over the following century, natural philosophy became increasingly independent of theological authority — a key cause of the Enlightenment. (A) is wrong — the Church suppressed Galileo; science won in the long run. (B) is wrong — the Reformation was a separate movement. (D) is wrong — Galileo's work was mathematical and observational, not technological.",
          correctChoiceId: "", orderIndex: 7,
          choices: { create: [
            { text: "How the Catholic Church successfully contained scientific inquiry within acceptable theological boundaries", isCorrect: false, orderIndex: 0 },
            { text: "How the Protestant Reformation directly inspired scientists to challenge Catholic natural philosophy", isCorrect: false, orderIndex: 1 },
            { text: "How conflicts between scientific observation and Church authority gradually shifted European intellectual life toward secular rationalism", isCorrect: true, orderIndex: 2 },
            { text: "How the Scientific Revolution was primarily driven by technological improvements in navigation and warfare", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "A historian would most likely use Galileo's case as evidence to support which of the following arguments about the relationship between the Scientific Revolution and the Enlightenment?",
          passage: "\"I was in Rome, before the Holy Office, and was made to abjure, curse, and detest the aforesaid errors and heresies... being that I held and believed that the sun is the centre of the world and immovable, and that the earth is not the centre... After the abjuration they released me, but only to the custody of my villa at Arcetri... and here I end, blind, deaf, broken, useless, awaiting the end.\"\n— Galileo Galilei, letter, c. 1638 (adapted)",
          explanation: "Correct: (D) Enlightenment thinkers (Voltaire, Diderot, d'Alembert) frequently cited the Church's persecution of Galileo as a prime example of religious superstition obstructing human progress — the case became a foundational narrative for the Enlightenment critique of institutional religion and the defense of free inquiry. (A) is wrong — Galileo was a scientist, not an Enlightenment philosopher. (B) is wrong — Enlightenment thinkers were MORE critical of the Church because of Galileo. (C) is wrong — Enlightenment thinkers embraced Newtonian science, not Church authority.",
          correctChoiceId: "", orderIndex: 8,
          choices: { create: [
            { text: "Galileo's work established the philosophical foundations of Enlightenment rationalism before Descartes or Locke", isCorrect: false, orderIndex: 0 },
            { text: "Galileo's trial reconciled the Church with scientific inquiry, enabling the Enlightenment to proceed without religious opposition", isCorrect: false, orderIndex: 1 },
            { text: "Enlightenment thinkers rejected natural science in favor of social philosophy after Galileo's persecution", isCorrect: false, orderIndex: 2 },
            { text: "Enlightenment thinkers used Galileo's persecution as a foundational example of religious superstition obstructing free inquiry and human progress", isCorrect: true, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS D: Louis XIV / Absolutism (Qs 10-12) ──
        {
          prompt: "The excerpt above most directly reflects which of the following features of absolute monarchy?",
          passage: "\"L'état, c'est moi.\" [The state, it is I.]\n\"It is legal because I wish it.\"\n\"The royal throne is not the throne of a man, but the throne of God himself... Kings are ministers of God and lieutenant-governors of God on earth.\"\n— Statements attributed to Louis XIV of France (1638–1715); last quotation from Bishop Bossuet's Political Treatise, 1709",
          explanation: "Correct: (A) The passages reflect the core doctrine of divine right absolutism: the monarch is accountable only to God, not to parliament, aristocracy, or law. Louis XIV embodied this through Versailles, control of the nobility, and centralization of French administration. (B) is wrong — Louis XIV claimed authority beyond the law, not within it. (C) is wrong — absolutism concentrated power; it did not share it. (D) is wrong — Louis XIV famously revoked the Edict of Nantes (1685) and suppressed religious minorities.",
          correctChoiceId: "", orderIndex: 9,
          choices: { create: [
            { text: "The divine right of kings doctrine that made the monarch's authority absolute, answerable only to God", isCorrect: true, orderIndex: 0 },
            { text: "Constitutional monarchy in which the king's authority was limited by law and representative assemblies", isCorrect: false, orderIndex: 1 },
            { text: "The aristocratic tradition of shared governance between the king and the noble estates", isCorrect: false, orderIndex: 2 },
            { text: "Religious toleration as a foundation for royal authority in a multiconfessional state", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Louis XIV's construction of Versailles most directly served which of the following political purposes?",
          passage: "\"L'état, c'est moi.\" [The state, it is I.]\n\"It is legal because I wish it.\"\n\"The royal throne is not the throne of a man, but the throne of God himself... Kings are ministers of God and lieutenant-governors of God on earth.\"\n— Statements attributed to Louis XIV of France (1638–1715); last quotation from Bishop Bossuet's Political Treatise, 1709",
          explanation: "Correct: (C) Louis XIV required the great nobles of France to live at Versailles, removing them from their regional power bases, making them dependent on royal favor, and keeping them under his surveillance. This was a key mechanism for breaking the nobility's independence and consolidating absolute power. (A) is wrong — Versailles was designed to display French power, not military might. (B) is wrong — Versailles isolated the nobility from their estates, not the people from their king. (D) is wrong — Versailles glorified the king, not the Church.",
          correctChoiceId: "", orderIndex: 10,
          choices: { create: [
            { text: "To create a military headquarters from which Louis could direct French wars of expansion", isCorrect: false, orderIndex: 0 },
            { text: "To physically distance the king from the people of Paris, who had threatened the monarchy during the Fronde", isCorrect: false, orderIndex: 1 },
            { text: "To concentrate the French nobility at court, making them dependent on royal favor and undermining their independent regional power", isCorrect: true, orderIndex: 2 },
            { text: "To demonstrate the power of the Catholic Church by building the largest religious complex in Europe", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Louis XIV's absolutism was most directly challenged by which of the following Enlightenment critiques?",
          passage: "\"L'état, c'est moi.\" [The state, it is I.]\n\"It is legal because I wish it.\"\n\"The royal throne is not the throne of a man, but the throne of God himself... Kings are ministers of God and lieutenant-governors of God on earth.\"\n— Statements attributed to Louis XIV of France (1638–1715); last quotation from Bishop Bossuet's Political Treatise, 1709",
          explanation: "Correct: (B) John Locke (Two Treatises of Government, 1689) directly contradicted divine right theory by arguing that government authority comes not from God but from the consent of the governed, and that citizens have the right to overthrow a government that violates their natural rights. This argument was used by American and French revolutionaries against absolutism. (A) is wrong — Machiavelli's Prince advised rulers on maintaining power, not on divine right. (C) is wrong — Rousseau's 'general will' was another Enlightenment critique, but Locke's natural rights theory was the most direct challenge to divine right. (D) is wrong — Voltaire criticized religious intolerance, not specifically divine right theory.",
          correctChoiceId: "", orderIndex: 11,
          choices: { create: [
            { text: "Machiavelli's argument that rulers should use any means necessary to maintain state power", isCorrect: false, orderIndex: 0 },
            { text: "Locke's argument that legitimate government derives from the consent of the governed, not from divine authority", isCorrect: true, orderIndex: 1 },
            { text: "Rousseau's theory of the 'general will' that required all citizens to submit to collective decisions", isCorrect: false, orderIndex: 2 },
            { text: "Voltaire's criticism of religious intolerance that undermined the Church's support for monarchy", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS E: Declaration of the Rights of Man (Qs 13-15) ──
        {
          prompt: "The document above most directly reflects the influence of which of the following intellectual movements?",
          passage: "\"Article 1: Men are born and remain free and equal in rights. Social distinctions may be founded only upon the general good.\nArticle 2: The aim of all political association is the preservation of the natural and imprescriptible rights of man. These rights are liberty, property, security, and resistance to oppression.\nArticle 3: The principle of all sovereignty resides essentially in the nation. No body nor individual may exercise any authority which does not proceed directly from the nation.\"\n— Declaration of the Rights of Man and of the Citizen, France, August 26, 1789",
          explanation: "Correct: (A) The Declaration directly reflects Enlightenment philosophy: Locke's natural rights (liberty, property, security), Rousseau's popular sovereignty ('the nation'), and the American Declaration's influence. The language of 'natural and imprescriptible rights' is specifically Enlightenment terminology. (B) is wrong — mercantilism was an economic theory about state wealth, not rights. (C) is wrong — Counter-Reformation emphasized Church authority, not individual rights. (D) is wrong — the document is about political rights, not scientific method.",
          correctChoiceId: "", orderIndex: 12,
          choices: { create: [
            { text: "Enlightenment philosophy, particularly natural rights theory and popular sovereignty", isCorrect: true, orderIndex: 0 },
            { text: "Mercantilist economic theory that linked national wealth to political rights", isCorrect: false, orderIndex: 1 },
            { text: "Counter-Reformation Catholic social teaching about the dignity of the individual", isCorrect: false, orderIndex: 2 },
            { text: "The Scientific Revolution's empirical method applied to political philosophy", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The document above most directly challenged which of the following features of pre-revolutionary French society?",
          passage: "\"Article 1: Men are born and remain free and equal in rights. Social distinctions may be founded only upon the general good.\nArticle 2: The aim of all political association is the preservation of the natural and imprescriptible rights of man. These rights are liberty, property, security, and resistance to oppression.\nArticle 3: The principle of all sovereignty resides essentially in the nation. No body nor individual may exercise any authority which does not proceed directly from the nation.\"\n— Declaration of the Rights of Man and of the Citizen, France, August 26, 1789",
          explanation: "Correct: (C) The Declaration attacked the Ancien Régime's fundamental structures: Article 1 challenged hereditary aristocracy (social distinctions based on birth, not merit); Article 3 challenged royal absolutism (sovereignty belongs to the nation, not the king). (A) is wrong — the document protects property rights. (B) is wrong — the Declaration says social distinctions are only valid if they serve 'the general good' — it challenged hereditary privilege but not all hierarchy. (D) is wrong — the document was issued during the Revolution, not before it.",
          correctChoiceId: "", orderIndex: 13,
          choices: { create: [
            { text: "The property rights of French peasants that the Declaration sought to abolish in favor of collective ownership", isCorrect: false, orderIndex: 0 },
            { text: "All forms of social distinction and inequality, calling for complete economic equality", isCorrect: false, orderIndex: 1 },
            { text: "The hereditary aristocracy (noble privilege based on birth) and royal absolutism (sovereignty resting in the king)", isCorrect: true, orderIndex: 2 },
            { text: "The power of the Catholic Church, whose influence had dominated French politics since Charlemagne", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "A critic writing in 1792 would most likely point out which of the following limitations of the document above?",
          passage: "\"Article 1: Men are born and remain free and equal in rights. Social distinctions may be founded only upon the general good.\nArticle 2: The aim of all political association is the preservation of the natural and imprescriptible rights of man. These rights are liberty, property, security, and resistance to oppression.\nArticle 3: The principle of all sovereignty resides essentially in the nation. No body nor individual may exercise any authority which does not proceed directly from the nation.\"\n— Declaration of the Rights of Man and of the Citizen, France, August 26, 1789",
          explanation: "Correct: (B) Olympe de Gouges published her Declaration of the Rights of Woman and of the Female Citizen in 1791, directly challenging the male-only interpretation of 'the Rights of Man' — pointing out that universal language actually excluded women from political rights, property rights, and representation. (A) is wrong — the document explicitly protects property rights. (C) is wrong — slavery in French colonies was a valid critique (Haitian Revolution), but the most direct limitation was the exclusion of women from political rights. (D) is wrong — the document specifically addresses political rights, not economic ones.",
          correctChoiceId: "", orderIndex: 14,
          choices: { create: [
            { text: "The document's protection of property rights that prevented redistribution of noble wealth to the poor", isCorrect: false, orderIndex: 0 },
            { text: "The document's use of 'men' excluded women from the universal rights it proclaimed, as Olympe de Gouges pointed out in 1791", isCorrect: true, orderIndex: 1 },
            { text: "The document's silence on slavery in French colonies, which continued despite its universal language", isCorrect: false, orderIndex: 1 },
            { text: "The document's failure to address economic inequality, limiting rights to those who owned property", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS F: Data on French Estates / Economic Inequality (Qs 16-18) ──
        {
          prompt: "The data above most directly supports which of the following conclusions about pre-revolutionary France?",
          passage: "[TABLE: French Society Under the Ancien Régime, c. 1789]\n| Estate       | % of Population | % of Land Owned | Tax Burden        | Political Rights |\n|--------------|-----------------|-----------------|-------------------|------------------|\n| First Estate (Clergy) | 0.5%  | ~10%            | Exempt (paid 'gift' to king) | Represented in Estates-General |\n| Second Estate (Nobility) | 1.5% | ~25%         | Largely exempt    | Represented in Estates-General |\n| Third Estate (Everyone else) | 98% | ~65%   | Bore full burden of taxation | Underrepresented in Estates-General |",
          explanation: "Correct: (A) The table shows a society of radical legal inequality: 98% of the population (Third Estate — peasants, bourgeoisie, urban workers) bore the full tax burden while the privileged estates (Clergy and Nobility, 2% of the population) were largely exempt. This fiscal injustice was the immediate cause of the 1789 financial crisis that triggered the Revolution. (B) is wrong — the nobility owned 25%, not a minority, of the land. (C) is wrong — the Third Estate owned 65% of land but bore all taxes. (D) is wrong — the table shows the Third Estate was massively underrepresented.",
          correctChoiceId: "", orderIndex: 15,
          choices: { create: [
            { text: "A deeply unequal tax system in which the 98% who were commoners bore the full fiscal burden while privileged estates were exempt", isCorrect: true, orderIndex: 0 },
            { text: "A land-ownership pattern in which the nobility owned the vast majority of French agricultural land", isCorrect: false, orderIndex: 1 },
            { text: "A system in which the Third Estate paid no taxes because they owned most of the productive land", isCorrect: false, orderIndex: 2 },
            { text: "A politically balanced system in which the Third Estate's numerical majority gave it proportional representation", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The data in the table above most directly explains which of the following causes of the French Revolution?",
          passage: "[TABLE: French Society Under the Ancien Régime, c. 1789]\n| Estate       | % of Population | % of Land Owned | Tax Burden        | Political Rights |\n|--------------|-----------------|-----------------|-------------------|------------------|\n| First Estate (Clergy) | 0.5%  | ~10%            | Exempt (paid 'gift' to king) | Represented in Estates-General |\n| Second Estate (Nobility) | 1.5% | ~25%         | Largely exempt    | Represented in Estates-General |\n| Third Estate (Everyone else) | 98% | ~65%   | Bore full burden of taxation | Underrepresented in Estates-General |",
          explanation: "Correct: (C) When Louis XVI convened the Estates-General in 1789 to address France's bankruptcy, the Third Estate demanded proportional voting (since it was 98% of the population). The nobility and clergy refused, insisting on voting by estate (each estate one vote), which guaranteed them a permanent majority. This political deadlock drove the Third Estate to form the National Assembly — the opening act of the Revolution. (A) is wrong — the table shows the bourgeoisie as part of the Third Estate bearing the tax burden; the conflict was primarily about taxation and representation. (B) is wrong — the Church is listed as partially exempt, not as triggering the Revolution through taxation. (D) is wrong — the table shows the THIRD Estate bearing taxes, not being exempt.",
          correctChoiceId: "", orderIndex: 16,
          choices: { create: [
            { text: "The bourgeoisie's desire to protect their economic privileges from noble encroachment", isCorrect: false, orderIndex: 0 },
            { text: "The Church's decision to begin taxing the peasantry, triggering the peasant uprisings of 1789", isCorrect: false, orderIndex: 1 },
            { text: "The Third Estate's demand for proportional voting at the Estates-General that the privileged orders refused, driving the constitutional crisis of 1789", isCorrect: true, orderIndex: 2 },
            { text: "The nobility's refusal to pay any taxes, which bankrupted France and forced Louis XVI to seize noble land", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "Which of the following Enlightenment principles most directly challenged the system shown in the table above?",
          passage: "[TABLE: French Society Under the Ancien Régime, c. 1789]\n| Estate       | % of Population | % of Land Owned | Tax Burden        | Political Rights |\n|--------------|-----------------|-----------------|-------------------|------------------|\n| First Estate (Clergy) | 0.5%  | ~10%            | Exempt (paid 'gift' to king) | Represented in Estates-General |\n| Second Estate (Nobility) | 1.5% | ~25%         | Largely exempt    | Represented in Estates-General |\n| Third Estate (Everyone else) | 98% | ~65%   | Bore full burden of taxation | Underrepresented in Estates-General |",
          explanation: "Correct: (A) The Enlightenment principle of natural equality — that all people are born with equal rights (Locke, Rousseau, Jefferson) — directly challenged hereditary privilege. The French Ancien Régime was built on legally inherited inequality; the Enlightenment said this was neither natural nor just. (B) is wrong — religious toleration (Voltaire) was an Enlightenment principle but not the one most directly challenging the Estate system. (C) is wrong — free trade was an economic Enlightenment idea, not directly about political representation. (D) is wrong — separation of powers (Montesquieu) addressed government structure, not social hierarchy.",
          correctChoiceId: "", orderIndex: 17,
          choices: { create: [
            { text: "Natural equality and natural rights — the principle that all people are born with equal rights regardless of birth status", isCorrect: true, orderIndex: 0 },
            { text: "Religious toleration — the principle that the Church should not participate in political governance", isCorrect: false, orderIndex: 1 },
            { text: "Free trade — the principle that economic markets should operate without aristocratic monopolies", isCorrect: false, orderIndex: 2 },
            { text: "Separation of powers — the principle that government authority should be divided between legislative, executive, and judicial branches", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── STIMULUS G: Reign of Terror (Qs 19-20) ──
        {
          prompt: "The speech above most directly reflects which of the following aspects of the French Revolution?",
          passage: "\"If the basis of popular government in time of peace is virtue, the basis of popular government during a revolution is both virtue and terror: virtue, without which terror is murderous; terror, without which virtue is powerless. The terror is nothing but justice, prompt, severe, inflexible; it is therefore an emanation of virtue.\"\n— Maximilien Robespierre, February 5, 1794",
          explanation: "Correct: (B) Robespierre's speech is the intellectual justification for the Reign of Terror (1793–1794), in which the Committee of Public Safety executed approximately 17,000 people in the name of protecting the Revolution from enemies. Robespierre argued that terror was a form of revolutionary virtue — a logic that led to his own execution in Thermidor (July 1794). (A) is wrong — Robespierre defended the Terror, not criticized it. (C) is wrong — the Terror occurred during the radical phase, not the moderate Constitutional Monarchy phase. (D) is wrong — the Terror was a domestic policy of mass political execution, not a foreign policy.",
          correctChoiceId: "", orderIndex: 18,
          choices: { create: [
            { text: "Moderate republican criticism of the Jacobin radicals who were executing innocent citizens", isCorrect: false, orderIndex: 0 },
            { text: "The radical Jacobin justification for the Reign of Terror as a necessary instrument of revolutionary virtue", isCorrect: true, orderIndex: 1 },
            { text: "The Constitutional Monarchy phase of the Revolution, when the king's powers were being limited peacefully", isCorrect: false, orderIndex: 2 },
            { text: "French foreign policy justifying military campaigns against neighboring monarchies", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The French Revolution's progression from the ideals in the Declaration of the Rights of Man to the terror described by Robespierre above most directly supports which of the following historical arguments?",
          passage: "\"If the basis of popular government in time of peace is virtue, the basis of popular government during a revolution is both virtue and terror: virtue, without which terror is murderous; terror, without which virtue is powerless. The terror is nothing but justice, prompt, severe, inflexible; it is therefore an emanation of virtue.\"\n— Maximilien Robespierre, February 5, 1794",
          explanation: "Correct: (D) The trajectory from the Declaration of the Rights of Man (1789) to the Terror (1793–94) to Napoleon's dictatorship (1799) illustrates a recurring pattern in revolutionary history: that revolutions which begin with Enlightenment ideals often produce authoritarian regimes as instability escalates. Edmund Burke predicted this in 1790; later historians connected it to the Russian and Chinese revolutions. (A) is wrong — the French Revolution did produce major social changes, so it was not purely cyclical in that sense. (B) is wrong — Robespierre was not a forerunner of Napoleon; he was executed before Napoleon's coup. (C) is wrong — the Terror showed the dangers of unchecked popular sovereignty, not its virtue.",
          correctChoiceId: "", orderIndex: 19,
          choices: { create: [
            { text: "That the French Revolution was purely cyclical, returning France to the same conditions that existed before 1789", isCorrect: false, orderIndex: 0 },
            { text: "That Robespierre's Terror was a deliberate strategy to prepare France for Napoleon's eventual takeover", isCorrect: false, orderIndex: 1 },
            { text: "That popular sovereignty, once unleashed, naturally produces virtuous and stable governments", isCorrect: false, orderIndex: 2 },
            { text: "That revolutions inspired by Enlightenment ideals often produce authoritarian outcomes when revolutionary governments face internal and external threats", isCorrect: true, orderIndex: 3 },
          ]},
        },

      ]},
    },
    include: { questions: { include: { choices: true } } },
  })
  await fixCorrectChoices(quiz6)
  console.log("✓ Created quiz:", quiz6.title, `(${quiz6.questions.length} questions)`)

  // ── Quiz Bank 7: AP Literature & Composition – Multiple Choice Practice ───
  const quiz7 = await prisma.questionBank.create({
    data: {
      title: "AP Literature & Composition – Multiple Choice Practice",
      subject: "AP Literature",
      description: "Stimulus-based multiple choice questions across poetry, prose fiction, and drama. Covers tone, diction, figurative language, theme, structure, characterization, point of view, irony, and symbolism.",
      isPublic: true, ownerId: admin.id,
      questions: { create: [

        // ── PASSAGE 1: Emily Dickinson, "Because I could not stop for Death" (Qs 1–6) ──
        {
          prompt: "In line 2, the word 'kindly' is best understood as an example of which of the following?",
          passage: "Because I could not stop for Death –\nHe kindly stopped for me –\nThe Carriage held but just Ourselves –\nAnd Immortality.\n\nWe slowly drove – He knew no haste\nAnd I had put away\nMy labor and my leisure too,\nFor His Civility –\n\nWe passed the School, where Children strove\nAt Recess – in the Ring –\nWe passed the Fields of Gazing Grain –\nWe passed the Setting Sun –\n\nOr rather – He passed Us –\nThe Dews drew quivering and Chill –\nFor only Gossamer, my Gown –\nMy Tippet – only Tulle –\n\nWe paused before a House that seemed\nA Swelling of the Ground –\nThe Roof was scarcely visible –\nThe Cornice – in the Ground –\n\nSince then – 'tis Centuries – and yet\nFeels shorter than the Day\nI first surmised the Horses' Heads\nWere toward Eternity –\n\n— Emily Dickinson (c. 1863)",
          explanation: "Correct: (C) Irony. Death is not typically associated with kindness or social grace — describing it as 'kindly' subverts the reader's expectations, making Death seem courteous rather than terrifying. This ironic word choice is central to the poem's unusual personification of Death as a gentleman caller. (A) is wrong — simile requires 'like' or 'as.' (B) is wrong — alliteration involves repeated consonant sounds. (D) is wrong — hyperbole involves exaggeration.",
          correctChoiceId: "", orderIndex: 0,
          choices: { create: [
            { text: "Simile", isCorrect: false, orderIndex: 0 },
            { text: "Alliteration", isCorrect: false, orderIndex: 1 },
            { text: "Irony", isCorrect: true, orderIndex: 2 },
            { text: "Hyperbole", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The sequence 'the School… the Fields of Gazing Grain… the Setting Sun' (stanza 3) most likely represents which of the following?",
          passage: "Because I could not stop for Death –\nHe kindly stopped for me –\nThe Carriage held but just Ourselves –\nAnd Immortality.\n\nWe slowly drove – He knew no haste\nAnd I had put away\nMy labor and my leisure too,\nFor His Civility –\n\nWe passed the School, where Children strove\nAt Recess – in the Ring –\nWe passed the Fields of Gazing Grain –\nWe passed the Setting Sun –\n\nOr rather – He passed Us –\nThe Dews drew quivering and Chill –\nFor only Gossamer, my Gown –\nMy Tippet – only Tulle –\n\nWe paused before a House that seemed\nA Swelling of the Ground –\nThe Roof was scarcely visible –\nThe Cornice – in the Ground –\n\nSince then – 'tis Centuries – and yet\nFeels shorter than the Day\nI first surmised the Horses' Heads\nWere toward Eternity –\n\n— Emily Dickinson (c. 1863)",
          explanation: "Correct: (B) The sequence moves from childhood (school, play) to productive adulthood (grain fields, harvest) to old age and death (setting sun) — a compressed allegory of the entire human lifespan. The images are symbolic, not literal landmarks. (A) is wrong — these are not literal locations but symbolic stages. (C) is wrong — the seasons interpretation is secondary to the life-stages reading. (D) is wrong — the images represent the speaker's past life, not the afterlife.",
          correctChoiceId: "", orderIndex: 1,
          choices: { create: [
            { text: "Literal landmarks the carriage passes on a country road", isCorrect: false, orderIndex: 0 },
            { text: "Symbolic stages of human life from childhood through old age", isCorrect: true, orderIndex: 1 },
            { text: "The four seasons of the natural year", isCorrect: false, orderIndex: 2 },
            { text: "Stages of the afterlife the speaker is entering", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The 'House that seemed / A Swelling of the Ground' (stanza 5) is most likely a symbol for which of the following?",
          passage: "Because I could not stop for Death –\nHe kindly stopped for me –\nThe Carriage held but just Ourselves –\nAnd Immortality.\n\nWe slowly drove – He knew no haste\nAnd I had put away\nMy labor and my leisure too,\nFor His Civility –\n\nWe passed the School, where Children strove\nAt Recess – in the Ring –\nWe passed the Fields of Gazing Grain –\nWe passed the Setting Sun –\n\nOr rather – He passed Us –\nThe Dews drew quivering and Chill –\nFor only Gossamer, my Gown –\nMy Tippet – only Tulle –\n\nWe paused before a House that seemed\nA Swelling of the Ground –\nThe Roof was scarcely visible –\nThe Cornice – in the Ground –\n\nSince then – 'tis Centuries – and yet\nFeels shorter than the Day\nI first surmised the Horses' Heads\nWere toward Eternity –\n\n— Emily Dickinson (c. 1863)",
          explanation: "Correct: (A) A grave. The description of a 'house' whose roof and cornice are barely visible above ground perfectly describes a burial mound or grave. Dickinson characteristically uses domestic imagery to defamiliarize death — a grave becomes a 'house,' and eternity becomes a carriage ride. (B) is wrong — the church would be described differently. (C) is wrong — no mention of a church in this stanza. (D) is wrong — the poem moves past, not toward, a farmhouse.",
          correctChoiceId: "", orderIndex: 2,
          choices: { create: [
            { text: "A grave", isCorrect: true, orderIndex: 0 },
            { text: "A rural farmhouse the carriage passes", isCorrect: false, orderIndex: 1 },
            { text: "A chapel or place of worship", isCorrect: false, orderIndex: 2 },
            { text: "The speaker's own home that she left behind", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The primary literary device used to portray Death throughout the poem is which of the following?",
          passage: "Because I could not stop for Death –\nHe kindly stopped for me –\nThe Carriage held but just Ourselves –\nAnd Immortality.\n\nWe slowly drove – He knew no haste\nAnd I had put away\nMy labor and my leisure too,\nFor His Civility –\n\nWe passed the School, where Children strove\nAt Recess – in the Ring –\nWe passed the Fields of Gazing Grain –\nWe passed the Setting Sun –\n\nOr rather – He passed Us –\nThe Dews drew quivering and Chill –\nFor only Gossamer, my Gown –\nMy Tippet – only Tulle –\n\nWe paused before a House that seemed\nA Swelling of the Ground –\nThe Roof was scarcely visible –\nThe Cornice – in the Ground –\n\nSince then – 'tis Centuries – and yet\nFeels shorter than the Day\nI first surmised the Horses' Heads\nWere toward Eternity –\n\n— Emily Dickinson (c. 1863)",
          explanation: "Correct: (D) Personification. Death is given human attributes throughout the poem — it is a 'He' who drives a carriage, shows 'Civility,' and 'kindly' stops for the speaker. This sustained personification transforms Death into a courtly gentleman, fundamentally shaping the poem's tone as calm and even intimate rather than terrifying. (A) is wrong — metaphor is at work, but personification is the more specific and dominant device. (B) is wrong — apostrophe would require the speaker to address Death directly. (C) is wrong — synecdoche uses a part to represent a whole.",
          correctChoiceId: "", orderIndex: 3,
          choices: { create: [
            { text: "Metaphor", isCorrect: false, orderIndex: 0 },
            { text: "Apostrophe", isCorrect: false, orderIndex: 1 },
            { text: "Synecdoche", isCorrect: false, orderIndex: 2 },
            { text: "Personification", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The speaker's tone toward Death throughout the poem is best described as which of the following?",
          passage: "Because I could not stop for Death –\nHe kindly stopped for me –\nThe Carriage held but just Ourselves –\nAnd Immortality.\n\nWe slowly drove – He knew no haste\nAnd I had put away\nMy labor and my leisure too,\nFor His Civility –\n\nWe passed the School, where Children strove\nAt Recess – in the Ring –\nWe passed the Fields of Gazing Grain –\nWe passed the Setting Sun –\n\nOr rather – He passed Us –\nThe Dews drew quivering and Chill –\nFor only Gossamer, my Gown –\nMy Tippet – only Tulle –\n\nWe paused before a House that seemed\nA Swelling of the Ground –\nThe Roof was scarcely visible –\nThe Cornice – in the Ground –\n\nSince then – 'tis Centuries – and yet\nFeels shorter than the Day\nI first surmised the Horses' Heads\nWere toward Eternity –\n\n— Emily Dickinson (c. 1863)",
          explanation: "Correct: (B) Calm and accepting. The speaker does not resist Death, does not mourn, and describes the journey in measured, almost polite terms. She 'put away' her labor and leisure 'for His Civility' — she accepts the invitation willingly. The tone is remarkably tranquil given the subject matter. (A) is wrong — the speaker shows no fear or dread. (C) is wrong — there is no anger or defiance. (D) is wrong — there is no bitter regret expressed.",
          correctChoiceId: "", orderIndex: 4,
          choices: { create: [
            { text: "Fearful and resistant", isCorrect: false, orderIndex: 0 },
            { text: "Calm and accepting", isCorrect: true, orderIndex: 1 },
            { text: "Defiant and angry", isCorrect: false, orderIndex: 2 },
            { text: "Mournful and regretful", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The final stanza's claim that 'Centuries' feel 'shorter than the Day' of the speaker's death most directly contributes to which of the poem's central themes?",
          passage: "Because I could not stop for Death –\nHe kindly stopped for me –\nThe Carriage held but just Ourselves –\nAnd Immortality.\n\nWe slowly drove – He knew no haste\nAnd I had put away\nMy labor and my leisure too,\nFor His Civility –\n\nWe passed the School, where Children strove\nAt Recess – in the Ring –\nWe passed the Fields of Gazing Grain –\nWe passed the Setting Sun –\n\nOr rather – He passed Us –\nThe Dews drew quivering and Chill –\nFor only Gossamer, my Gown –\nMy Tippet – only Tulle –\n\nWe paused before a House that seemed\nA Swelling of the Ground –\nThe Roof was scarcely visible –\nThe Cornice – in the Ground –\n\nSince then – 'tis Centuries – and yet\nFeels shorter than the Day\nI first surmised the Horses' Heads\nWere toward Eternity –\n\n— Emily Dickinson (c. 1863)",
          explanation: "Correct: (C) Eternity transcends human time. The speaker — now dead for centuries — experiences eternity as paradoxically shorter than a single earthly day, suggesting that mortal time and eternal time are fundamentally incomparable. The poem closes on eternity as an unimaginable state beyond ordinary human reckoning. (A) is wrong — the poem does not treat death as a loss. (B) is wrong — regret over life is not the final note. (D) is wrong — the poem's third passenger is 'Immortality,' not a community of the dead.",
          correctChoiceId: "", orderIndex: 5,
          choices: { create: [
            { text: "Death represents an irreversible loss of earthly experience", isCorrect: false, orderIndex: 0 },
            { text: "The speaker regrets the life she left behind", isCorrect: false, orderIndex: 1 },
            { text: "Eternity exists in a dimension that transcends and defies human conceptions of time", isCorrect: true, orderIndex: 2 },
            { text: "The dead share a communal experience of timelessness", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── PASSAGE 2: F. Scott Fitzgerald, The Great Gatsby (Qs 7–12) ──
        {
          prompt: "The simile comparing Gatsby to 'one of those intricate machines that register earthquakes ten thousand miles away' (lines 4–5) most directly emphasizes which of Gatsby's qualities?",
          passage: "If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away. This responsiveness had nothing to do with that flabby impressionability which is dignified under the name of the 'creative temperament' — it was an extraordinary gift for hope, a romantic readiness such as I have not found in any other person and which it is not likely I shall ever find again. No — Gatsby turned out all right at the end; it is what preyed on Gatsby, what foul dust floated in the wake of his dreams that temporarily closed out my interest in the abortive sorrows and short-winded elations of men.\n\n— F. Scott Fitzgerald, The Great Gatsby, Chapter 1 (1925)",
          explanation: "Correct: (A) Extraordinary sensitivity and attunement. The seismograph metaphor suggests Gatsby can detect the faintest tremors of promise and opportunity at extreme distance — he is hypersensitive to possibility in a way ordinary people are not. This is presented as a form of precision, not mere emotionality. (B) is wrong — the narrator explicitly separates this quality from 'flabby impressionability.' (C) is wrong — the machine metaphor emphasizes sensitivity, not calculation or manipulation. (D) is wrong — vulnerability is not the point; the emphasis is on the acuity of his perception.",
          correctChoiceId: "", orderIndex: 6,
          choices: { create: [
            { text: "Extraordinary sensitivity to possibility and the promises of life", isCorrect: true, orderIndex: 0 },
            { text: "Emotional vulnerability and impressionability", isCorrect: false, orderIndex: 1 },
            { text: "Cold, mechanical calculation in pursuit of his goals", isCorrect: false, orderIndex: 2 },
            { text: "Physical and emotional fragility beneath his polished exterior", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The phrase 'foul dust floated in the wake of his dreams' (lines 8–9) is best described as which of the following?",
          passage: "If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away. This responsiveness had nothing to do with that flabby impressionability which is dignified under the name of the 'creative temperament' — it was an extraordinary gift for hope, a romantic readiness such as I have not found in any other person and which it is not likely I shall ever find again. No — Gatsby turned out all right at the end; it is what preyed on Gatsby, what foul dust floated in the wake of his dreams that temporarily closed out my interest in the abortive sorrows and short-winded elations of men.\n\n— F. Scott Fitzgerald, The Great Gatsby, Chapter 1 (1925)",
          explanation: "Correct: (B) A metaphor for the corrupt people and corruption that surrounded Gatsby's idealistic dreams. The 'foul dust' refers to the morally compromised world Gatsby inhabited — people like Tom and Daisy who exploited his idealism. The image uses maritime ('wake') and elemental ('dust') diction to suggest that corruption trails dreams like wake trails a ship. (A) is wrong — it is metaphorical, not literal dust. (C) is wrong — this refers to what surrounded Gatsby, not his own flaws. (D) is wrong — while alliteration is present ('foul… floated'), the primary device is metaphor.",
          correctChoiceId: "", orderIndex: 7,
          choices: { create: [
            { text: "Literal description of the pollution in the Valley of Ashes", isCorrect: false, orderIndex: 0 },
            { text: "A metaphor for the corrupt people and moral corruption that surrounded Gatsby's idealism", isCorrect: true, orderIndex: 1 },
            { text: "A symbol for Gatsby's own moral failings and dishonest means", isCorrect: false, orderIndex: 2 },
            { text: "An example of alliteration used primarily for musical effect", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The narrator's attitude toward Gatsby in this passage is best characterized as which of the following?",
          passage: "If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away. This responsiveness had nothing to do with that flabby impressionability which is dignified under the name of the 'creative temperament' — it was an extraordinary gift for hope, a romantic readiness such as I have not found in any other person and which it is not likely I shall ever find again. No — Gatsby turned out all right at the end; it is what preyed on Gatsby, what foul dust floated in the wake of his dreams that temporarily closed out my interest in the abortive sorrows and short-winded elations of men.\n\n— F. Scott Fitzgerald, The Great Gatsby, Chapter 1 (1925)",
          explanation: "Correct: (D) Admiring of Gatsby personally but critical of the corrupt world surrounding him. The narrator praises Gatsby's 'extraordinary gift for hope' and 'romantic readiness,' yet condemns 'what preyed on Gatsby' — separating the man from his environment. The phrase 'Gatsby turned out all right at the end' is a moral vindication of Gatsby himself. (A) is wrong — the narrator never condemns Gatsby. (B) is wrong — the narrator admires Gatsby, not just tolerates him. (C) is wrong — the narrator explicitly vindicates Gatsby.",
          correctChoiceId: "", orderIndex: 8,
          choices: { create: [
            { text: "Deeply critical of Gatsby's moral compromises and dishonest wealth", isCorrect: false, orderIndex: 0 },
            { text: "Neutral and detached, observing Gatsby without personal judgment", isCorrect: false, orderIndex: 1 },
            { text: "Contemptuous of Gatsby's naive idealism and romantic delusions", isCorrect: false, orderIndex: 2 },
            { text: "Admiring of Gatsby personally while condemning the corrupt world that surrounded his dreams", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The phrase 'abortive sorrows and short-winded elations of men' (lines 10–11) most directly reveals the narrator's view that human emotional life is generally which of the following?",
          passage: "If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away. This responsiveness had nothing to do with that flabby impressionability which is dignified under the name of the 'creative temperament' — it was an extraordinary gift for hope, a romantic readiness such as I have not found in any other person and which it is not likely I shall ever find again. No — Gatsby turned out all right at the end; it is what preyed on Gatsby, what foul dust floated in the wake of his dreams that temporarily closed out my interest in the abortive sorrows and short-winded elations of men.\n\n— F. Scott Fitzgerald, The Great Gatsby, Chapter 1 (1925)",
          explanation: "Correct: (A) Shallow and incomplete — both failures and joys cut short before they fully develop. 'Abortive' means cut short or incomplete; 'short-winded' means lacking stamina. Together they suggest that ordinary people's emotional experiences are brief and truncated — making Gatsby's sustained, extraordinary hope even more remarkable by contrast. (B) is wrong — the phrase is dismissive, not sympathetic. (C) is wrong — the phrase criticizes human emotion as incomplete, not excessive. (D) is wrong — the phrase is about brevity and incompleteness, not deceit.",
          correctChoiceId: "", orderIndex: 9,
          choices: { create: [
            { text: "Incomplete and short-lived, lacking the depth and duration of genuine feeling", isCorrect: true, orderIndex: 0 },
            { text: "Painfully authentic and deserving of greater sympathy than the narrator shows", isCorrect: false, orderIndex: 1 },
            { text: "Excessive and overwrought compared to Gatsby's restrained emotional intelligence", isCorrect: false, orderIndex: 2 },
            { text: "Fundamentally dishonest, as people perform emotions they do not actually feel", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The narrative perspective of this passage is best described as which of the following?",
          passage: "If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away. This responsiveness had nothing to do with that flabby impressionability which is dignified under the name of the 'creative temperament' — it was an extraordinary gift for hope, a romantic readiness such as I have not found in any other person and which it is not likely I shall ever find again. No — Gatsby turned out all right at the end; it is what preyed on Gatsby, what foul dust floated in the wake of his dreams that temporarily closed out my interest in the abortive sorrows and short-winded elations of men.\n\n— F. Scott Fitzgerald, The Great Gatsby, Chapter 1 (1925)",
          explanation: "Correct: (C) First-person retrospective. The narrator uses 'I' and refers to events that have already concluded ('I have not found… and which it is not likely I shall ever find again'), indicating he looks back on Gatsby's story from the future. This retrospective framing gives the narrator omniscience about the outcome while creating dramatic irony. (A) is wrong — third-person omniscient would use 'he' or 'she' as subject. (B) is wrong — first-person present tense would use present-tense verbs throughout. (D) is wrong — second person would address 'you.'",
          correctChoiceId: "", orderIndex: 10,
          choices: { create: [
            { text: "Third-person omniscient, with full access to all characters' thoughts", isCorrect: false, orderIndex: 0 },
            { text: "First-person present, with the narrator experiencing events as they unfold", isCorrect: false, orderIndex: 1 },
            { text: "First-person retrospective, with the narrator looking back on completed events", isCorrect: true, orderIndex: 2 },
            { text: "Second-person, directly addressing the reader as participant", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The diction of the opening sentence — 'If personality is an unbroken series of successful gestures' — most directly serves which purpose?",
          passage: "If personality is an unbroken series of successful gestures, then there was something gorgeous about him, some heightened sensitivity to the promises of life, as if he were related to one of those intricate machines that register earthquakes ten thousand miles away. This responsiveness had nothing to do with that flabby impressionability which is dignified under the name of the 'creative temperament' — it was an extraordinary gift for hope, a romantic readiness such as I have not found in any other person and which it is not likely I shall ever find again. No — Gatsby turned out all right at the end; it is what preyed on Gatsby, what foul dust floated in the wake of his dreams that temporarily closed out my interest in the abortive sorrows and short-winded elations of men.\n\n— F. Scott Fitzgerald, The Great Gatsby, Chapter 1 (1925)",
          explanation: "Correct: (B) It frames personality as performance — a series of outward gestures rather than an inner essence — establishing the novel's preoccupation with surfaces, self-invention, and the American performance of identity. The conditional 'If' introduces an ironic doubt about whether personality is authentic or theatrical. (A) is wrong — the sentence is philosophically abstract, not directly characterizing Gatsby. (C) is wrong — the narrator's own personality is not the subject. (D) is wrong — the sentence introduces doubt about identity, not celebrates Gatsby's sincerity.",
          correctChoiceId: "", orderIndex: 11,
          choices: { create: [
            { text: "To establish Gatsby as a man of genuine moral character rather than social performance", isCorrect: false, orderIndex: 0 },
            { text: "To introduce the novel's preoccupation with the theatrical, performative nature of identity", isCorrect: true, orderIndex: 1 },
            { text: "To characterize the narrator himself as someone who judges people by social success", isCorrect: false, orderIndex: 2 },
            { text: "To celebrate the American value of projecting confidence and success to others", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── PASSAGE 3: John Keats, "Ode to a Nightingale" Stanzas 7–8 (Qs 13–18) ──
        {
          prompt: "The phrase 'Thou wast not born for death, immortal Bird!' (line 1) addresses the nightingale through which literary device?",
          passage: "Thou wast not born for death, immortal Bird!\nNo hungry generations tread thee down;\nThe voice I hear this passing night was heard\nIn ancient days by emperor and clown:\nPerhaps the self-same song that found a path\nThrough the sad heart of Ruth, when, sick for home,\nShe stood in tears amid the alien corn;\nThe same that oft-times hath\nCharm'd magic casements, opening on the foam\nOf perilous seas, in faery lands forlorn.\n\nForlorn! the very word is like a bell\nTo toll me back from thee to my sole self!\nAdieu! the fancy cannot cheat so well\nAs she is fam'd to do, deceiving elf.\nAdieu! adieu! thy plaintive anthem fades\nPast the near meadows, over the still stream,\nUp the hill-side; and now 'tis buried deep\nIn the next valley-glades:\nWas it a vision, or a waking dream?\nFled is that music:—Do I wake or sleep?\n\n— John Keats, 'Ode to a Nightingale,' stanzas 7–8 (1819)",
          explanation: "Correct: (A) Apostrophe — the speaker directly addresses the nightingale ('Thou'), an entity that cannot hear or respond. Apostrophe in poetry involves addressing an absent, dead, or non-human entity as if it were present. (B) is wrong — synecdoche uses a part to represent a whole. (C) is wrong — anaphora is the repetition of a phrase at the beginning of successive lines. (D) is wrong — litotes is understatement through negation.",
          correctChoiceId: "", orderIndex: 12,
          choices: { create: [
            { text: "Apostrophe", isCorrect: true, orderIndex: 0 },
            { text: "Synecdoche", isCorrect: false, orderIndex: 1 },
            { text: "Anaphora", isCorrect: false, orderIndex: 2 },
            { text: "Litotes", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The reference to Ruth 'sick for home… amid the alien corn' (lines 6–7) is primarily an example of which of the following?",
          passage: "Thou wast not born for death, immortal Bird!\nNo hungry generations tread thee down;\nThe voice I hear this passing night was heard\nIn ancient days by emperor and clown:\nPerhaps the self-same song that found a path\nThrough the sad heart of Ruth, when, sick for home,\nShe stood in tears amid the alien corn;\nThe same that oft-times hath\nCharm'd magic casements, opening on the foam\nOf perilous seas, in faery lands forlorn.\n\nForlorn! the very word is like a bell\nTo toll me back from thee to my sole self!\nAdieu! the fancy cannot cheat so well\nAs she is fam'd to do, deceiving elf.\nAdieu! adieu! thy plaintive anthem fades\nPast the near meadows, over the still stream,\nUp the hill-side; and now 'tis buried deep\nIn the next valley-glades:\nWas it a vision, or a waking dream?\nFled is that music:—Do I wake or sleep?\n\n— John Keats, 'Ode to a Nightingale,' stanzas 7–8 (1819)",
          explanation: "Correct: (C) Allusion — the reference to Ruth is drawn from the Book of Ruth in the Bible, where Ruth the Moabite follows her mother-in-law Naomi to a foreign land ('alien corn' = foreign grain fields), homesick and lonely. Keats uses this allusion to suggest the nightingale's song has always carried across human suffering — a trans-historical consolation. (A) is wrong — pathetic fallacy attributes human emotions to nature, not to a biblical figure. (B) is wrong — metaphor makes a direct comparison without 'like' or 'as.' (D) is wrong — personification would attribute human qualities to a non-human entity.",
          correctChoiceId: "", orderIndex: 13,
          choices: { create: [
            { text: "Pathetic fallacy", isCorrect: false, orderIndex: 0 },
            { text: "Metaphor", isCorrect: false, orderIndex: 1 },
            { text: "Allusion", isCorrect: true, orderIndex: 2 },
            { text: "Personification", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The repetition of 'Forlorn!' at the opening of stanza 8 most directly serves which structural purpose?",
          passage: "Thou wast not born for death, immortal Bird!\nNo hungry generations tread thee down;\nThe voice I hear this passing night was heard\nIn ancient days by emperor and clown:\nPerhaps the self-same song that found a path\nThrough the sad heart of Ruth, when, sick for home,\nShe stood in tears amid the alien corn;\nThe same that oft-times hath\nCharm'd magic casements, opening on the foam\nOf perilous seas, in faery lands forlorn.\n\nForlorn! the very word is like a bell\nTo toll me back from thee to my sole self!\nAdieu! the fancy cannot cheat so well\nAs she is fam'd to do, deceiving elf.\nAdieu! adieu! thy plaintive anthem fades\nPast the near meadows, over the still stream,\nUp the hill-side; and now 'tis buried deep\nIn the next valley-glades:\nWas it a vision, or a waking dream?\nFled is that music:—Do I wake or sleep?\n\n— John Keats, 'Ode to a Nightingale,' stanzas 7–8 (1819)",
          explanation: "Correct: (B) The word 'forlorn' ends stanza 7 as an enchanting descriptor of fairy lands and opens stanza 8 as a brutal return to the speaker's own desolate state — the repetition acts as a hinge, pivoting the poem from imaginative transport back to painful reality. The speaker hears the word itself as 'like a bell / To toll me back… to my sole self.' (A) is wrong — this is not simply sound repetition. (C) is wrong — the word re-grounds the speaker, it does not deepen the escape. (D) is wrong — the repetition signals rupture, not climax.",
          correctChoiceId: "", orderIndex: 14,
          choices: { create: [
            { text: "It creates a musical echo effect, reinforcing the beauty of the nightingale's song", isCorrect: false, orderIndex: 0 },
            { text: "It pivots the poem from imaginative escape back to the speaker's painful reality", isCorrect: true, orderIndex: 1 },
            { text: "It deepens the speaker's immersion in the imagined fairy world", isCorrect: false, orderIndex: 2 },
            { text: "It signals the poem's emotional climax before a peaceful resolution", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The lines 'the fancy cannot cheat so well / As she is fam'd to do' suggest that the speaker has come to which realization?",
          passage: "Thou wast not born for death, immortal Bird!\nNo hungry generations tread thee down;\nThe voice I hear this passing night was heard\nIn ancient days by emperor and clown:\nPerhaps the self-same song that found a path\nThrough the sad heart of Ruth, when, sick for home,\nShe stood in tears amid the alien corn;\nThe same that oft-times hath\nCharm'd magic casements, opening on the foam\nOf perilous seas, in faery lands forlorn.\n\nForlorn! the very word is like a bell\nTo toll me back from thee to my sole self!\nAdieu! the fancy cannot cheat so well\nAs she is fam'd to do, deceiving elf.\nAdieu! adieu! thy plaintive anthem fades\nPast the near meadows, over the still stream,\nUp the hill-side; and now 'tis buried deep\nIn the next valley-glades:\nWas it a vision, or a waking dream?\nFled is that music:—Do I wake or sleep?\n\n— John Keats, 'Ode to a Nightingale,' stanzas 7–8 (1819)",
          explanation: "Correct: (D) The imagination cannot provide lasting escape from mortality and suffering. 'Fancy' (imagination/creative fancy) is called a 'deceiving elf' — it promises transport and transcendence but ultimately fails to sustain it. The speaker is returned to his 'sole self' despite imagination's supposed power. (A) is wrong — the speaker laments this failure, not celebrates it. (B) is wrong — imagination is not condemned as morally wrong, only insufficient. (C) is wrong — the speaker tried to use imagination for transport and finds it limited.",
          correctChoiceId: "", orderIndex: 15,
          choices: { create: [
            { text: "The imagination is most powerful when directed toward nature rather than myth", isCorrect: false, orderIndex: 0 },
            { text: "Poetic imagination is morally suspect because it deceives the mind", isCorrect: false, orderIndex: 1 },
            { text: "The nightingale's song was never as beautiful as the speaker first believed", isCorrect: false, orderIndex: 2 },
            { text: "The imagination cannot provide lasting escape from the pain of mortal existence", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The contrast between the nightingale described as 'immortal' (stanza 7) and the speaker who experiences 'hungry generations' treading him down most directly creates which central tension?",
          passage: "Thou wast not born for death, immortal Bird!\nNo hungry generations tread thee down;\nThe voice I hear this passing night was heard\nIn ancient days by emperor and clown:\nPerhaps the self-same song that found a path\nThrough the sad heart of Ruth, when, sick for home,\nShe stood in tears amid the alien corn;\nThe same that oft-times hath\nCharm'd magic casements, opening on the foam\nOf perilous seas, in faery lands forlorn.\n\nForlorn! the very word is like a bell\nTo toll me back from thee to my sole self!\nAdieu! the fancy cannot cheat so well\nAs she is fam'd to do, deceiving elf.\nAdieu! adieu! thy plaintive anthem fades\nPast the near meadows, over the still stream,\nUp the hill-side; and now 'tis buried deep\nIn the next valley-glades:\nWas it a vision, or a waking dream?\nFled is that music:—Do I wake or sleep?\n\n— John Keats, 'Ode to a Nightingale,' stanzas 7–8 (1819)",
          explanation: "Correct: (A) The immortality of art/nature versus human mortality. The nightingale's song persists across centuries — heard by Ruth, by emperors and clowns — while individual human beings live briefly and suffer. Art (the song) endures; the person listening does not. This is the ode's central Romantic preoccupation. (B) is wrong — the speaker is not physically in nature; the tension is metaphysical. (C) is wrong — the poem does not pit reason against emotion. (D) is wrong — the nightingale's freedom vs. the speaker's confinement is a secondary theme, not the primary structural contrast.",
          correctChoiceId: "", orderIndex: 16,
          choices: { create: [
            { text: "The immortality of art and nature versus the brevity and suffering of mortal human experience", isCorrect: true, orderIndex: 0 },
            { text: "Rural natural life versus the corrupting influence of urban civilization", isCorrect: false, orderIndex: 1 },
            { text: "The conflict between rational thought and emotional feeling", isCorrect: false, orderIndex: 2 },
            { text: "The freedom of the bird versus the social confinement of the human speaker", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The closing question, 'Was it a vision, or a waking dream? / Fled is that music:—Do I wake or sleep?' most directly expresses which of the following themes?",
          passage: "Thou wast not born for death, immortal Bird!\nNo hungry generations tread thee down;\nThe voice I hear this passing night was heard\nIn ancient days by emperor and clown:\nPerhaps the self-same song that found a path\nThrough the sad heart of Ruth, when, sick for home,\nShe stood in tears amid the alien corn;\nThe same that oft-times hath\nCharm'd magic casements, opening on the foam\nOf perilous seas, in faery lands forlorn.\n\nForlorn! the very word is like a bell\nTo toll me back from thee to my sole self!\nAdieu! the fancy cannot cheat so well\nAs she is fam'd to do, deceiving elf.\nAdieu! adieu! thy plaintive anthem fades\nPast the near meadows, over the still stream,\nUp the hill-side; and now 'tis buried deep\nIn the next valley-glades:\nWas it a vision, or a waking dream?\nFled is that music:—Do I wake or sleep?\n\n— John Keats, 'Ode to a Nightingale,' stanzas 7–8 (1819)",
          explanation: "Correct: (C) The blurred boundary between imaginative experience and waking reality. The speaker cannot determine whether his transport to the nightingale's world was a real vision, a poetic fantasy, or ordinary waking perception — the experience of beauty has made ordinary consciousness feel uncertain. The questions are left unanswered, enacting the theme rather than resolving it. (A) is wrong — the speaker has returned to his self; the confusion is about the nature of what just happened. (B) is wrong — the poem ends in uncertainty, not despair. (D) is wrong — the bird is gone; the question is about the nature of the preceding experience.",
          correctChoiceId: "", orderIndex: 17,
          choices: { create: [
            { text: "The speaker's inability to distinguish between the nightingale and his own imagination", isCorrect: false, orderIndex: 0 },
            { text: "The speaker's despair at being permanently separated from beauty and transcendence", isCorrect: false, orderIndex: 1 },
            { text: "The ambiguous boundary between imaginative transport and waking reality after intense aesthetic experience", isCorrect: true, orderIndex: 2 },
            { text: "The speaker's uncertainty about whether the nightingale is still present or has departed", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── PASSAGE 4: Kate Chopin, "The Story of an Hour" (Qs 19–24) ──
        {
          prompt: "The phrase 'monstrous joy' (line 1) is best understood as an example of which of the following?",
          passage: "She did not stop to ask if it were or were not a monstrous joy that held her. A clear and exalted perception enabled her to dismiss the suggestion as trivial. She knew that she would weep again when she saw the kind, tender hands folded in death; the face that had never looked save with love upon her, fixed and gray and dead. But she saw beyond that bitter moment a long procession of years to come that would belong to her absolutely. And she opened and spread her arms out to them in welcome.\n\nThere would be no one to live for during those coming years; she would live for herself. There was a wild abandonment in the thought of it. What did it matter! What could love, the unsolved mystery, count for in the face of this possession of self-assertion which she suddenly recognized as the strongest impulse of her being!\n\n— Kate Chopin, 'The Story of an Hour' (1894)",
          explanation: "Correct: (B) Oxymoron — 'monstrous' (terrible, unnatural) combined with 'joy' (happiness, delight) creates a self-contradictory phrase that captures the protagonist's morally troubling yet genuine emotion. She knows this joy is socially unacceptable (a wife should grieve, not rejoice), yet she cannot deny the feeling's reality. (A) is wrong — euphemism softens or avoids a harsh reality; this phrase makes the feeling harsher, not softer. (C) is wrong — synesthesia blends different senses. (D) is wrong — understatement minimizes; 'monstrous joy' is emphatic.",
          correctChoiceId: "", orderIndex: 18,
          choices: { create: [
            { text: "Euphemism", isCorrect: false, orderIndex: 0 },
            { text: "Oxymoron", isCorrect: true, orderIndex: 1 },
            { text: "Synesthesia", isCorrect: false, orderIndex: 2 },
            { text: "Understatement", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The description of 'a long procession of years to come that would belong to her absolutely' most directly reveals which of the following about the protagonist?",
          passage: "She did not stop to ask if it were or were not a monstrous joy that held her. A clear and exalted perception enabled her to dismiss the suggestion as trivial. She knew that she would weep again when she saw the kind, tender hands folded in death; the face that had never looked save with love upon her, fixed and gray and dead. But she saw beyond that bitter moment a long procession of years to come that would belong to her absolutely. And she opened and spread her arms out to them in welcome.\n\nThere would be no one to live for during those coming years; she would live for herself. There was a wild abandonment in the thought of it. What did it matter! What could love, the unsolved mystery, count for in the face of this possession of self-assertion which she suddenly recognized as the strongest impulse of her being!\n\n— Kate Chopin, 'The Story of an Hour' (1894)",
          explanation: "Correct: (A) Her marriage had constrained her autonomy and sense of self, making freedom — not grief — her primary emotional response to news of her husband's death. The years 'belong to her absolutely' implies that previously they did not belong to her — they belonged to the institution of marriage. (B) is wrong — the passage acknowledges her husband was loving ('kind, tender hands… never looked save with love'), so she is not relieved to escape cruelty. (C) is wrong — she has genuine emotion, not calculated indifference. (D) is wrong — she is not confused; she has 'a clear and exalted perception.'",
          correctChoiceId: "", orderIndex: 19,
          choices: { create: [
            { text: "Her marriage had suppressed her autonomy, making freedom more powerful than grief at her husband's death", isCorrect: true, orderIndex: 0 },
            { text: "She had been secretly miserable in a cruel, loveless marriage", isCorrect: false, orderIndex: 1 },
            { text: "She had never loved her husband and viewed the marriage as a financial arrangement", isCorrect: false, orderIndex: 2 },
            { text: "She is too shocked by the news to process her grief and mistakes numbness for liberation", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The narrator's description of the husband as having 'kind, tender hands' and a face 'that had never looked save with love upon her' most directly serves which purpose?",
          passage: "She did not stop to ask if it were or were not a monstrous joy that held her. A clear and exalted perception enabled her to dismiss the suggestion as trivial. She knew that she would weep again when she saw the kind, tender hands folded in death; the face that had never looked save with love upon her, fixed and gray and dead. But she saw beyond that bitter moment a long procession of years to come that would belong to her absolutely. And she opened and spread her arms out to them in welcome.\n\nThere would be no one to live for during those coming years; she would live for herself. There was a wild abandonment in the thought of it. What did it matter! What could love, the unsolved mystery, count for in the face of this possession of self-assertion which she suddenly recognized as the strongest impulse of her being!\n\n— Kate Chopin, 'The Story of an Hour' (1894)",
          explanation: "Correct: (C) Intensifying the story's thematic irony — a kind, loving husband is not enough to satisfy a woman's need for self-determination. The protagonist's joy is not relief from cruelty but a deeper claim: that even a good marriage can suppress individual identity. This makes Chopin's feminist critique more radical than a simple condemnation of a bad marriage. (A) is wrong — the description makes her joy more morally complex, not excuses it. (B) is wrong — the contrast makes the joy more ambiguous. (D) is wrong — the description humanizes the husband, not diminishes her liberation.",
          correctChoiceId: "", orderIndex: 20,
          choices: { create: [
            { text: "To justify the protagonist's joy by showing that mourning a cruel husband is unnecessary", isCorrect: false, orderIndex: 0 },
            { text: "To contrast a good man against the protagonist's selfishness, criticizing her emotional response", isCorrect: false, orderIndex: 1 },
            { text: "To deepen the story's irony: even a loving marriage can suppress a woman's need for self-determination", isCorrect: true, orderIndex: 2 },
            { text: "To establish the protagonist as so devoted to her husband that her joy must be delusion rather than genuine feeling", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The phrase 'self-assertion which she suddenly recognized as the strongest impulse of her being' most directly functions as which of the following?",
          passage: "She did not stop to ask if it were or were not a monstrous joy that held her. A clear and exalted perception enabled her to dismiss the suggestion as trivial. She knew that she would weep again when she saw the kind, tender hands folded in death; the face that had never looked save with love upon her, fixed and gray and dead. But she saw beyond that bitter moment a long procession of years to come that would belong to her absolutely. And she opened and spread her arms out to them in welcome.\n\nThere would be no one to live for during those coming years; she would live for herself. There was a wild abandonment in the thought of it. What did it matter! What could love, the unsolved mystery, count for in the face of this possession of self-assertion which she suddenly recognized as the strongest impulse of her being!\n\n— Kate Chopin, 'The Story of an Hour' (1894)",
          explanation: "Correct: (D) The thematic climax — the story's central argument made explicit. The protagonist discovers that even love is subordinate to the deeper human need for selfhood and autonomy. Chopin positions this 'sudden recognition' as a moment of genuine psychological truth, not selfishness. The word 'suddenly' emphasizes that this truth had been suppressed within her for years. (A) is wrong — the narrative moves toward resolution, not complication. (B) is wrong — the moment is portrayed as authentic, not self-deception. (C) is wrong — this directly addresses the theme of marriage and freedom.",
          correctChoiceId: "", orderIndex: 21,
          choices: { create: [
            { text: "A narrative complication that raises new questions about the protagonist's reliability", isCorrect: false, orderIndex: 0 },
            { text: "An ironic moment revealing that the protagonist's 'liberation' is in fact self-deception", isCorrect: false, orderIndex: 1 },
            { text: "A digression from the story's central concern with marital grief", isCorrect: false, orderIndex: 2 },
            { text: "The story's thematic climax: the claim that the impulse toward selfhood surpasses even love", isCorrect: true, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The technique of presenting the protagonist's interior thoughts directly, blended with the narrator's voice — as in 'What did it matter!' — is best described as which of the following?",
          passage: "She did not stop to ask if it were or were not a monstrous joy that held her. A clear and exalted perception enabled her to dismiss the suggestion as trivial. She knew that she would weep again when she saw the kind, tender hands folded in death; the face that had never looked save with love upon her, fixed and gray and dead. But she saw beyond that bitter moment a long procession of years to come that would belong to her absolutely. And she opened and spread her arms out to them in welcome.\n\nThere would be no one to live for during those coming years; she would live for herself. There was a wild abandonment in the thought of it. What did it matter! What could love, the unsolved mystery, count for in the face of this possession of self-assertion which she suddenly recognized as the strongest impulse of her being!\n\n— Kate Chopin, 'The Story of an Hour' (1894)",
          explanation: "Correct: (B) Free indirect discourse — a technique where the narrator's voice blends with the character's inner voice without quotation marks or 'she thought that.' The exclamation 'What did it matter!' reads as the protagonist's own thought in her own emotional register, not as neutral narration. This creates intimacy with her inner life while maintaining third-person narration. (A) is wrong — stream of consciousness is a more extreme, unfiltered flow of thought. (C) is wrong — dramatic monologue is a poem form. (D) is wrong — omniscient commentary would judge or explain, not inhabit the character's voice.",
          correctChoiceId: "", orderIndex: 22,
          choices: { create: [
            { text: "Stream of consciousness", isCorrect: false, orderIndex: 0 },
            { text: "Free indirect discourse", isCorrect: true, orderIndex: 1 },
            { text: "Dramatic monologue", isCorrect: false, orderIndex: 2 },
            { text: "Omniscient editorial commentary", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The central irony of the story as a whole — only partially glimpsed in this passage — depends most upon which of the following situations?",
          passage: "She did not stop to ask if it were or were not a monstrous joy that held her. A clear and exalted perception enabled her to dismiss the suggestion as trivial. She knew that she would weep again when she saw the kind, tender hands folded in death; the face that had never looked save with love upon her, fixed and gray and dead. But she saw beyond that bitter moment a long procession of years to come that would belong to her absolutely. And she opened and spread her arms out to them in welcome.\n\nThere would be no one to live for during those coming years; she would live for herself. There was a wild abandonment in the thought of it. What did it matter! What could love, the unsolved mystery, count for in the face of this possession of self-assertion which she suddenly recognized as the strongest impulse of her being!\n\n— Kate Chopin, 'The Story of an Hour' (1894)",
          explanation: "Correct: (A) The husband is not actually dead — he returns alive, and the protagonist, who has just fully embraced her imagined freedom, dies of the shock. The doctors call it 'joy that kills' — ironically attributing her death to the opposite of its true cause. The protagonist dies not of joy at seeing her husband, but of the annihilation of the freedom she had allowed herself to feel. (B) is wrong — the husband was never actually dead. (C) is wrong — the protagonist does not go mad. (D) is wrong — the irony is situational, not merely verbal.",
          correctChoiceId: "", orderIndex: 23,
          choices: { create: [
            { text: "The husband returns alive, and the protagonist — whose heart had soared with freedom — dies at the sight of him, her liberation instantly revoked", isCorrect: true, orderIndex: 0 },
            { text: "The husband's death is eventually revealed to have been a deliberate lie told to protect her from more terrible news", isCorrect: false, orderIndex: 1 },
            { text: "The protagonist gradually goes mad with grief, revealing that her 'joy' was a symptom of breakdown", isCorrect: false, orderIndex: 2 },
            { text: "The story's irony is entirely verbal, contained within this passage's use of 'monstrous joy'", isCorrect: false, orderIndex: 3 },
          ]},
        },

        // ── PASSAGE 5: Shakespeare, Hamlet, Act III Scene 1 – "To be, or not to be" (Qs 25–30) ──
        {
          prompt: "The phrase 'slings and arrows of outrageous fortune' (line 3) employs which of the following literary devices?",
          passage: "To be, or not to be, that is the question:\nWhether 'tis nobler in the mind to suffer\nThe slings and arrows of outrageous fortune,\nOr to take arms against a sea of troubles\nAnd by opposing end them. To die—to sleep,\nNo more; and by a sleep to say we end\nThe heartache and the thousand natural shocks\nThat flesh is heir to: 'tis a consummation\nDevoutly to be wish'd. To die, to sleep;\nTo sleep, perchance to dream—ay, there's the rub:\nFor in that sleep of death what dreams may come\nWhen we have shuffled off this mortal coil\nMust give us pause—there's the respect\nThat makes calamity of so long life.\n\n— William Shakespeare, Hamlet, Act III, Scene 1 (c. 1600–1601)",
          explanation: "Correct: (C) Metaphor — life's troubles ('fortune') are compared to weapons ('slings and arrows') without using 'like' or 'as.' The comparison is direct and implicit. The extension of this military metaphor continues in line 4 ('take arms against a sea of troubles'), creating an extended metaphor of battle throughout the passage. (A) is wrong — simile requires 'like' or 'as.' (B) is wrong — there is no direct address to an absent entity. (D) is wrong — onomatopoeia uses words that sound like their meaning.",
          correctChoiceId: "", orderIndex: 24,
          choices: { create: [
            { text: "Simile", isCorrect: false, orderIndex: 0 },
            { text: "Apostrophe", isCorrect: false, orderIndex: 1 },
            { text: "Metaphor", isCorrect: true, orderIndex: 2 },
            { text: "Onomatopoeia", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The extended comparison of death to sleep ('To die—to sleep… To sleep, perchance to dream') primarily serves which purpose in the soliloquy?",
          passage: "To be, or not to be, that is the question:\nWhether 'tis nobler in the mind to suffer\nThe slings and arrows of outrageous fortune,\nOr to take arms against a sea of troubles\nAnd by opposing end them. To die—to sleep,\nNo more; and by a sleep to say we end\nThe heartache and the thousand natural shocks\nThat flesh is heir to: 'tis a consummation\nDevoutly to be wish'd. To die, to sleep;\nTo sleep, perchance to dream—ay, there's the rub:\nFor in that sleep of death what dreams may come\nWhen we have shuffled off this mortal coil\nMust give us pause—there's the respect\nThat makes calamity of so long life.\n\n— William Shakespeare, Hamlet, Act III, Scene 1 (c. 1600–1601)",
          explanation: "Correct: (B) To explore — and ultimately complicate — the appeal of death as an escape from suffering. Death as 'sleep' initially seems desirable (a 'consummation / Devoutly to be wish'd'), but the possibility of dreams in that sleep introduces uncertainty: what if the afterlife continues or worsens suffering? The comparison both tempts and terrifies Hamlet. (A) is wrong — the comparison makes death attractive initially, then problematizes it. (C) is wrong — the religious element (devoutly, mortal coil) is present but secondary. (D) is wrong — Hamlet is not romanticizing sleep; he is reasoning about death.",
          correctChoiceId: "", orderIndex: 25,
          choices: { create: [
            { text: "To make death seem appealing and thereby justify Hamlet's decision to act", isCorrect: false, orderIndex: 0 },
            { text: "To explore the appeal of death as escape while introducing the uncertainty that prevents Hamlet from choosing it", isCorrect: true, orderIndex: 1 },
            { text: "To establish the Christian context of the soliloquy, grounding Hamlet's deliberation in theology", isCorrect: false, orderIndex: 2 },
            { text: "To contrast Hamlet's poetic sensibility with his incapacity for decisive action", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The phrase 'shuffled off this mortal coil' (line 12) is best understood as an example of which of the following?",
          passage: "To be, or not to be, that is the question:\nWhether 'tis nobler in the mind to suffer\nThe slings and arrows of outrageous fortune,\nOr to take arms against a sea of troubles\nAnd by opposing end them. To die—to sleep,\nNo more; and by a sleep to say we end\nThe heartache and the thousand natural shocks\nThat flesh is heir to: 'tis a consummation\nDevoutly to be wish'd. To die, to sleep;\nTo sleep, perchance to dream—ay, there's the rub:\nFor in that sleep of death what dreams may come\nWhen we have shuffled off this mortal coil\nMust give us pause—there's the respect\nThat makes calamity of so long life.\n\n— William Shakespeare, Hamlet, Act III, Scene 1 (c. 1600–1601)",
          explanation: "Correct: (A) Euphemism — 'shuffled off this mortal coil' is an indirect, figurative way of saying 'died.' 'Coil' in Elizabethan usage meant turmoil or bustle (life's fuss and activity); 'shuffled off' suggests shedding it like a garment. The phrase avoids direct reference to death, softening it with figurative language. (B) is wrong — chiasmus is a rhetorical figure in which words or structures are reversed. (C) is wrong — zeugma joins multiple elements with a single verb in surprising ways. (D) is wrong — anaphora is the repetition of a word or phrase at the beginning of successive clauses.",
          correctChoiceId: "", orderIndex: 26,
          choices: { create: [
            { text: "Euphemism", isCorrect: true, orderIndex: 0 },
            { text: "Chiasmus", isCorrect: false, orderIndex: 1 },
            { text: "Zeugma", isCorrect: false, orderIndex: 2 },
            { text: "Anaphora", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "When Hamlet says 'ay, there's the rub' (line 10), the word 'rub' most directly indicates which of the following?",
          passage: "To be, or not to be, that is the question:\nWhether 'tis nobler in the mind to suffer\nThe slings and arrows of outrageous fortune,\nOr to take arms against a sea of troubles\nAnd by opposing end them. To die—to sleep,\nNo more; and by a sleep to say we end\nThe heartache and the thousand natural shocks\nThat flesh is heir to: 'tis a consummation\nDevoutly to be wish'd. To die, to sleep;\nTo sleep, perchance to dream—ay, there's the rub:\nFor in that sleep of death what dreams may come\nWhen we have shuffled off this mortal coil\nMust give us pause—there's the respect\nThat makes calamity of so long life.\n\n— William Shakespeare, Hamlet, Act III, Scene 1 (c. 1600–1601)",
          explanation: "Correct: (C) The obstacle or difficulty — in Elizabethan bowls ('rub' = an obstacle on the green that deflects the ball), a 'rub' is the impediment to a smooth path. Hamlet uses it to mean the critical complication: death looks appealing as escape, but the unknown 'dreams' of the afterlife are the obstacle that prevents him from choosing it. (A) is wrong — the context shows this introduces the problem, not confirms a plan. (B) is wrong — 'rub' means obstacle, not physical pain. (D) is wrong — the word signals the complication, not resolution of the argument.",
          correctChoiceId: "", orderIndex: 27,
          choices: { create: [
            { text: "The confirmation that Hamlet has decided to take action against his enemies", isCorrect: false, orderIndex: 0 },
            { text: "The physical pain that makes life difficult to bear", isCorrect: false, orderIndex: 1 },
            { text: "The critical obstacle or difficulty — the uncertainty about what follows death — that prevents a clear choice", isCorrect: true, orderIndex: 2 },
            { text: "The resolution of Hamlet's internal conflict through philosophical reasoning", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The structure of the soliloquy's opening — 'To be, or not to be, that is the question: / Whether 'tis nobler…' — establishes the passage primarily as which of the following?",
          passage: "To be, or not to be, that is the question:\nWhether 'tis nobler in the mind to suffer\nThe slings and arrows of outrageous fortune,\nOr to take arms against a sea of troubles\nAnd by opposing end them. To die—to sleep,\nNo more; and by a sleep to say we end\nThe heartache and the thousand natural shocks\nThat flesh is heir to: 'tis a consummation\nDevoutly to be wish'd. To die, to sleep;\nTo sleep, perchance to dream—ay, there's the rub:\nFor in that sleep of death what dreams may come\nWhen we have shuffled off this mortal coil\nMust give us pause—there's the respect\nThat makes calamity of so long life.\n\n— William Shakespeare, Hamlet, Act III, Scene 1 (c. 1600–1601)",
          explanation: "Correct: (B) Deliberative rhetoric — the systematic weighing of two courses of action (to live and endure or to die and end suffering) before an argument is made. Hamlet frames this explicitly as a 'question' with two alternatives ('to be, or not to be'; 'Whether 'tis nobler… Or to take arms'). The structure is of classical deliberative oratory applied to an existential choice. (A) is wrong — an elegy mourns a specific person's death. (C) is wrong — a confession implies guilt; Hamlet is philosophizing, not confessing. (D) is wrong — a dramatic aside is a brief remark aside to the audience, not an extended philosophical argument.",
          correctChoiceId: "", orderIndex: 28,
          choices: { create: [
            { text: "An elegy mourning the loss of human innocence", isCorrect: false, orderIndex: 0 },
            { text: "Deliberative rhetoric systematically weighing two opposing courses of action", isCorrect: true, orderIndex: 1 },
            { text: "A dramatic confession revealing Hamlet's guilt", isCorrect: false, orderIndex: 2 },
            { text: "A dramatic aside commenting on action happening elsewhere on stage", isCorrect: false, orderIndex: 3 },
          ]},
        },
        {
          prompt: "The overall tone of the soliloquy is best described as which of the following?",
          passage: "To be, or not to be, that is the question:\nWhether 'tis nobler in the mind to suffer\nThe slings and arrows of outrageous fortune,\nOr to take arms against a sea of troubles\nAnd by opposing end them. To die—to sleep,\nNo more; and by a sleep to say we end\nThe heartache and the thousand natural shocks\nThat flesh is heir to: 'tis a consummation\nDevoutly to be wish'd. To die, to sleep;\nTo sleep, perchance to dream—ay, there's the rub:\nFor in that sleep of death what dreams may come\nWhen we have shuffled off this mortal coil\nMust give us pause—there's the respect\nThat makes calamity of so long life.\n\n— William Shakespeare, Hamlet, Act III, Scene 1 (c. 1600–1601)",
          explanation: "Correct: (D) Contemplative and philosophically uncertain. Hamlet moves methodically through an argument, pauses at each complication ('ay, there's the rub'), and reaches no resolution — ending in irresolution ('makes calamity of so long life'). The tone is not passionate or angry but measured, ruminative, and unresolved. (A) is wrong — the soliloquy is measured and reflective, not furious. (B) is wrong — there is no hope or optimism in the passage. (C) is wrong — Hamlet is deeply troubled, not serene.",
          correctChoiceId: "", orderIndex: 29,
          choices: { create: [
            { text: "Furious and anguished", isCorrect: false, orderIndex: 0 },
            { text: "Hopeful and resolved", isCorrect: false, orderIndex: 1 },
            { text: "Serene and accepting", isCorrect: false, orderIndex: 2 },
            { text: "Contemplative and philosophically uncertain, reaching no resolution", isCorrect: true, orderIndex: 3 },
          ]},
        },

      ]},
    },
    include: { questions: { include: { choices: true } } },
  })
  await fixCorrectChoices(quiz7)
  console.log("✓ Created quiz:", quiz7.title, `(${quiz7.questions.length} questions)`)

  console.log("\n✨ Database seeded successfully!")
  console.log("\nCredentials:")
  console.log("  Admin: admin@example.com / admin123")
  console.log("  Demo:  demo@example.com / password123")
}

main()
  .catch((e) => { console.error("Error seeding database:", e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
