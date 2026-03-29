/**
 * seed-sets.ts — Seeds the two manually-provided vocab flashcard sets.
 * Run with: npx tsx prisma/seed-sets.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ── Latin 2 — Vocab List 10 ───────────────────────────────
// Front: "term, genitive, gender"   Back: English definition
const LATIN_CARDS: { term: string; definition: string }[] = [
  // 4th Declension (masculine)
  { term: "aestus, -ūs, (m)",       definition: "heat" },
  { term: "apparatus, -ūs, (m)",    definition: "equipment" },
  { term: "arcus, -ūs, (m)",        definition: "bow; rainbow" },
  { term: "cantus, -ūs, (m)",       definition: "song; chant" },
  { term: "casus, -ūs, (m)",        definition: "fall; chance; accident" },
  { term: "conātus, -ūs, (m)",      definition: "effort; attempt" },
  { term: "cultus, -ūs, (m)",       definition: "civilization" },
  { term: "domus, -ūs, (f)",        definition: "house; home" },
  { term: "equitātus, -ūs, (m)",    definition: "cavalry" },
  { term: "exercitus, -ūs, (m)",    definition: "army" },
  { term: "fructus, -ūs, (m)",      definition: "enjoyment; profit; fruit" },
  { term: "gradus, -ūs, (m)",       definition: "step; rank" },
  { term: "gustus, -ūs, (m)",       definition: "taste" },
  { term: "ictus, -ūs, (m)",        definition: "strike; blow" },
  { term: "lacus, -ūs, (m)",        definition: "lake" },
  { term: "manus, -ūs, (f)",        definition: "hand" },
  { term: "metus, -ūs, (m)",        definition: "fear; dread" },
  { term: "occasus, -ūs, (m)",      definition: "setting; sunset" },
  { term: "ortus, -ūs, (m)",        definition: "rising; sunrise" },
  { term: "passus, -ūs, (m)",       definition: "step; pace" },
  { term: "peditātus, -ūs, (m)",    definition: "infantry" },
  { term: "portus, -ūs, (m)",       definition: "harbor" },
  { term: "quercus, -ūs, (f)",      definition: "oak" },
  { term: "senatus, -ūs, (m)",      definition: "senate" },
  { term: "sensus, -ūs, (m)",       definition: "feeling; sense" },
  { term: "spiritus, -ūs, (m)",     definition: "breath; spirit" },
  { term: "tribus, -ūs, (f)",       definition: "tribe" },
  { term: "versus, -ūs, (m)",       definition: "turn; line of verse" },
  // 4th Declension (neuter)
  { term: "cornū, -ūs, (n)",        definition: "horn" },
  { term: "gelū, -ūs, (n)",         definition: "frost; chill" },
  { term: "genū, -ūs, (n)",         definition: "knee" },
  // 5th Declension
  { term: "aciēs, acieī, (f)",      definition: "edge; line of battle" },
  { term: "diēs, dieī, (m/f)",      definition: "day" },
  { term: "effigiēs, effigieī, (f)", definition: "effigy; likeness; statue" },
  { term: "faciēs, facieī, (f)",    definition: "shape; form; appearance" },
  { term: "fidēs, fideī, (f)",      definition: "faith" },
  { term: "meridiēs, meridieī, (m)", definition: "midday" },
  { term: "rēs, reī, (f)",          definition: "thing" },
  { term: "plebēs, plebeī, (f)",    definition: "commoners" },
  { term: "seriēs, serieī, (f)",    definition: "row; chain; series" },
  { term: "speciēs, specieī, (f)",  definition: "appearance" },
  { term: "spēs, speī, (f)",        definition: "hope" },
]

// ── German 1 — Unit 3 Vocab ──────────────────────────────
// Front: German   Back: English
const GERMAN_CARDS: { term: string; definition: string }[] = [
  // School subjects
  { term: "Die Mathe",            definition: "Math" },
  { term: "Die Kunst",            definition: "Art" },
  { term: "Die Erdkunde",         definition: "Geography" },
  { term: "Die Geschichte",       definition: "History" },
  { term: "Die Biologie",         definition: "Biology" },
  { term: "Der Sport",            definition: "PE / Sports" },
  { term: "Die Fremdsprachen",    definition: "Foreign Languages" },
  { term: "Die Informatik",       definition: "Computer Science" },
  { term: "Die Physik",           definition: "Physics" },
  { term: "Die Chemie",           definition: "Chemistry" },
  // School supplies
  { term: "der Rucksack",         definition: "Backpack" },
  { term: "das Etui",             definition: "Pencil case" },
  { term: "der Taschenrechner",   definition: "Calculator" },
  { term: "das Heft",             definition: "Notebook" },
  { term: "der Bleistift",        definition: "Pencil" },
  { term: "der Kuli",             definition: "Pen" },
  { term: "der Ordner",           definition: "Folder" },
  { term: "die Schere",           definition: "Scissors" },
  { term: "der Kleber",           definition: "Glue" },
  { term: "das Lineal",           definition: "Ruler" },
  // School types / structure
  { term: "die Schultüte",        definition: "School cone (tradition)" },
  { term: "das Gymnasium",        definition: "Academic high school" },
  { term: "die Realschule",       definition: "Intermediate school" },
  { term: "die Hauptschule",      definition: "General secondary school" },
  { term: "der Stundenplan",      definition: "Schedule" },
  { term: "die Pause",            definition: "Break / Recess" },
  { term: "die Note",             definition: "Grade" },
  { term: "das Zeugnis",          definition: "Report card" },
  { term: "die Ganztagsschule",   definition: "All-day school" },
  { term: "der Beruf",            definition: "Career / Profession" },
  { term: "der Vorteil",          definition: "Advantage" },
  { term: "der Nachteil",         definition: "Disadvantage" },
  { term: "fleißig",              definition: "Hardworking" },
  { term: "faul",                 definition: "Lazy" },
  // Reflexive verbs / daily routine
  { term: "sich aufwachen",       definition: "To wake up" },
  { term: "sich aufstehen",       definition: "To get up" },
  { term: "sich duschen",         definition: "To shower" },
  { term: "sich waschen",         definition: "To wash oneself" },
  { term: "sich die Zähne putzen", definition: "To brush one's teeth" },
  { term: "sich anziehen",        definition: "To get dressed" },
  { term: "sich kämmen",          definition: "To comb one's hair" },
  { term: "sich rasieren",        definition: "To shave" },
  { term: "sich schminken",       definition: "To put on makeup" },
  { term: "sich beeilen",         definition: "To hurry" },
  // Free time / hobbies
  { term: "die Freizeit",         definition: "Free time" },
  { term: "das Hobby",            definition: "Hobby" },
  { term: "Fußball spielen",      definition: "To play soccer" },
  { term: "wandern",              definition: "To hike" },
  { term: "zeichnen",             definition: "To draw" },
  { term: "Musik hören",          definition: "To listen to music" },
  { term: "Videospiele spielen",  definition: "To play video games" },
  { term: "lesen",                definition: "To read" },
  { term: "Freunde treffen",      definition: "To meet friends" },
  { term: "ins Kino gehen",       definition: "To go to the cinema" },
  { term: "laufen",               definition: "To run" },
  { term: "schwimmen",            definition: "To swim" },
  { term: "Rad fahren",           definition: "To ride a bike" },
  { term: "kochen",               definition: "To cook" },
  { term: "der Verein",           definition: "Club / Association" },
  { term: "das Training",         definition: "Practice / Training" },
  // Weather
  { term: "das Wetter",           definition: "Weather" },
  { term: "die Jahreszeit",       definition: "Season" },
  { term: "der Frühling",         definition: "Spring" },
  { term: "der Sommer",           definition: "Summer" },
  { term: "der Herbst",           definition: "Fall" },
  { term: "der Winter",           definition: "Winter" },
  { term: "Es ist heiß",          definition: "It is hot" },
  { term: "Es ist kalt",          definition: "It is cold" },
  { term: "Die Sonne scheint",    definition: "The sun is shining" },
  { term: "Es regnet",            definition: "It is raining" },
  { term: "Es schneit",           definition: "It is snowing" },
  { term: "Es ist windig",        definition: "It is windy" },
  // Clothing
  { term: "die Kleidung",         definition: "Clothing" },
  { term: "das T-Shirt",          definition: "T-shirt" },
  { term: "die Hose",             definition: "Pants" },
  { term: "die Jacke",            definition: "Jacket" },
  { term: "der Mantel",           definition: "Coat" },
  { term: "die Schuhe",           definition: "Shoes" },
  { term: "die Turnschuhe",       definition: "Sneakers" },
  { term: "der Badeanzug",        definition: "Swimsuit" },
  { term: "die Stiefel",          definition: "Boots" },
  { term: "der Helm",             definition: "Helmet" },
  { term: "die Handschuhe",       definition: "Gloves" },
  { term: "die Mütze",            definition: "Beanie / Cap" },
  { term: "die Uniform",          definition: "Uniform" },
  // Shopping
  { term: "einkaufen gehen",      definition: "To go shopping" },
  { term: "das Kaufhaus",         definition: "Department store" },
  { term: "das Sportgeschäft",    definition: "Sports store" },
  { term: "die Boutique",         definition: "Boutique" },
  { term: "der Preis",            definition: "Price" },
  { term: "Wie viel kostet das?", definition: "How much does that cost?" },
  { term: "teuer",                definition: "Expensive" },
  { term: "billig",               definition: "Cheap" },
  { term: "im Angebot",           definition: "On sale" },
  { term: "die Kasse",            definition: "Cashier / Register" },
  { term: "bezahlen",             definition: "To pay" },
  { term: "die Kreditkarte",      definition: "Credit card" },
  { term: "bar bezahlen",         definition: "To pay in cash" },
  { term: "anprobieren",          definition: "To try on" },
  { term: "die Größe",            definition: "Size" },
]

async function createSet(
  userId: string,
  title: string,
  description: string,
  categorySlug: string,
  cards: { term: string; definition: string }[]
) {
  const existing = await prisma.flashcardSet.findFirst({ where: { title, userId } })
  if (existing) {
    console.log(`  ⏭️  Already exists: ${title}`)
    return existing
  }

  const category = await prisma.category.findUnique({ where: { slug: categorySlug } })

  const set = await prisma.flashcardSet.create({
    data: {
      title,
      description,
      isPublic: true,
      categoryId: category?.id ?? null,
      userId,
      cards: {
        create: cards.map((c, i) => ({
          term: c.term,
          definition: c.definition,
          order: i,
        })),
      },
    },
  })
  console.log(`  ✅ Created: "${title}" — ${cards.length} cards`)
  return set
}

async function main() {
  console.log("📚 Seeding vocab flashcard sets...\n")

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    console.error("❌ No admin user found. Run the main seed first.")
    process.exit(1)
  }
  console.log(`Using: ${admin.email}\n`)

  await createSet(
    admin.id,
    "Latin 2 - Vocab List 10",
    "4th and 5th declension Latin vocabulary. Front: term + genitive + gender. Back: English definition.",
    "latin-vocabulary",
    LATIN_CARDS
  )

  await createSet(
    admin.id,
    "German 1 - Unit 3 Vocab",
    "German 1 Unit 3 vocabulary covering school, daily routine, hobbies, weather, clothing, and shopping.",
    "german-vocabulary",
    GERMAN_CARDS
  )

  console.log("\n🎉 Done!")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
