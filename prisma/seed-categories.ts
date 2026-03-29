import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface CategoryNode {
  name: string
  slug: string
  description?: string
  icon?: string
  children?: CategoryNode[]
}

const CATEGORY_TREE: CategoryNode[] = [
  {
    name: "Languages",
    slug: "languages",
    icon: "🌐",
    description: "Foreign language study materials",
    children: [
      {
        name: "Chinese",
        slug: "chinese",
        icon: "🇨🇳",
        description: "Mandarin Chinese",
        children: [
          { name: "Vocabulary", slug: "chinese-vocabulary", icon: "📝", description: "Chinese word lists and definitions" },
          { name: "Grammar", slug: "chinese-grammar", icon: "📖", description: "Chinese grammar patterns and structures" },
        ],
      },
      {
        name: "Latin",
        slug: "latin",
        icon: "🏛️",
        description: "Classical Latin",
        children: [
          { name: "Vocabulary", slug: "latin-vocabulary", icon: "📝", description: "Latin word lists with declensions and conjugations" },
          { name: "Grammar", slug: "latin-grammar", icon: "📖", description: "Latin grammar — deponents, conjugations, syntax" },
        ],
      },
      {
        name: "German",
        slug: "german",
        icon: "🇩🇪",
        description: "German language",
        children: [
          { name: "Vocabulary", slug: "german-vocabulary", icon: "📝", description: "German word lists and definitions" },
        ],
      },
      {
        name: "Spanish",
        slug: "spanish",
        icon: "🇪🇸",
        description: "Spanish language",
        children: [
          { name: "Vocabulary", slug: "spanish-vocabulary", icon: "📝", description: "Spanish word lists and definitions" },
        ],
      },
    ],
  },
  {
    name: "History",
    slug: "history",
    icon: "📜",
    description: "Historical events, eras, and analysis",
    children: [
      { name: "AP US History", slug: "ap-us-history", icon: "🇺🇸", description: "Advanced Placement United States History" },
      { name: "AP World History", slug: "ap-world-history", icon: "🌍", description: "Advanced Placement World History" },
      { name: "AP European History", slug: "ap-european-history", icon: "🏰", description: "Advanced Placement European History" },
      { name: "AP US Government", slug: "ap-us-government", icon: "⚖️", description: "Advanced Placement US Government & Politics" },
    ],
  },
  {
    name: "Mathematics",
    slug: "mathematics",
    icon: "📐",
    description: "Mathematics courses and topics",
    children: [
      { name: "Number Theory", slug: "number-theory", icon: "🔢", description: "Primes, divisibility, modular arithmetic" },
      { name: "Calculus", slug: "calculus", icon: "∫", description: "Limits, derivatives, integrals" },
      { name: "Geometry", slug: "geometry", icon: "📐", description: "Euclidean geometry, proofs, constructions" },
    ],
  },
  {
    name: "Science",
    slug: "science",
    icon: "🔬",
    description: "Natural sciences",
    children: [
      { name: "Physics — Mechanics", slug: "physics-mechanics", icon: "⚙️", description: "Newtonian mechanics, forces, energy, momentum" },
      { name: "Physics — E&M", slug: "physics-em", icon: "⚡", description: "Electricity, magnetism, circuits, waves" },
    ],
  },
]

async function upsertTree(nodes: CategoryNode[], parentId: string | null, orderStart = 0) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    const category = await prisma.category.upsert({
      where: { slug: node.slug },
      update: {
        name: node.name,
        description: node.description ?? null,
        icon: node.icon ?? null,
        order: orderStart + i,
        parentId,
      },
      create: {
        name: node.name,
        slug: node.slug,
        description: node.description ?? null,
        icon: node.icon ?? null,
        order: orderStart + i,
        parentId,
      },
    })

    if (node.children?.length) {
      await upsertTree(node.children, category.id)
    }
  }
}

export async function seedCategories() {
  console.log("📂 Seeding categories...\n")
  await upsertTree(CATEGORY_TREE, null)

  const count = await prisma.category.count()
  console.log(`   ✅ ${count} categories seeded\n`)
}

/** Look up a category by slug, throwing if not found */
export async function getCategoryId(slug: string): Promise<string> {
  const cat = await prisma.category.findUnique({ where: { slug } })
  if (!cat) throw new Error(`Category not found: ${slug}`)
  return cat.id
}
