import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  const items = await prisma.item.count();
  const matches = await prisma.match.count();
  console.log(`✅ Connected — items: ${items}, matches: ${matches}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
