import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const pool = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter: pool });

async function main() {
  const ada = await prisma.person.upsert({
    where: { email: "ada@example.com" },
    update: {},
    create: { name: "Ada Lovelace", email: "ada@example.com" },
  });

  const grace = await prisma.person.upsert({
    where: { email: "grace@example.com" },
    update: {},
    create: { name: "Grace Hopper", email: "grace@example.com" },
  });

  const existing = await prisma.item.count();
  if (existing === 0) {
    await prisma.item.createMany({
      data: [
        {
          name: "Blue umbrella",
          description: "Collapsible umbrella with a wooden handle",
          location: "Library, 2nd floor",
          status: "FOUND",
          reportedById: ada.id,
        },
        {
          name: "Student ID card",
          description: "Card with a lanyard, name starts with 'M'",
          location: "Cafeteria",
          status: "LOST",
          reportedById: grace.id,
        },
        {
          name: "Water bottle",
          description: "Green steel bottle with stickers",
          location: "Gym entrance",
          status: "LOST",
          reportedById: ada.id,
        },
      ],
    });
  }

  const [people, items] = await Promise.all([prisma.person.count(), prisma.item.count()]);
  console.log(`Seeded ${people} person(s) and ${items} item(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
