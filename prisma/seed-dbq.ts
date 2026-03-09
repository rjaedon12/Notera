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

// Allow running standalone
if (require.main === module) {
  seedDBQ()
    .then(() => prisma.$disconnect())
    .catch((e) => {
      console.error(e)
      prisma.$disconnect()
      process.exit(1)
    })
}
