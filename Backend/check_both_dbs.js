const { PrismaClient } = require('@prisma/client');

async function checkDb(port) {
  const url = `postgresql://postgres:123@localhost:${port}/newsaggregator?schema=public`;
  console.log(`\n--- Checking Database on PORT ${port} ---`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: url }
    }
  });

  try {
    const users = await prisma.user.findMany({ select: { email: true, role: true } });
    console.log(`Users (${users.length}):`, users.map(u => `${u.email} (${u.role})`).join(', '));

    const onboarding = await prisma.publisherOnboarding.findMany({ select: { email: true, status: true, id: true } });
    console.log(`Onboarding (${onboarding.length}):`, onboarding.map(o => `${o.email} (${o.status}) [${o.id}]`).join(', '));
  } catch (err) {
    console.error(`Error checking DB on ${port}:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await checkDb(5433);
  await checkDb(5432);
}

main();
