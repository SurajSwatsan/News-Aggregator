const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, isDeleted: true }
  });
  console.log('--- USERS TABLE ---');
  console.table(users);

  const onboarding = await prisma.publisherOnboarding.findMany({
    select: { id: true, email: true, requestedRole: true, status: true }
  });
  console.log('\n--- PUBLISHER_ONBOARDING TABLE ---');
  console.table(onboarding);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
