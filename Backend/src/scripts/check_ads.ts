import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const ads = await prisma.advertisement.findMany();
  console.log(JSON.stringify(ads, null, 2));
  await prisma.$disconnect();
}

main();
