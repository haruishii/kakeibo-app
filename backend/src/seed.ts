import { prisma } from "./lib/prisma.js";

// Backend / Seed script: initial master data for categories
async function main() {
  const categories = ["食費", "日用品", "交通費", "娯楽", "その他"];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: { email: "demo@example.com", name: "デモユーザー" },
  });

  const group = await prisma.group.create({
    data: { name: "家族" },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      groups: {
        connect: { id: group.id },
      },
    },
  });

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
