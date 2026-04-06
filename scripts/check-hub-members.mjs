import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()

async function main() {
  const hub = await p.space.findUnique({
    where: { hubSlug: "ap-world-history" },
    select: { id: true, ownerId: true, name: true },
  })
  if (!hub) {
    console.log("No hub found")
    return
  }

  // Find Notera Admin
  const noteraAdmin = await p.user.findFirst({
    where: { email: "admin@notera.com" },
  })
  if (!noteraAdmin) {
    console.log("Notera Admin not found")
    return
  }
  console.log("Notera Admin ID:", noteraAdmin.id, "Name:", noteraAdmin.name)

  // Find Koda Admin
  const kodaAdmin = await p.user.findFirst({
    where: { email: "admin@koda.app" },
  })
  console.log("Koda Admin ID:", kodaAdmin?.id, "Name:", kodaAdmin?.name)

  // 1. Promote Notera Admin to OWNER in hub
  await p.spaceMember.update({
    where: { userId_spaceId: { userId: noteraAdmin.id, spaceId: hub.id } },
    data: { role: "OWNER" },
  })
  console.log("✅ Notera Admin promoted to OWNER")

  // 2. Transfer hub ownership
  await p.space.update({
    where: { id: hub.id },
    data: { ownerId: noteraAdmin.id },
  })
  console.log("✅ Hub ownership transferred to Notera Admin")

  // 3. Remove Koda Admin from hub
  if (kodaAdmin) {
    await p.spaceMember.deleteMany({
      where: { userId: kodaAdmin.id, spaceId: hub.id },
    })
    console.log("✅ Koda Admin removed from hub")
  }

  // Show updated members
  const members = await p.spaceMember.findMany({
    where: { spaceId: hub.id },
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  })
  console.log("\nUpdated members:")
  members.forEach((m) =>
    console.log(
      `  ${m.user.name} (${m.user.email}) — SpaceRole: ${m.role}, GlobalRole: ${m.user.role}`
    )
  )
}

main().then(() => p.$disconnect())
