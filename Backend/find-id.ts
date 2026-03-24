import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const targetId = '8574f853-98f2-4849-aeb5-3dc090ee5309';
  console.log('Searching for ID:', targetId);

  const onboarding = await prisma.publisherOnboarding.findUnique({ where: { id: targetId } });
  const onboardingByToken = await prisma.publisherOnboarding.findUnique({ where: { token: targetId } });
  const user = await prisma.user.findUnique({ where: { id: targetId } });
  const source = await prisma.source.findUnique({ where: { id: targetId } });

  console.log('Search Results:');
  console.log('- Onboarding by ID:', onboarding);
  console.log('- Onboarding by Token:', onboardingByToken);
  console.log('- User:', user);
  console.log('- Source:', source);

  if (!onboarding && !onboardingByToken) {
    const allOnboarding = await prisma.publisherOnboarding.findMany();
    console.log('All Onboarding Records:', JSON.stringify(allOnboarding, null, 2));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
