import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allOnboarding = await prisma.publisherOnboarding.findMany();
  console.log('All Onboarding Records (Total ' + allOnboarding.length + '):');
  console.log(JSON.stringify(allOnboarding, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
