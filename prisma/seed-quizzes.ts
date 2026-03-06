/**
 * seed-quizzes.ts
 * Adds premade AP History quiz banks to the database.
 * Run with: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seed-quizzes.ts
 * Or via: npx tsx prisma/seed-quizzes.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Helper to create a question bank with questions and choices
interface ChoiceInput { text: string; isCorrect: boolean }
interface QuestionInput {
  prompt: string
  passage?: string
  explanation: string
  choices: ChoiceInput[]
}
interface BankInput {
  title: string
  subject: string
  description: string
  questions: QuestionInput[]
}

async function createBank(adminId: string, bank: BankInput) {
  // Check if already exists
  const existing = await prisma.questionBank.findFirst({
    where: { title: bank.title, isPremade: true },
  })
  if (existing) {
    console.log(`  ⏭️  Already exists: ${bank.title}`)
    return existing
  }

  const created = await prisma.questionBank.create({
    data: {
      title: bank.title,
      subject: bank.subject,
      description: bank.description,
      isPremade: true,
      isPublic: true,
      userId: adminId,
      questions: {
        create: bank.questions.map((q, i) => ({
          prompt: q.prompt,
          passage: q.passage ?? null,
          explanation: q.explanation,
          orderIndex: i,
          choices: {
            create: q.choices.map((c, j) => ({
              text: c.text,
              isCorrect: c.isCorrect,
              orderIndex: j,
            })),
          },
        })),
      },
    },
  })
  console.log(`  ✅ Created: ${bank.title} (${bank.questions.length} questions)`)
  return created
}

async function main() {
  console.log("🎓 Seeding premade quiz banks...\n")

  // Find or create the admin user
  let admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    // fallback: any user
    admin = await prisma.user.findFirst()
  }
  if (!admin) {
    console.error("❌ No users found in database. Run the main seed first.")
    process.exit(1)
  }
  console.log(`Using admin: ${admin.email}\n`)

  // ============================================================
  // AP US HISTORY — Period 1–3 (1491–1800)
  // ============================================================
  await createBank(admin.id, {
    title: "AP US History — Period 1–3 (1491–1800)",
    subject: "AP US History",
    description: "Multiple choice questions covering pre-Columbian America through the early republic (APUSH periods 1–3).",
    questions: [
      {
        prompt: "Which of the following best describes the primary motivation for European exploration of the Americas in the late 15th and early 16th centuries?",
        explanation: "European powers, especially Spain and Portugal, were primarily motivated by economic factors: seeking direct trade routes to Asia and acquiring wealth, gold, and silver. Religious motives and the spread of Christianity were secondary.",
        choices: [
          { text: "A desire to spread Christianity to indigenous peoples", isCorrect: false },
          { text: "Economic motives including trade routes and acquisition of wealth", isCorrect: true },
          { text: "Escaping religious persecution in Europe", isCorrect: false },
          { text: "Establishing democratic societies free from monarchy", isCorrect: false },
        ],
      },
      {
        prompt: "The Columbian Exchange primarily refers to:",
        explanation: "The Columbian Exchange was the widespread transfer of plants, animals, culture, human populations, technology, diseases, and ideas between the Americas, West Africa, and the Old World following Columbus's 1492 voyage.",
        choices: [
          { text: "A trade agreement between Spain and Portugal dividing the New World", isCorrect: false },
          { text: "The transfer of goods, diseases, and ideas between Europe, Africa, and the Americas", isCorrect: true },
          { text: "Columbus's agreement with Spanish monarchs to share New World profits", isCorrect: false },
          { text: "The exchange of enslaved peoples between Africa and the Caribbean", isCorrect: false },
        ],
      },
      {
        prompt: "Which statement best explains the dramatic decline in Native American populations following European contact?",
        explanation: "The primary cause of Native American population decline was epidemic disease. Indigenous peoples had no immunity to diseases like smallpox, measles, and influenza brought by Europeans, resulting in mortality rates of 50–90% in many communities.",
        choices: [
          { text: "Warfare between competing European nations fought on American soil", isCorrect: false },
          { text: "Mass enslavement and forced labor in Spanish mines", isCorrect: false },
          { text: "Epidemic diseases to which Native Americans had no immunity", isCorrect: true },
          { text: "Deliberate genocide campaigns carried out by colonial governments", isCorrect: false },
        ],
      },
      {
        prompt: "The Puritans who settled Massachusetts Bay Colony in the 1630s differed from the Pilgrims of Plymouth Colony primarily in that the Puritans:",
        explanation: "The Puritans sought to reform the Church of England from within (hence 'purify' it) but did not wish to formally separate from it, unlike the Pilgrims (Separatists). The Puritans also came in larger numbers and were generally more prosperous.",
        choices: [
          { text: "Did not seek to practice their religion freely in the New World", isCorrect: false },
          { text: "Sought to reform rather than separate from the Church of England", isCorrect: true },
          { text: "Were primarily motivated by economic rather than religious concerns", isCorrect: false },
          { text: "Maintained peaceful and cooperative relations with Native Americans", isCorrect: false },
        ],
      },
      {
        prompt: "Which of the following was a direct consequence of Bacon's Rebellion (1676)?",
        explanation: "After Bacon's Rebellion, colonial planters became fearful of armed, discontented indentured servants and freemen. As a result, Virginia planters increasingly turned to enslaved African labor, which they believed was more controllable, accelerating the growth of race-based slavery.",
        choices: [
          { text: "Virginia colony gained greater political autonomy from the English Crown", isCorrect: false },
          { text: "Colonial planters increased their reliance on enslaved African labor", isCorrect: true },
          { text: "The headright system was abolished and land redistribution occurred", isCorrect: false },
          { text: "Virginia expanded Native American land rights to prevent future conflict", isCorrect: false },
        ],
      },
      {
        prompt: "The Salutary Neglect policy of the British government (roughly 1607–1763) resulted in:",
        explanation: "Salutary neglect—Britain's informal policy of loosely enforcing Parliamentary laws in the colonies—allowed colonists to develop self-governance through assemblies and fostered economic independence. When Britain ended this policy after the Seven Years' War, colonists resisted, contributing to the American Revolution.",
        choices: [
          { text: "American colonists developing greater self-governance and economic independence", isCorrect: true },
          { text: "Stronger enforcement of the Navigation Acts throughout the colonies", isCorrect: false },
          { text: "Closer ties between colonial assemblies and the British Parliament", isCorrect: false },
          { text: "Increased British military presence to protect colonial frontiers", isCorrect: false },
        ],
      },
      {
        prompt: "The phrase 'No taxation without representation' reflected colonial opposition to taxes imposed by:",
        explanation: "The phrase directly challenged Parliament's authority to tax the colonies, since colonists had no elected representatives in Parliament. The Stamp Act (1765), Townshend Acts (1767), and Tea Act (1773) all imposed taxes without colonial legislative consent.",
        choices: [
          { text: "The colonial assemblies without the consent of the general population", isCorrect: false },
          { text: "The British Parliament, where colonists had no elected representatives", isCorrect: true },
          { text: "The king through royal decrees bypassing Parliament", isCorrect: false },
          { text: "Local colonial governors appointed by the Crown", isCorrect: false },
        ],
      },
      {
        prompt: "The Articles of Confederation were ultimately replaced by the Constitution primarily because they:",
        explanation: "The Articles of Confederation created a weak central government that could not levy taxes, regulate commerce, or compel states to contribute funds. Events like Shays' Rebellion (1786–87) demonstrated the federal government's inability to maintain order, prompting the Constitutional Convention.",
        choices: [
          { text: "Gave the federal government too much power over individual states", isCorrect: false },
          { text: "Failed to protect individual rights and civil liberties", isCorrect: false },
          { text: "Created a weak central government unable to tax or regulate commerce", isCorrect: true },
          { text: "Were declared unconstitutional by the Supreme Court", isCorrect: false },
        ],
      },
      {
        prompt: "Hamilton's financial program, including the national bank, was most strongly opposed by:",
        explanation: "Thomas Jefferson and James Madison (Democratic-Republicans) opposed Hamilton's financial program on constitutional grounds (strict construction) and because they feared concentrated financial power would benefit wealthy merchants and undermine agrarian democracy.",
        choices: [
          { text: "John Adams and the Federalist Party", isCorrect: false },
          { text: "Thomas Jefferson and the Democratic-Republicans", isCorrect: true },
          { text: "Southern planters who supported free trade with Britain", isCorrect: false },
          { text: "New England merchants who preferred state-chartered banks", isCorrect: false },
        ],
      },
      {
        prompt: "The Louisiana Purchase (1803) was controversial partly because:",
        explanation: "Jefferson, a strict constructionist who believed the Constitution should be interpreted narrowly, could find no specific constitutional authority for the federal government to purchase territory. He ultimately proceeded anyway, justifying it under treaty-making powers.",
        choices: [
          { text: "France refused to guarantee American navigation rights on the Mississippi River", isCorrect: false },
          { text: "Jefferson, a strict constructionist, found no specific constitutional authority for the purchase", isCorrect: true },
          { text: "Congress refused to ratify the treaty and Jefferson had to act by executive order", isCorrect: false },
          { text: "Spain contested French ownership of the territory and threatened war", isCorrect: false },
        ],
      },
    ],
  })

  // ============================================================
  // AP US HISTORY — Period 4–5 (1800–1877)
  // ============================================================
  await createBank(admin.id, {
    title: "AP US History — Period 4–5 (1800–1877)",
    subject: "AP US History",
    description: "Multiple choice questions covering Manifest Destiny, antebellum America, the Civil War, and Reconstruction.",
    questions: [
      {
        prompt: "The Missouri Compromise of 1820 was significant primarily because it:",
        explanation: "The Missouri Compromise temporarily resolved the slavery expansion debate by admitting Missouri as a slave state and Maine as a free state, while prohibiting slavery north of the 36°30' latitude line in the Louisiana Purchase territory.",
        choices: [
          { text: "Permanently resolved the question of slavery in the territories", isCorrect: false },
          { text: "Established the principle that Congress could abolish slavery in existing states", isCorrect: false },
          { text: "Temporarily settled the debate over slavery's expansion by establishing a geographic dividing line", isCorrect: true },
          { text: "Gave the Supreme Court authority to decide all future slavery cases", isCorrect: false },
        ],
      },
      {
        prompt: "Which of the following best characterizes the concept of Manifest Destiny?",
        explanation: "Manifest Destiny was the 19th-century belief that American expansion across North America was inevitable, justified, and even divinely ordained. It was used to justify territorial acquisitions including Texas annexation, the Mexican-American War, and settlement of the Oregon Territory.",
        choices: [
          { text: "The belief that the United States was divinely destined to expand across North America", isCorrect: true },
          { text: "A diplomatic policy establishing the U.S. right to intervene in Latin American affairs", isCorrect: false },
          { text: "The economic theory that westward expansion would solve urban poverty", isCorrect: false },
          { text: "A Congressional policy mandating the removal of Native Americans to reservations", isCorrect: false },
        ],
      },
      {
        prompt: "The Kansas-Nebraska Act of 1854 effectively repealed which earlier compromise?",
        explanation: "The Kansas-Nebraska Act introduced popular sovereignty to determine whether Kansas and Nebraska would allow slavery, effectively nullifying the Missouri Compromise's prohibition of slavery north of 36°30'. This reignited sectional conflict and led to 'Bleeding Kansas.'",
        choices: [
          { text: "The Compromise of 1850", isCorrect: false },
          { text: "The Missouri Compromise of 1820", isCorrect: true },
          { text: "Jay's Treaty of 1794", isCorrect: false },
          { text: "The Three-Fifths Compromise of 1787", isCorrect: false },
        ],
      },
      {
        prompt: "Lincoln's Emancipation Proclamation (1863) freed enslaved people in:",
        explanation: "The Emancipation Proclamation only applied to enslaved people in Confederate states still in rebellion—it did not apply to border states (loyal slave states) or Confederate areas already under Union control. It was a war measure under Lincoln's commander-in-chief powers.",
        choices: [
          { text: "All slaveholding states including border states loyal to the Union", isCorrect: false },
          { text: "Confederate states still in rebellion against the United States", isCorrect: true },
          { text: "All territories controlled by the Union Army at that time", isCorrect: false },
          { text: "All enslaved people throughout the United States", isCorrect: false },
        ],
      },
      {
        prompt: "The Black Codes passed by Southern states after the Civil War were primarily intended to:",
        explanation: "Black Codes were laws passed by Southern states in 1865–66 to restrict the freedoms of African Americans and ensure a supply of cheap agricultural labor. They required Black men to sign annual labor contracts and imposed vagrancy laws that could result in forced labor.",
        choices: [
          { text: "Provide educational and economic opportunities for freed people", isCorrect: false },
          { text: "Limit the political power of former Confederate leaders", isCorrect: false },
          { text: "Restrict African American freedoms and maintain a cheap agricultural labor supply", isCorrect: true },
          { text: "Integrate formerly enslaved people into Southern political life", isCorrect: false },
        ],
      },
      {
        prompt: "The Compromise of 1877 effectively ended Reconstruction by:",
        explanation: "The Compromise of 1877 resolved the disputed 1876 presidential election. Hayes received the presidency in exchange for withdrawing the remaining federal troops from the South. Without military enforcement of Reconstruction laws, Southern states quickly dismantled civil rights protections for Black Americans.",
        choices: [
          { text: "Passing constitutional amendments that overrode the 13th, 14th, and 15th Amendments", isCorrect: false },
          { text: "Allowing Southern states to nullify federal civil rights legislation", isCorrect: false },
          { text: "Withdrawing federal troops from the South and ending military enforcement of Reconstruction", isCorrect: true },
          { text: "Granting amnesty to all former Confederate officers and officials", isCorrect: false },
        ],
      },
    ],
  })

  // ============================================================
  // AP US HISTORY — Stimulus-Based Questions (Document Analysis)
  // ============================================================
  await createBank(admin.id, {
    title: "AP US History — Stimulus-Based Practice",
    subject: "AP US History",
    description: "Document and stimulus-based multiple choice questions in AP exam format, covering major historical periods.",
    questions: [
      {
        prompt: "Use the passage to answer the question.\n\n\"We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable Rights, that among these are Life, Liberty and the pursuit of Happiness. — That to secure these rights, Governments are instituted among Men, deriving their just powers from the consent of the governed.\"\n\n— Declaration of Independence, 1776\n\nThe ideas expressed in this passage were most directly influenced by:",
        explanation: "The Declaration of Independence drew heavily on Enlightenment philosophy, particularly John Locke's theory of natural rights (life, liberty, property) and the social contract theory that governments derive legitimacy from the consent of the governed. Jefferson closely followed Locke's Second Treatise on Government.",
        choices: [
          { text: "Puritan religious doctrine and covenant theology", isCorrect: false },
          { text: "Enlightenment philosophy, particularly John Locke's theory of natural rights", isCorrect: true },
          { text: "Mercantile economic theory developed during the colonial era", isCorrect: false },
          { text: "Republican virtue as articulated by ancient Greek and Roman writers", isCorrect: false },
        ],
      },
      {
        prompt: "Use the passage to answer the question.\n\n\"The almost certain prospect of a war between the great powers of Europe, and the extension of such a war to the American continent, led the President to consider our treaty obligations, and to determine what course this Government must pursue in case such a war arises... The United States must be neutral in fact as well as in name during these days that are to try men's souls.\"\n\n— President Woodrow Wilson, Proclamation of Neutrality, August 1914\n\nWhich of the following developments most directly challenged Wilson's neutrality policy?",
        explanation: "Germany's policy of unrestricted submarine warfare (attacking all ships, including neutral ones, in the war zone around Britain) directly violated American neutral rights on the seas. The sinking of the Lusitania (1915) and the Sussex Pledge violations, along with the Zimmermann Telegram, eventually drew the U.S. into WWI.",
        choices: [
          { text: "Britain's naval blockade preventing American ships from trading with Germany", isCorrect: false },
          { text: "Germany's policy of unrestricted submarine warfare threatening American ships", isCorrect: true },
          { text: "France's request for American troops to be sent to the Western Front", isCorrect: false },
          { text: "The Allied Powers' refusal to negotiate a peace settlement with Germany", isCorrect: false },
        ],
      },
      {
        prompt: "Use the passage to answer the question.\n\n\"In the fields of opportunity it's the same way. Just a handful of men have gathered the harvest. The great mass of workers have not received full opportunity to work and earn wages sufficient to meet the requirements of their families... The solution rests with the people themselves.\"\n\n— Franklin D. Roosevelt, campaign speech, 1932\n\nThis passage best reflects which of the following concerns of the early 1930s?",
        explanation: "Roosevelt's 1932 speech addressed the catastrophic economic inequality and unemployment of the Great Depression. The 'handful of men gathered the harvest' metaphor critiqued concentrated wealth, while 'the great mass of workers' lacking opportunity described widespread unemployment and poverty.",
        choices: [
          { text: "The threat of communist revolution inspired by the Soviet Union", isCorrect: false },
          { text: "Economic inequality and unemployment caused by the Great Depression", isCorrect: true },
          { text: "The rise of fascism in Europe and its potential spread to America", isCorrect: false },
          { text: "The collapse of agricultural prices due to overproduction in the 1920s", isCorrect: false },
        ],
      },
      {
        prompt: "Use the passage to answer the question.\n\n\"We cannot fly to the moon, we cannot cure every sickness, we cannot supply every need; but we can help make the world safe for diversity. For in the final analysis, our most basic common link is that we all inhabit this small planet. We all breathe the same air. We all cherish our children's future. And we are all mortal.\"\n\n— President John F. Kennedy, American University Commencement Address, June 1963\n\nThis speech most directly reflects Kennedy's desire to:",
        explanation: "Kennedy's American University address was a landmark speech calling for peaceful coexistence and a reduction in Cold War tensions with the Soviet Union. It directly preceded the Partial Nuclear Test Ban Treaty (1963) and reflected Kennedy's push for détente after the Cuban Missile Crisis.",
        choices: [
          { text: "Expand American military presence in Southeast Asia", isCorrect: false },
          { text: "Advocate for civil rights legislation in Congress", isCorrect: false },
          { text: "Reduce Cold War tensions and pursue peaceful coexistence with the Soviet Union", isCorrect: true },
          { text: "Increase the pace of the space program to surpass Soviet achievements", isCorrect: false },
        ],
      },
      {
        prompt: "Use the passage to answer the question.\n\n\"I say to you today, my friends, so even though we face the difficulties of today and tomorrow, I still have a dream. It is a dream deeply rooted in the American dream. I have a dream that one day this nation will rise up and live out the true meaning of its creed: 'We hold these truths to be self-evident, that all men are created equal.'\"\n\n— Dr. Martin Luther King Jr., March on Washington, August 28, 1963\n\nKing's appeal to the Declaration of Independence in this passage most directly served to:",
        explanation: "By invoking the Declaration of Independence, King argued that racial equality was not a radical demand but the fulfillment of America's founding promise. This rhetorical strategy portrayed civil rights as consistent with core American values, making it harder for opponents to dismiss the movement as un-American.",
        choices: [
          { text: "Argue that the Constitution should be replaced with a more equitable document", isCorrect: false },
          { text: "Frame the civil rights movement as fulfilling America's founding ideals", isCorrect: true },
          { text: "Demand immediate federal legislation overriding Southern state laws", isCorrect: false },
          { text: "Appeal to international audiences during the Cold War for support", isCorrect: false },
        ],
      },
      {
        prompt: "Use the image description to answer the question.\n\n[Political cartoon, 1898: Uncle Sam stands at the globe, holding a large club labeled 'Monroe Doctrine' while small figures labeled 'Cuba,' 'Puerto Rico,' 'Hawaii,' and 'Philippines' stand nearby looking up at him.]\n\nThe cartoon most likely reflects which foreign policy development of the 1890s?",
        explanation: "The Spanish-American War of 1898 and its aftermath represented a major shift toward American imperialism. The U.S. gained control of Cuba, Puerto Rico, Guam, and the Philippines, transforming from a continental power to an overseas empire—often justified by Social Darwinism and the 'civilizing mission.'",
        choices: [
          { text: "The U.S. expansion of the Monroe Doctrine to justify intervention in Latin America", isCorrect: false },
          { text: "American imperialism following the Spanish-American War of 1898", isCorrect: true },
          { text: "Theodore Roosevelt's Big Stick diplomacy in the Caribbean", isCorrect: false },
          { text: "The Open Door Policy toward China and competition with European powers", isCorrect: false },
        ],
      },
      {
        prompt: "Use the data to answer the question.\n\nUnemployment Rate, United States:\n1929: 3.2% | 1930: 8.7% | 1931: 15.9% | 1932: 23.6% | 1933: 24.9% | 1934: 21.7% | 1935: 20.1% | 1936: 17.0% | 1937: 14.3% | 1938: 19.0% | 1940: 14.6%\n\nBased on the unemployment data above, which of the following conclusions is best supported?",
        explanation: "The data shows unemployment rose sharply from 3.2% (1929) to 24.9% (1933), then gradually declined under FDR's New Deal programs, but spiked again in 1938 (to 19%) due to Roosevelt's premature budget cuts—the 'Roosevelt Recession.' Full recovery only came with WWII mobilization in the early 1940s.",
        choices: [
          { text: "The New Deal immediately and permanently ended the Great Depression by 1934", isCorrect: false },
          { text: "Unemployment peaked in 1933, partially declined under the New Deal, but remained high throughout the decade", isCorrect: true },
          { text: "The economy returned to 1929 levels of unemployment by 1937", isCorrect: false },
          { text: "Federal intervention had no measurable effect on unemployment during the 1930s", isCorrect: false },
        ],
      },
    ],
  })

  // ============================================================
  // AP World History — Ancient Civilizations
  // ============================================================
  await createBank(admin.id, {
    title: "AP World History — Ancient & Classical Civilizations",
    subject: "AP World History",
    description: "Multiple choice questions on ancient civilizations, classical empires, and early world history (Units 1–2).",
    questions: [
      {
        prompt: "Which of the following best explains why river valleys were the sites of the earliest civilizations?",
        explanation: "River valleys provided reliable water for irrigation, fertile soil deposited by annual floods, transportation routes for trade, and natural defenses. The Tigris-Euphrates, Nile, Indus, and Yellow River valleys all supported the development of early civilizations for these reasons.",
        choices: [
          { text: "River valleys were defensively superior to coastal or highland locations", isCorrect: false },
          { text: "Rivers provided fertile soil, reliable water for irrigation, and trade routes", isCorrect: true },
          { text: "Rivers allowed civilizations to avoid conflict with nomadic pastoralists", isCorrect: false },
          { text: "River valleys were the only locations with sufficient timber for construction", isCorrect: false },
        ],
      },
      {
        prompt: "The Silk Road was significant in world history primarily because it:",
        explanation: "The Silk Road facilitated the exchange of goods (silk, spices, precious metals), ideas, religions (Buddhism, Christianity, Islam), technologies (paper, gunpowder), and diseases (most notably the Black Death) across Eurasia, connecting East Asia, South Asia, the Middle East, and Europe.",
        choices: [
          { text: "Allowed China to maintain a trade monopoly on silk production for centuries", isCorrect: false },
          { text: "Facilitated the spread of goods, religions, technologies, and diseases across Eurasia", isCorrect: true },
          { text: "Primarily served as a military route for Mongol conquests", isCorrect: false },
          { text: "Connected the Mediterranean world with sub-Saharan Africa", isCorrect: false },
        ],
      },
      {
        prompt: "The fall of the Western Roman Empire in 476 CE was most significantly caused by:",
        explanation: "The fall of Rome had multiple causes: economic troubles, political instability, military pressures from Germanic tribes and Huns, overtaxation, depopulation from disease, and the challenges of governing such a vast territory. Most historians see it as a gradual process rather than a single event.",
        choices: [
          { text: "Christianity weakening Roman martial values and civic virtue", isCorrect: false },
          { text: "A combination of economic decline, political instability, and external military pressures", isCorrect: true },
          { text: "The migration of the population to the Eastern Roman (Byzantine) Empire", isCorrect: false },
          { text: "An economic embargo by Persian and Arab trading partners", isCorrect: false },
        ],
      },
      {
        prompt: "Which characteristic most distinguished the Mongol Empire from previous empires in Eurasia?",
        explanation: "The Mongol Empire was the largest contiguous land empire in history, stretching from China to Eastern Europe. The Pax Mongolica (Mongol Peace) enabled unprecedented trade and cultural exchange across Eurasia, though the conquests were also marked by massive destruction.",
        choices: [
          { text: "Its development of a sophisticated written legal code governing conquered peoples", isCorrect: false },
          { text: "Its geographic scale—the largest contiguous land empire in history—enabling Eurasian trade", isCorrect: true },
          { text: "Its promotion of a single world religion across all conquered territories", isCorrect: false },
          { text: "Its use of advanced siege technology that no previous empire had possessed", isCorrect: false },
        ],
      },
    ],
  })

  // ============================================================
  // AP World History — 1200–1900
  // ============================================================
  await createBank(admin.id, {
    title: "AP World History — Global Interactions (1200–1900)",
    subject: "AP World History",
    description: "Multiple choice questions on the global exchange, European expansion, industrialization, and imperialism.",
    questions: [
      {
        prompt: "The Atlantic slave trade differed from earlier forms of slavery primarily in that:",
        explanation: "The transatlantic slave trade was unique in its massive scale, its explicit racial basis (targeting only sub-Saharan Africans), and the brutal conditions of the Middle Passage. Unlike earlier slave systems where slavery was not race-based, the Atlantic system created a permanent racial hierarchy.",
        choices: [
          { text: "Enslaved people in the Atlantic system had no legal rights whatsoever", isCorrect: false },
          { text: "It operated on a far larger scale and was explicitly based on racial identity", isCorrect: true },
          { text: "It was the first time enslaved people were used for agricultural labor", isCorrect: false },
          { text: "Enslaved people had no possibility of manumission or freedom", isCorrect: false },
        ],
      },
      {
        prompt: "The Industrial Revolution began in Britain rather than elsewhere primarily because:",
        explanation: "Britain had several unique advantages: abundant coal and iron deposits, a colonial empire providing raw materials and markets, an agricultural revolution that freed up labor, a stable banking system providing capital investment, and a culture of practical innovation supported by patent law.",
        choices: [
          { text: "Britain had the largest population in Europe to supply industrial labor", isCorrect: false },
          { text: "Britain had favorable geography, colonial resources, capital, and a culture of innovation", isCorrect: true },
          { text: "Britain won the race to acquire superior steam technology from China", isCorrect: false },
          { text: "British government directly controlled and funded industrial enterprises", isCorrect: false },
        ],
      },
      {
        prompt: "The 'Scramble for Africa' (1880–1914) was primarily driven by:",
        explanation: "The Scramble for Africa was driven by economic competition (access to raw materials, markets, investment opportunities), nationalist rivalry among European powers, strategic interests (Suez Canal, trade routes), and Social Darwinist ideologies justifying European superiority. By 1914, Europeans controlled about 90% of Africa.",
        choices: [
          { text: "European concern over the spread of Islam across sub-Saharan Africa", isCorrect: false },
          { text: "Economic competition, nationalist rivalry, and strategic interests among European powers", isCorrect: true },
          { text: "The need to find new lands to settle Europe's rapidly growing population", isCorrect: false },
          { text: "African states requesting European protection against Ottoman expansion", isCorrect: false },
        ],
      },
      {
        prompt: "Japan's Meiji Restoration (1868) was a response to:",
        explanation: "The Meiji Restoration was a direct response to Western imperial pressure, particularly the arrival of Commodore Perry's 'Black Ships' in 1853 that forced Japan to open to trade. Japanese leaders chose rapid modernization (industrialization, Western-style military, legal system) to avoid the fate of China under imperial domination.",
        choices: [
          { text: "Domestic revolution by the Japanese peasant class demanding land reform", isCorrect: false },
          { text: "Western imperial pressure that threatened Japanese sovereignty and independence", isCorrect: true },
          { text: "The desire to expand Japan's colonial empire in East Asia", isCorrect: false },
          { text: "Religious conflict between Buddhist and Shinto factions in the imperial court", isCorrect: false },
        ],
      },
    ],
  })

  // ============================================================
  // AP US Government & Politics
  // ============================================================
  await createBank(admin.id, {
    title: "AP US Government & Politics — Core Concepts",
    subject: "AP Government",
    description: "Essential multiple choice questions on the Constitution, branches of government, civil rights, and political participation.",
    questions: [
      {
        prompt: "The principle of federalism, as established in the U.S. Constitution, refers to:",
        explanation: "Federalism divides sovereign power between the national (federal) government and the state governments, with each having its own sphere of authority. The 10th Amendment reserves powers not delegated to the federal government to the states or the people.",
        choices: [
          { text: "The separation of powers among the three branches of the federal government", isCorrect: false },
          { text: "The division of power between the national government and state governments", isCorrect: true },
          { text: "The system of checks and balances that prevents any one branch from becoming too powerful", isCorrect: false },
          { text: "The constitutional guarantee of individual rights against government interference", isCorrect: false },
        ],
      },
      {
        prompt: "The Supreme Court's power of judicial review—the ability to declare laws unconstitutional—was established by:",
        explanation: "Judicial review was established in Marbury v. Madison (1803), written by Chief Justice John Marshall. The Constitution does not explicitly grant this power; Marshall's ruling derived it from the Constitution's status as supreme law and the judiciary's role in interpreting the law.",
        choices: [
          { text: "Article III of the Constitution at the Constitutional Convention", isCorrect: false },
          { text: "Marbury v. Madison (1803), decided by Chief Justice John Marshall", isCorrect: true },
          { text: "The Judiciary Act of 1789, passed by the first Congress", isCorrect: false },
          { text: "McCulloch v. Maryland (1819), which established implied powers", isCorrect: false },
        ],
      },
      {
        prompt: "The Electoral College system for electing the President was established primarily to:",
        explanation: "The Founders created the Electoral College as a compromise between election by Congress and direct popular vote. They feared direct democracy could be manipulated by demagogues, and electors were expected to be informed citizens who could exercise independent judgment if necessary.",
        choices: [
          { text: "Ensure large states had proportional influence in presidential elections", isCorrect: false },
          { text: "Balance popular democracy with the judgment of informed electors, and compromise between Congress and popular election", isCorrect: true },
          { text: "Prevent foreign-born citizens from having undue influence in elections", isCorrect: false },
          { text: "Give smaller states an advantage by providing equal representation", isCorrect: false },
        ],
      },
      {
        prompt: "Which of the following best describes the significance of the First Amendment's Establishment Clause?",
        explanation: "The Establishment Clause prohibits the government from establishing an official religion or favoring one religion over others (or religion over non-religion). It creates a 'wall of separation' between church and state, preventing government endorsement or financial support of religious activities.",
        choices: [
          { text: "It guarantees citizens the right to practice any religion without government interference", isCorrect: false },
          { text: "It prohibits government from establishing an official religion or favoring religion", isCorrect: true },
          { text: "It requires government to remain completely neutral and silent on all religious matters", isCorrect: false },
          { text: "It prevents religious organizations from participating in political activities", isCorrect: false },
        ],
      },
      {
        prompt: "The 'iron triangle' in American politics refers to the relationship between:",
        explanation: "The iron triangle describes the mutually beneficial relationship between Congressional committees, executive branch regulatory agencies, and interest groups (lobbying organizations). Each provides benefits to the others: committees provide funding and oversight, agencies implement favorable policies, and interest groups provide campaign support and expertise.",
        choices: [
          { text: "The President, Congress, and the Supreme Court as the three branches of government", isCorrect: false },
          { text: "Congressional committees, executive agencies, and interest groups", isCorrect: true },
          { text: "Federal, state, and local governments in a federalist system", isCorrect: false },
          { text: "Political parties, media organizations, and campaign donors", isCorrect: false },
        ],
      },
    ],
  })

  // Summary
  const total = await prisma.questionBank.count({ where: { isPremade: true } })
  console.log(`\n🎉 Done! ${total} premade quiz banks in database.`)
}

main()
  .catch((e) => {
    console.error("Quiz seed error:", e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
