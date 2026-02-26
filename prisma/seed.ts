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

  console.log("\n✨ Database seeded successfully!")
  console.log("\nCredentials:")
  console.log("  Admin: admin@example.com / admin123")
  console.log("  Demo:  demo@example.com / password123")
}

main()
  .catch((e) => { console.error("Error seeding database:", e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
