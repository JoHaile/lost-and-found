import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const people = await prisma.person.count();
  const items = await prisma.item.count();
  console.log(`✅ Connected — people: ${people}, items: ${items}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
