import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const sources = await prisma.source.findMany();
  console.log(JSON.stringify(sources, null, 2));
}
main().finally(() => prisma.$disconnect());
