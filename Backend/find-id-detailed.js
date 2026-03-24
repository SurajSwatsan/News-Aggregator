const { PrismaClient } = require('@prisma/client');

async function findId(id) {
  const url = `postgresql://postgres:123@localhost:5433/newsaggregator?schema=public`;
  console.log(`\n--- Searching for ID ${id} on PORT 5433 ---`);
  
  const prisma = new PrismaClient({
    datasources: {
      db: { url: url }
    }
  });

  try {
    const onboarding = await prisma.publisherOnboarding.findUnique({
      where: { id: id }
    });
    if (onboarding) {
      console.log('Found by ID:', onboarding);
    } else {
      console.log('Not found by ID.');
      
      const byToken = await prisma.publisherOnboarding.findUnique({
        where: { token: id }
      });
      if (byToken) {
        console.log('Found by Token:', byToken);
      } else {
        console.log('Not found by Token.');
      }
    }
    
    const all = await prisma.publisherOnboarding.findMany();
    console.log('All Onboarding Records:', all);
  } catch (err) {
    console.error(`Error:`, err.message);
  } finally {
    await prisma.$disconnect();
  }
}

const idToFind = 'b982c7b6-b4e5-4bd7-9b57-16d5604d2f23';
findId(idToFind);
