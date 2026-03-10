import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function seedDBQ() {
  console.log("🏛️  Seeding DBQ prompts...")

  // Upsert the Qing Dynasty DBQ prompt
  const prompt = await prisma.dBQPrompt.upsert({
    where: { id: "dbq-qing-dynasty-collapse" },
    update: {},
    create: {
      id: "dbq-qing-dynasty-collapse",
      title: "Collapse of the Qing Dynasty",
      question:
        "Evaluate the extent to which foreign influence led to the collapse of the Qing Dynasty.",
      subject: "AP World History",
      era: "1750–1914",
    },
  })

  // Check if documents already exist
  const existingDocs = await prisma.dBQDocument.count({
    where: { promptId: prompt.id },
  })

  if (existingDocs > 0) {
    console.log("   ↳ Documents already seeded, skipping.")
    return
  }

  const documents = [
    {
      docNumber: 1,
      title: "Document 1",
      source:
        "Petition from two local-level government officials in the district of Rong, Guangxi Province, southern China, to the provincial governor, circa 1850",
      content: `Our dynasty has always followed the teachings of the ancient sages and, as a result, everyone in our district lived in harmony for a long time. As the population increased, resources were plentiful. However, in 1846 local bandits and rebels began attacking our district. They captured the district capital and took government officials as prisoners. Many people were killed, houses were left in ashes, and farmers' fields were taken over by the rebels. The rebels forced the people to pay land taxes to them. They used official seals to issue false orders to the population. It was intolerable to see these criminals seize control of the local government.

Your excellency last year promised to send an army to suppress the rebels. We beg you, please have the army come immediately to exterminate the rebels and save the people. Our local militia has been fighting them for a long time and we fear that if the militia collapses, the rebels will run free and it will become impossible for the government to control them.`,
      orderIndex: 0,
    },
    {
      docNumber: 2,
      title: "Document 2",
      source:
        'Karl Marx, German political economist, "Revolution in China and in Europe," article published in the New York Daily Tribune, 1853',
      content: `The current formidable revolution that is taking place in China has unquestionably been caused by the British cannon forcing upon China the unlimited importation of opium. Faced with the might of the British arms, the authority of the Manchu (Qing) dynasty fell to pieces and China's complete isolation from the civilized world came to an end.

The opium trade changed the balance of trade from being continually in favor of the Chinese to being an exhausting drain on the silver reserves of the empire. Hence, the emperor made strong decrees against the opium trade, which were subsequently not enforced. The bribery connected with opium smuggling has entirely corrupted the Chinese state officers in the southern provinces and thereby undermined the authority of the state.

The introduction of English mass-produced textiles has had a similar effect on the native Chinese industry to that on the Ottoman Empire, Persia, and India. In China the spinners and weavers have suffered greatly under this foreign competition, and their communities have become destabilized as a result.`,
      orderIndex: 1,
    },
    {
      docNumber: 3,
      title: "Document 3",
      source:
        "Qing China's Foreign Office, policy letter addressed to all Chinese embassies abroad, 1878",
      content: `Under the Treaties of Tianjin, foreigners in China are not subject to the jurisdiction of the Chinese imperial authorities. If they have disputes among themselves, their own consuls in China are to settle them, and if they commit a crime in China, their own diplomats are to punish them according to their national laws. But in practice, foreigners claim much more than this: they interpret the treaties to mean that they may violate Chinese laws without consequences. To this we cannot agree—China never gave foreigners permission to disregard our laws.

A special case of this issue is the missionary question. By the terms of the treaties, China had to agree to admit Western missionaries and to guarantee them protection. But among the missionaries there are some who act as if their missions are outside of government control, and among their Chinese converts there are some who seem to believe being Christians allows them to break the laws of their own country. We cannot accept this. Chinese subjects, whether Christians or not, must obey completely the laws of China.`,
      orderIndex: 2,
    },
    {
      docNumber: 4,
      title: "Document 4",
      source:
        "Village elders in the district of Caozhou, Shandong Province, northeast China, report to the provincial government, 1896",
      content: `In our district, the wealthy landowners grow richer each year, while the poor have nothing. These rich folks treat the poor as strangers—they will lend them either cloth or grain. They treat their hired laborers particularly cruelly, arousing a hatred so strong that the poor people are easily tempted to turn to a life of banditry.

The bandits come every few weeks to people's houses, bearing sharp knives or foreign rifles. When they ask the poor people for money, what can the poor refuse? If the granary of the district were more equally distributed, there would be enough to eat, but there are many without any land. All the poor can do is sell their labor or turn to a life of crime. In North China a hired farmworker can find work for three months per year at the most. A person cannot make a living on that. So when they see the easy lives of the bandits, the poor are tempted to join them.`,
      orderIndex: 3,
    },
    {
      docNumber: 5,
      title: "Document 5",
      source:
        'Chinese Alliance Association, a coalition of political organizations of young Chinese men studying in foreign countries, "Revolutionary Proclamation," 1907',
      content: `Since the beginning of China as a nation, we Chinese have governed our own country despite occasional interruptions. Today, when we raise the righteous standard of revolt in order to expel an alien race [the Manchu] that has been occupying China, we do no more than our ancestors have done or expected us to do.

The purpose of past revolutions, such as those conducted by the Ming and Taipings, was to restore China to the Chinese, and nothing else. We, on the other hand, strive not only to expel the ruling aliens but also to change the political and economic structure of our country. While we cannot describe in detail this new political and economic structure in this short proclamation, the basic principles behind it are liberty, equality, and fraternity. The revolutions of yesterday were revolutions by and for the revolutionaries; our revolution, on the other hand, is a revolution of the people and for the people.`,
      orderIndex: 4,
    },
    {
      docNumber: 6,
      title: "Document 6",
      source:
        'Anonymous Chinese artist, "A Look at China Now and in the Past," cartoon published in the Shenzhou Ribao (National Herald) newspaper, Shanghai, 1911',
      content: `In the images, the tiger represents China, and the men represent Western countries.

The images were labeled as follows:

[upper left image]: "China during the Kangxi and Qianlong emperors [seventeenth and eighteenth centuries]."

[upper right image]: "China during the Xianfeng and Tongzhi emperors [first half of the nineteenth century]."

[lower left image]: "China today," and

[lower right image]: "China in the future."`,
      imageUrl: "/dbq/qing-dynasty-cartoon.png",
      imageAlt:
        "A Look at China Now and in the Past — four-panel cartoon showing China as a tiger across different eras",
      orderIndex: 5,
    },
    {
      docNumber: 7,
      title: "Document 7",
      source:
        "The abdication decree of the child emperor Puyi, issued by the regent empress Longyu on Puyi's behalf, officially ending the Qing dynasty, 1912",
      content: `As a consequence of the uprising of the Republican Army, to which different provinces immediately responded, the empire seethed like a boiling cauldron and the people were plunged into utter misery. It is now evident that the hearts of the majority of the people are in favor of a republican form of government: the provinces of the south were the first to espouse the cause, and the generals of the north have since pledged their support. From the preference of the people's hearts, the Will of Heaven can be seen. How could We then bear to oppose the will of millions for the glory of one Family? Therefore, observing the tendencies of the age on the one hand and studying the opinions of the people on the other, We and His Majesty the Emperor hereby grant the sovereignty to the people and decide in favor of a republican form of constitutional government.`,
      orderIndex: 6,
    },
  ]

  for (const doc of documents) {
    await prisma.dBQDocument.create({
      data: {
        ...doc,
        promptId: prompt.id,
      },
    })
  }

  console.log(
    `   ↳ Created prompt "${prompt.title}" with ${documents.length} documents`
  )
}

export async function seedIndustrialRevolutionDBQ() {
  console.log("🏭  Seeding Industrial Revolution DBQ...")

  const prompt = await prisma.dBQPrompt.upsert({
    where: { id: "dbq-industrial-revolution" },
    update: {},
    create: {
      id: "dbq-industrial-revolution",
      title: "The Industrial Revolution",
      question:
        "Evaluate the extent to which the Industrial Revolution changed social and economic structures in Europe and Japan between 1750 and 1900.",
      subject: "AP World History",
      era: "1750–1900",
    },
  })

  const existingDocs = await prisma.dBQDocument.count({
    where: { promptId: prompt.id },
  })

  if (existingDocs > 0) {
    console.log("   ↳ Documents already seeded, skipping.")
    return
  }

  const documents = [
    {
      docNumber: 1,
      title: "Document 1",
      source:
        "Testimony of Matthew Crabtree, a 22-year-old former factory worker, before the Sadler Committee, a British parliamentary committee investigating working conditions in textile factories, 1832.",
      content: `Question: What age were you when you first entered a factory?
Answer: Eight years old.

Question: What were your hours of labor?
Answer: From six in the morning to eight at night.

Question: With what intervals for refreshment and rest?
Answer: An hour at noon.

Question: Were you always in time?
Answer: No.

Question: What was the consequence if you had been too late?
Answer: I was most severely beaten...

Question: When you got home at night after this labor, did you feel much fatigued?
Answer: Very much so.

Question: Had you any time to be with your parents, and to receive instruction?
Answer: No.`,
      orderIndex: 0,
    },
    {
      docNumber: 2,
      title: "Document 2",
      source:
        "Andrew Ure, British professor of chemistry and physician, The Philosophy of Manufactures, 1835.",
      content: `In my recent tour through the manufacturing districts, I have seen tens of thousands of old, young, and middle-aged of both sexes earning abundant food, clothing, and domestic accommodation, without sweating at a single pore, screened meanwhile from the summer's sun and the winter's frost, in apartments more airy and salubrious than those of the metropolis in which our legislative and fashionable aristocracies assemble. In those spacious halls the benignant power of steam summons around him his myriads of willing menials, and assigns to each the regulated task, substituting for painful muscular effort on their part, the energies of his own gigantic arm, and demanding in return only attention and dexterity.`,
      orderIndex: 1,
    },
    {
      docNumber: 3,
      title: "Document 3",
      source:
        'Edward Baines, History of the Cotton Manufacture in Great Britain, 1835. Illustration titled "Power Loom Weaving."',
      content: `(Note: This engraving shows female workers operating power looms in a large, highly structured factory environment.)`,
      imageUrl: "/dbq/industrial-revolution-power-loom.png",
      imageAlt: "Power Loom Weaving — engraving of female workers operating power looms in a factory",
      orderIndex: 2,
    },
    {
      docNumber: 4,
      title: "Document 4",
      source:
        "Karl Marx and Friedrich Engels, German philosophers and social theorists, The Communist Manifesto, 1848.",
      content: `The bourgeoisie [the capitalist class], wherever it has got the upper hand, has put an end to all feudal, patriarchal, idyllic relations. It has pitilessly torn asunder the motley feudal ties that bound man to his "natural superiors," and has left remaining no other nexus between man and man than naked self-interest, than callous "cash payment."

Owing to the extensive use of machinery and to the division of labor, the work of the proletarians [the working class] has lost all individual character, and, consequently, all charm for the workman. He becomes an appendage of the machine, and it is only the most simple, most monotonous, and most easily acquired knack, that is required of him. Hence, the cost of production of a workman is restricted, almost entirely, to the means of subsistence that he requires for his maintenance.`,
      orderIndex: 3,
    },
    {
      docNumber: 5,
      title: "Document 5",
      source:
        "Flora Tristan, French socialist and feminist, The Workers' Union, 1843.",
      content: `Workers, you must leave behind this isolation in which you find yourselves and unite! ... The workers, the providers of all wealth, who have made everyone else's fortune, are living in terrible conditions. And why? Because they are divided...

Women of the working class, you also must respond to this call. In the life of the workers, the woman is everything. She is their sole providence. If she fails them, everything fails them. Therefore, you must demand that your rights be recognized, not just as workers, but as women, for your emancipation is tied to the emancipation of the entire working class.`,
      orderIndex: 4,
    },
    {
      docNumber: 6,
      title: "Document 6",
      source:
        "Utagawa Hiroshige III, Japanese woodblock print artist, Illustration of a Steam Train along the Takanawa Coast, 1871.",
      content: `(Note: During the Meiji Restoration, the Japanese government rapidly modernized and industrialized to compete with Western powers. This print celebrates the opening of Japan's first railway line.)`,
      imageUrl: "/dbq/industrial-revolution-steam-train.png",
      imageAlt: "Japanese woodblock print depicting a steam train along the Takanawa Coast, 1871",
      orderIndex: 5,
    },
    {
      docNumber: 7,
      title: "Document 7",
      source:
        "Traditional work song sung by young female silk-reeling workers in the Nagano prefecture, Japan, late 19th century.",
      content: `My parents are poor, so they sent me away,
To the silk mill, to work day by day.
The factory is a prison, the supervisor a demon,
The thread breaks, and I am beaten.

From early morning until the stars appear,
I reel the silk, shedding many a tear.
If I run away, where would I go?
My family needs the money, this I know.

We girls are like the silkworms, kept in a cage,
Spinning our lives away for a meager wage.`,
      orderIndex: 6,
    },
  ]

  for (const doc of documents) {
    await prisma.dBQDocument.create({ data: { ...doc, promptId: prompt.id } })
  }

  console.log(
    `   ↳ Created prompt "${prompt.title}" with ${documents.length} documents`
  )
}

export async function seedImperialismDBQ() {
  console.log("🌍  Seeding Imperialism DBQ...")

  const prompt = await prisma.dBQPrompt.upsert({
    where: { id: "dbq-imperialism-africa" },
    update: {},
    create: {
      id: "dbq-imperialism-africa",
      title: "European Imperialism in Africa",
      question:
        "Evaluate the extent to which European imperialism in Africa between 1870 and 1914 was driven by economic motives versus ideological justifications.",
      subject: "AP World History",
      era: "1870–1914",
    },
  })

  const existingDocs = await prisma.dBQDocument.count({
    where: { promptId: prompt.id },
  })

  if (existingDocs > 0) {
    console.log("   ↳ Documents already seeded, skipping.")
    return
  }

  const documents = [
    {
      docNumber: 1,
      title: "Document 1",
      source:
        "John A. Hobson, British economist, Imperialism: A Study, 1902.",
      content: `Although the new Imperialism has been bad business for the nation, it has been good business for certain classes and certain trades within the nation. The vast expenditure on armaments, the costly wars, the provision of public works in new territory and the exploitation of local resources... are a source of great profit to these men.

The economic root of Imperialism is the desire of strong organized industrial and financial interests to secure and develop at the public expense and by the public force private markets for their surplus goods and their surplus capital.`,
      orderIndex: 0,
    },
    {
      docNumber: 2,
      title: "Document 2",
      source:
        "Rudyard Kipling, British poet, The White Man's Burden, 1899.",
      content: `Take up the White Man's burden—
Send forth the best ye breed—
Go bind your sons to exile
To serve your captives' need;
To wait in heavy harness,
On fluttered folk and wild—
Your new-caught, sullen peoples,
Half-devil and half-child...

Take up the White Man's burden—
The savage wars of peace—
Fill full the mouth of Famine
And bid the sickness cease.`,
      orderIndex: 1,
    },
    {
      docNumber: 3,
      title: "Document 3",
      source:
        'Edward Linley Sambourne, The Rhodes Colossus, published in Punch Magazine, 1892.',
      content: `(Note: This cartoon depicts Cecil Rhodes, a prominent British imperialist and mining magnate, standing astride the continent of Africa holding a telegraph wire. Rhodes famously stated his desire to build a railway and telegraph line connecting British territories from "Cape to Cairo" (South Africa to Egypt), representing both economic monopoly and British technological supremacy.)`,
      imageUrl: "/dbq/imperialism-rhodes-colossus.png",
      imageAlt:
        'The Rhodes Colossus — cartoon of Cecil Rhodes standing astride Africa from Cape to Cairo',
      orderIndex: 2,
    },
    {
      docNumber: 4,
      title: "Document 4",
      source:
        "Ndansi Kumalo, Ndebele warrior, oral history account of the Ndebele Rebellion against the British South Africa Company in Matabeleland, 1896.",
      content: `We were treated like beasts of burden and our cattle were taken from us... The white men did as they liked. They took our wives and daughters. If a man resisted, he was shot...

We said to ourselves, 'It is better to die than to live like this.'... So we rose. We had only spears and shields, and the white men had the Maxim guns. It was not a fight, it was a massacre. We lost our land, we lost our freedom, and we were forced to pay taxes to the people who stole our country.`,
      orderIndex: 3,
    },
    {
      docNumber: 5,
      title: "Document 5",
      source:
        "General Act of the Berlin Conference, signed by major European Powers, 1885.",
      content: `Article 34: Any power which henceforth takes possession of a tract of land on the coasts of the African continent outside of its present possessions... shall acquire them, as well as the power which assumes a Protectorate there...

Article 35: The Signatory Powers of the present Act recognize the obligation to insure the establishment of authority in the regions occupied by them on the coasts of the African Continent sufficient to protect existing rights, and, as the case may be, freedom of trade and of transit under the conditions agreed upon.`,
      orderIndex: 4,
    },
    {
      docNumber: 6,
      title: "Document 6",
      source:
        "George Washington Williams, African-American journalist and historian, An Open Letter to His Serene Majesty Leopold II, King of the Belgians and Sovereign of the Independent State of Congo, 1890.",
      content: `Against the deceit, fraud, robberies, arson, murder, slave-raiding, and general policy of cruelty of your Majesty's Government to the natives, stands their record of unexampled patience...

Your Majesty's Government has seized their land, burned their towns, stolen their property, enslaved their women and children... All the crimes perpetrated in the Congo have been done in your name, and you must answer at the bar of Public Sentiment for the misgovernment of a people, whose lives and fortunes were entrusted to you by the august Conference of Berlin.`,
      orderIndex: 5,
    },
    {
      docNumber: 7,
      title: "Document 7",
      source:
        'Cover of Le Petit Journal, a popular French newspaper, depicting "France in Morocco," 1911.',
      content: `(Note: The cover shows Marianne, the personification of the French Republic, arriving in North Africa. She is depicted as a radiant, peaceful figure bringing a cornucopia spilling over with gold coins, while local Moroccan figures bow to her in submission and gratitude. The French caption translates to: "France will be able freely to bring civilization, wealth and peace to Morocco.")`,
      imageUrl: "/dbq/imperialism-le-petit-journal.png",
      imageAlt:
        'Le Petit Journal cover — Marianne bringing "civilization" to Morocco, 1911',
      orderIndex: 6,
    },
  ]

  for (const doc of documents) {
    await prisma.dBQDocument.create({ data: { ...doc, promptId: prompt.id } })
  }

  console.log(
    `   ↳ Created prompt "${prompt.title}" with ${documents.length} documents`
  )
}

// Allow running standalone
if (require.main === module) {
  Promise.all([seedDBQ(), seedIndustrialRevolutionDBQ(), seedImperialismDBQ()])
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e)
      prisma.$disconnect()
      process.exit(1)
    })
}
