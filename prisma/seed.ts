import "dotenv/config";
import { prisma } from "../lib/prisma";
import { findAndSaveMatches } from "../lib/matcher";

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

async function main() {
  await prisma.match.deleteMany();
  await prisma.item.deleteMany();

  const lostAirpods = await prisma.item.create({
    data: {
      name: "Black AirPods Case",
      description:
        "Black AirPods Pro charging case with a small scratch on the lid. Lost during an evening study session.",
      location: "Library",
      category: "Electronics",
      color: "Black",
      dateAndTime: daysAgo(2),
      reportType: "LOST",
    },
  });

  const foundEarbuds = await prisma.item.create({
    data: {
      name: "Wireless earbud charging case",
      description:
        "Found a dark wireless earbud case on a table near the library entrance. Has a scratch on the lid.",
      location: "Library entrance",
      category: "Electronics",
      color: "Black",
      dateAndTime: daysAgo(1),
      reportType: "FOUND",
    },
  });

  const lostId = await prisma.item.create({
    data: {
      name: "Student ID Card",
      description:
        "University student ID card on a lanyard. The name starts with M. Last seen at lunch.",
      location: "Cafeteria",
      category: "Documents",
      dateAndTime: daysAgo(3),
      reportType: "LOST",
    },
  });

  const foundId = await prisma.item.create({
    data: {
      name: "University ID card",
      description:
        "Found a student ID card on a cafeteria table and handed it to staff at the counter.",
      location: "Cafeteria",
      category: "Documents",
      dateAndTime: daysAgo(1),
      reportType: "FOUND",
    },
  });

  const lostBottle = await prisma.item.create({
    data: {
      name: "Blue water bottle",
      description:
        "Green-blue steel water bottle covered in stickers. Left somewhere near the gym.",
      location: "Gym",
      category: "Water bottles",
      color: "Blue",
      dateAndTime: daysAgo(1),
      reportType: "LOST",
    },
  });

  const lostBackpack = await prisma.item.create({
    data: {
      name: "Black backpack near the fountain",
      description:
        "Black campus backpack with a broken zipper pull. Has a chemistry textbook inside.",
      location: "Main fountain",
      category: "Bags",
      color: "Black",
      dateAndTime: daysAgo(4),
      reportType: "LOST",
    },
  });

  await prisma.item.create({
    data: {
      name: "Backpack with sketchbooks",
      description:
        "Found a black backpack with two sketchbooks inside by the fountain walkway.",
      location: "Fountain walkway",
      category: "Bags",
      color: "Black",
      dateAndTime: daysAgo(2),
      reportType: "FOUND",
    },
  });

  const foundBottle = await prisma.item.create({
    data: {
      name: "Steel bottle",
      description:
        "Found a blue insulated steel bottle covered in stickers next to the gym entrance benches.",
      location: "Gym",
      category: "Bottle",
      color: "Blue",
      dateAndTime: daysAgo(1),
      reportType: "FOUND",
    },
  });

  await findAndSaveMatches(lostAirpods);
  await findAndSaveMatches(foundEarbuds);
  await findAndSaveMatches(lostId);
  await findAndSaveMatches(foundId);
  await findAndSaveMatches(lostBackpack);
  await findAndSaveMatches(lostBottle);
  await findAndSaveMatches(foundBottle);

  console.log(`Seeded ${await prisma.item.count()} items and ${await prisma.match.count()} matches.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
