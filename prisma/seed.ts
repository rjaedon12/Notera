import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import fs from "fs"
import path from "path"

const prisma = new PrismaClient()

// ── CSV helpers ──────────────────────────────────────────

/** RFC 4180-compliant CSV line parser — handles quoted fields with commas */
function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let i = 0
  const len = line.length

  while (i < len) {
    while (i < len && (line[i] === " " || line[i] === "\t")) i++
    if (i >= len) { fields.push(""); break }

    if (line[i] === '"') {
      i++
      let value = ""
      while (i < len) {
        if (line[i] === '"') {
          if (i + 1 < len && line[i + 1] === '"') { value += '"'; i += 2 }
          else { i++; break }
        } else { value += line[i]; i++ }
      }
      fields.push(value)
      while (i < len && line[i] !== ",") i++
      if (i < len) i++
    } else {
      let value = ""
      while (i < len && line[i] !== ",") { value += line[i]; i++ }
      fields.push(value.trim())
      if (i < len) i++
    }
  }
  return fields
}

function parseCSV(filePath: string): { term: string; definition: string }[] {
  const raw = fs.readFileSync(filePath, "utf-8").trim()
  const lines = raw.split(/\r?\n/).filter((l) => l.trim())

  // Detect & skip header row
  const firstLine = lines[0].toLowerCase()
  const headerWords = ["english", "chinese", "pinyin", "term", "definition", "latin", "front", "back"]
  const isHeader = headerWords.some((w) => firstLine.includes(w))

  const dataLines = isHeader ? lines.slice(1) : lines
  const cards: { term: string; definition: string }[] = []

  for (const line of dataLines) {
    const fields = parseCSVLine(line)
    if (fields.length < 2) continue

    const term = fields[0].trim()
    const definition = fields.slice(1).join(", ").trim()

    if (term && definition) {
      cards.push({ term, definition })
    }
  }
  return cards
}

interface SetMeta { title: string; description: string; categorySlug: string }

function getSetMeta(filename: string): SetMeta {
  const map: Record<string, SetMeta> = {
    "latin_1_vocab.csv": { title: "Latin Vocabulary I", description: "First-year Latin vocabulary — nouns, verbs, and adjectives with declension/conjugation info", categorySlug: "latin-vocabulary" },
    "latin_deponents.csv": { title: "Latin Deponent Verbs", description: "Latin deponent verbs — passive in form, active in meaning — with principal parts", categorySlug: "latin-grammar" },
    "ap_mandarin_vocabulary_2_columns.csv": { title: "AP Mandarin — Full Vocabulary", description: "Comprehensive AP Chinese vocabulary list with pinyin and English translations", categorySlug: "chinese-vocabulary" },
    "basic_01_school_education.csv": { title: "Chinese Basics — School & Education", description: "Essential Chinese vocabulary for school and education topics", categorySlug: "chinese-vocabulary" },
    "basic_02_body_health.csv": { title: "Chinese Basics — Body & Health", description: "Essential Chinese vocabulary for body parts and health topics", categorySlug: "chinese-vocabulary" },
    "basic_03_food_drink.csv": { title: "Chinese Basics — Food & Drink", description: "Essential Chinese vocabulary for food and beverages", categorySlug: "chinese-vocabulary" },
    "basic_04_travel_transport.csv": { title: "Chinese Basics — Travel & Transport", description: "Essential Chinese vocabulary for travel and transportation", categorySlug: "chinese-vocabulary" },
    "basic_05_home_daily_life.csv": { title: "Chinese Basics — Home & Daily Life", description: "Essential Chinese vocabulary for home and daily routines", categorySlug: "chinese-vocabulary" },
    "basic_06_nature_animals.csv": { title: "Chinese Basics — Nature & Animals", description: "Essential Chinese vocabulary for nature and animals", categorySlug: "chinese-vocabulary" },
    "basic_07_people_relationships.csv": { title: "Chinese Basics — People & Relationships", description: "Essential Chinese vocabulary for people and relationships", categorySlug: "chinese-vocabulary" },
    "basic_08_emotions_personality.csv": { title: "Chinese Basics — Emotions & Personality", description: "Essential Chinese vocabulary for emotions and personality traits", categorySlug: "chinese-vocabulary" },
    "basic_09_work_society_culture.csv": { title: "Chinese Basics — Work, Society & Culture", description: "Essential Chinese vocabulary for work and cultural topics", categorySlug: "chinese-vocabulary" },
    "basic_10_key_verbs_grammar.csv": { title: "Chinese Basics — Key Verbs & Grammar", description: "Essential Chinese verbs and grammar patterns", categorySlug: "chinese-grammar" },
    "category_action_verbs_and_descriptions.csv": { title: "Chinese — Action Verbs & Descriptions", description: "Chinese action verbs and descriptive vocabulary", categorySlug: "chinese-vocabulary" },
    "category_education_and_school.csv": { title: "Chinese — Education & School", description: "Chinese vocabulary for education and school settings", categorySlug: "chinese-vocabulary" },
    "category_feelings_and_emotions.csv": { title: "Chinese — Feelings & Emotions", description: "Chinese vocabulary for expressing feelings and emotions", categorySlug: "chinese-vocabulary" },
    "category_food_health_and_living.csv": { title: "Chinese — Food, Health & Living", description: "Chinese vocabulary for food, health, and daily living", categorySlug: "chinese-vocabulary" },
    "category_recreation_sports_and_arts.csv": { title: "Chinese — Recreation, Sports & Arts", description: "Chinese vocabulary for recreation, sports, and the arts", categorySlug: "chinese-vocabulary" },
    "category_social_and_relationships.csv": { title: "Chinese — Social & Relationships", description: "Chinese vocabulary for social interactions and relationships", categorySlug: "chinese-vocabulary" },
    "category_time_and_frequency.csv": { title: "Chinese — Time & Frequency", description: "Chinese vocabulary for time expressions and frequency words", categorySlug: "chinese-vocabulary" },
    "category_traditions_and_history.csv": { title: "Chinese — Traditions & History", description: "Chinese vocabulary for traditions, history, and cultural heritage", categorySlug: "chinese-vocabulary" },
    "category_travel_and_geography.csv": { title: "Chinese — Travel & Geography", description: "Chinese vocabulary for travel and geography topics", categorySlug: "chinese-vocabulary" },
    "category_work_and_business.csv": { title: "Chinese — Work & Business", description: "Chinese vocabulary for work and business settings", categorySlug: "chinese-vocabulary" },
    "common_verbs_and_descriptions.csv": { title: "Chinese — Common Verbs & Descriptions", description: "Frequently used Chinese verbs and descriptions", categorySlug: "chinese-vocabulary" },
    "education_and_academia.csv": { title: "Chinese — Education & Academia", description: "Chinese vocabulary for academic and educational topics", categorySlug: "chinese-vocabulary" },
    "feelings_and_thoughts.csv": { title: "Chinese — Feelings & Thoughts", description: "Chinese vocabulary for expressing feelings and thoughts", categorySlug: "chinese-vocabulary" },
    "nature_science_and_weather.csv": { title: "Chinese — Nature, Science & Weather", description: "Chinese vocabulary for nature, science, and weather topics", categorySlug: "chinese-vocabulary" },
    "recreation_sports_and_arts.csv": { title: "Chinese — Recreation, Sports & Arts (Extended)", description: "Extended Chinese vocabulary for recreation and arts", categorySlug: "chinese-vocabulary" },
    "social_and_relationships.csv": { title: "Chinese — Social Life & Relationships", description: "Chinese vocabulary for social life and relationships", categorySlug: "chinese-vocabulary" },
    "time_and_measurement.csv": { title: "Chinese — Time & Measurement", description: "Chinese vocabulary for time and measurements", categorySlug: "chinese-vocabulary" },
    "traditions_and_history.csv": { title: "Chinese — Traditions & History", description: "Chinese vocabulary for traditions and historical topics", categorySlug: "chinese-vocabulary" },
    "travel_and_geography.csv": { title: "Chinese — Travel & Geography (Extended)", description: "Extended Chinese vocabulary for travel and geography", categorySlug: "chinese-vocabulary" },
    "work_business_and_money.csv": { title: "Chinese — Work, Business & Money", description: "Chinese vocabulary for work, business, and finance", categorySlug: "chinese-vocabulary" },
    "subset_1_education_and_school.csv": { title: "Chinese Study Set — Education & School", description: "Study subset: education and school vocabulary", categorySlug: "chinese-vocabulary" },
    "subset_2_work_and_career.csv": { title: "Chinese Study Set — Work & Career", description: "Study subset: work and career vocabulary", categorySlug: "chinese-vocabulary" },
    "subset_3_travel_and_places.csv": { title: "Chinese Study Set — Travel & Places", description: "Study subset: travel and places vocabulary", categorySlug: "chinese-vocabulary" },
    "subset_4_people_and_personality.csv": { title: "Chinese Study Set — People & Personality", description: "Study subset: people and personality vocabulary", categorySlug: "chinese-vocabulary" },
    "subset_5_feelings_and_opinions.csv": { title: "Chinese Study Set — Feelings & Opinions", description: "Study subset: feelings and opinions vocabulary", categorySlug: "chinese-vocabulary" },
    "subset_6_sports_and_leisure.csv": { title: "Chinese Study Set — Sports & Leisure", description: "Study subset: sports and leisure vocabulary", categorySlug: "chinese-vocabulary" },
    "subset_7_time_and_communication.csv": { title: "Chinese Study Set — Time & Communication", description: "Study subset: time and communication vocabulary", categorySlug: "chinese-vocabulary" },
    "subset_8_nature_and_environment.csv": { title: "Chinese Study Set — Nature & Environment", description: "Study subset: nature and environment vocabulary", categorySlug: "chinese-vocabulary" },
    "subset_9_traditions_and_history.csv": { title: "Chinese Study Set — Traditions & History", description: "Study subset: traditions and history vocabulary", categorySlug: "chinese-vocabulary" },
    "subset_10_daily_life_and_health.csv": { title: "Chinese Study Set — Daily Life & Health", description: "Study subset: daily life and health vocabulary", categorySlug: "chinese-vocabulary" },
  }
  if (map[filename]) return map[filename]

  const name = filename.replace(/\.csv$/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  return { title: name, description: `Vocabulary set: ${name}`, categorySlug: "chinese-vocabulary" }
}

// ── Main seed function ──────────────────────────────────

async function main() {
  console.log("🌱 Seeding database...\n")

  // Clean existing data (in correct FK order)
  console.log("🧹 Cleaning existing data...")
  await prisma.attemptAnswer.deleteMany()
  await prisma.quizAttempt.deleteMany()
  await prisma.choice.deleteMany()
  await prisma.question.deleteMany()
  await prisma.questionBank.deleteMany()
  await prisma.timelineArrow.deleteMany()
  await prisma.timelineEvent.deleteMany()
  await prisma.resource.deleteMany()
  await prisma.spaceAnnouncement.deleteMany()
  await prisma.spaceAssignment.deleteMany()
  await prisma.spaceSet.deleteMany()
  await prisma.spaceMember.deleteMany()
  await prisma.space.deleteMany()
  await prisma.cardProgress.deleteMany()
  await prisma.studyProgress.deleteMany()
  await prisma.flashcard.deleteMany()
  await prisma.flashcardSet.deleteMany()
  await prisma.dBQDocument.deleteMany()
  await prisma.dBQEssay.deleteMany()
  await prisma.dBQPrompt.deleteMany()
  await prisma.category.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()
  console.log("   Done.\n")

  // ── 0. Seed categories ───────────────────────────────
  const { seedCategories, getCategoryId } = await import("./seed-categories")
  await seedCategories()

  // ── 1. Create users ─────────────────────────────────
  const hashedDemo = await bcrypt.hash("demo1234", 12)
  const adminPassword = process.env.ADMIN_SEED_PASSWORD || "admin123"
  const hashedAdmin = await bcrypt.hash(adminPassword, 12)

  const demoUser = await prisma.user.create({
    data: { email: "demo@notera.app", name: "Demo User", password: hashedDemo, streak: 3, lastStudied: new Date() },
  })
  console.log(`✅ Created demo user: ${demoUser.email}`)

  const adminUser = await prisma.user.create({
    data: { email: "admin@notera.app", name: "Notera Admin", password: hashedAdmin, role: "ADMIN", streak: 7, lastStudied: new Date() },
  })
  console.log(`✅ Created admin user: ${adminUser.email}`)

  // ── 2. Built-in flashcard sets ──────────────────────
  const usHistoryCatId = await getCategoryId("ap-us-history")
  const usHistorySet = await prisma.flashcardSet.create({
    data: {
      title: "US History — Key Events",
      description: "Important events in American history from independence to the Space Age",
      isPublic: true,
      categoryId: usHistoryCatId,
      userId: demoUser.id,
      cards: {
        create: [
          { term: "Declaration of Independence", definition: "Adopted July 4, 1776 — declared the 13 colonies free from British rule", order: 0 },
          { term: "Louisiana Purchase", definition: "1803 — the US acquired ~827,000 sq mi of territory from France for $15 million", order: 1 },
          { term: "Emancipation Proclamation", definition: "Issued by Abraham Lincoln on January 1, 1863 — freed enslaved people in Confederate states", order: 2 },
          { term: "19th Amendment", definition: "Ratified in 1920 — granted women the right to vote in the United States", order: 3 },
          { term: "Moon Landing", definition: "July 20, 1969 — Apollo 11, Neil Armstrong became the first person to walk on the Moon", order: 4 },
          { term: "Boston Tea Party", definition: "December 16, 1773 — American colonists dumped 342 chests of tea into Boston Harbor to protest British taxation", order: 5 },
          { term: "Bill of Rights", definition: "Ratified December 15, 1791 — the first 10 amendments to the US Constitution guaranteeing individual liberties", order: 6 },
          { term: "Civil Rights Act of 1964", definition: "Landmark legislation that outlawed discrimination based on race, color, religion, sex, or national origin", order: 7 },
          { term: "Pearl Harbor", definition: "December 7, 1941 — Japanese surprise attack on the US naval base in Hawaii, leading the US to enter WWII", order: 8 },
          { term: "Brown v. Board of Education", definition: "1954 Supreme Court ruling that declared racial segregation in public schools unconstitutional", order: 9 },
        ],
      },
    },
  })
  console.log(`✅ Created set: ${usHistorySet.title} (10 cards)`)

  const spanishCatId = await getCategoryId("spanish-vocabulary")
  const spanishSet = await prisma.flashcardSet.create({
    data: {
      title: "Spanish Basics",
      description: "Common Spanish vocabulary for beginners",
      isPublic: true,
      categoryId: spanishCatId,
      userId: demoUser.id,
      cards: {
        create: [
          { term: "Hola", definition: "Hello", order: 0 },
          { term: "Gracias", definition: "Thank you", order: 1 },
          { term: "Por favor", definition: "Please", order: 2 },
          { term: "Buenos días", definition: "Good morning", order: 3 },
          { term: "Adiós", definition: "Goodbye", order: 4 },
          { term: "¿Cómo estás?", definition: "How are you?", order: 5 },
          { term: "Bien", definition: "Good / Fine", order: 6 },
          { term: "Lo siento", definition: "I'm sorry", order: 7 },
          { term: "De nada", definition: "You're welcome", order: 8 },
          { term: "¿Dónde está...?", definition: "Where is...?", order: 9 },
        ],
      },
    },
  })
  console.log(`✅ Created set: ${spanishSet.title} (10 cards)`)

  const worldHistoryCatId = await getCategoryId("ap-world-history")
  const worldHistorySet = await prisma.flashcardSet.create({
    data: {
      title: "World History — Major Civilizations",
      description: "Key facts about major world civilizations and their contributions",
      isPublic: true,
      categoryId: worldHistoryCatId,
      userId: adminUser.id,
      cards: {
        create: [
          { term: "Ancient Egypt", definition: "Civilization along the Nile River (~3100–30 BCE) — known for pyramids, hieroglyphics, and pharaohs", order: 0 },
          { term: "Roman Empire", definition: "Centered in Rome (~27 BCE–476 CE) — known for law, engineering, roads, and the Latin language", order: 1 },
          { term: "Ancient Greece", definition: "Birthplace of democracy, philosophy, and the Olympic Games (~800–146 BCE)", order: 2 },
          { term: "Han Dynasty", definition: "Chinese dynasty (206 BCE–220 CE) — established the Silk Road and advanced paper making", order: 3 },
          { term: "Ottoman Empire", definition: "Turkish-based empire (1299–1922) — controlled much of SE Europe, W Asia, and N Africa", order: 4 },
          { term: "Aztec Empire", definition: "Mesoamerican civilization (1345–1521) — built Tenochtitlan, known for agriculture and astronomy", order: 5 },
          { term: "Mongol Empire", definition: "Largest contiguous land empire (1206–1368) — founded by Genghis Khan, connected East and West", order: 6 },
          { term: "British Empire", definition: "Largest empire in history — at its peak covered ~25% of the world's land area", order: 7 },
        ],
      },
    },
  })
  console.log(`✅ Created set: ${worldHistorySet.title} (8 cards)`)

  // ── 3. Load CSV-based sets ──────────────────────────
  const dataDir = path.join(__dirname, "data")
  let csvSetCount = 0

  if (fs.existsSync(dataDir)) {
    const csvFiles = fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv")).sort()
    console.log(`\n📂 Found ${csvFiles.length} CSV files in prisma/data/`)

    for (const file of csvFiles) {
      try {
        const filePath = path.join(dataDir, file)
        const cards = parseCSV(filePath)
        if (cards.length === 0) { console.log(`   ⚠️  Skipped ${file} (no valid cards)`); continue }

        const meta = getSetMeta(file)
        const owner = csvSetCount % 2 === 0 ? demoUser : adminUser
        const catId = await getCategoryId(meta.categorySlug)

        await prisma.flashcardSet.create({
          data: {
            title: meta.title,
            description: meta.description,
            isPublic: true,
            categoryId: catId,
            userId: owner.id,
            cards: { create: cards.map((c, i) => ({ term: c.term, definition: c.definition, order: i })) },
          },
        })

        csvSetCount++
        console.log(`   ✅ ${meta.title} (${cards.length} cards)`)
      } catch (err) {
        console.error(`   ❌ Failed to load ${file}:`, err)
      }
    }
  } else {
    console.log("⚠️  No prisma/data/ directory found, skipping CSV import")
  }

  // ── 4. Summary ──────────────────────────────────────
  const totalSets = await prisma.flashcardSet.count()
  const totalCards = await prisma.flashcard.count()
  const totalUsers = await prisma.user.count()
  const totalCategories = await prisma.category.count()

  console.log("\n🎉 Seed complete!")
  console.log(`   👤 ${totalUsers} users`)
  console.log(`   📂 ${totalCategories} categories`)
  console.log(`   📚 ${totalSets} flashcard sets (${3 + csvSetCount} total: 3 built-in + ${csvSetCount} from CSV)`)
  console.log(`   🃏 ${totalCards} flashcards`)
  console.log(`\n   Demo login:  demo@notera.app  / demo1234`)
  console.log(`   Admin login: admin@notera.app / ${adminPassword}`)

  // ── 6. Seed DBQ prompts ───────────────────────────────
  const { seedDBQ, seedIndustrialRevolutionDBQ, seedImperialismDBQ, seedMongolEmpireDBQ, seedUSImperialismDBQ, seedFrenchRevolutionDBQ } = await import("./seed-dbq")
  await seedDBQ()
  await seedIndustrialRevolutionDBQ()
  await seedImperialismDBQ()
  await seedMongolEmpireDBQ()
  await seedUSImperialismDBQ()
  await seedFrenchRevolutionDBQ()
}

main()
  .catch((e) => {
    console.error("Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
