const { PrismaClient } = require('@prisma/client');

async function searchAll(id) {
  const url = `postgresql://postgres:123@localhost:5433/newsaggregator?schema=public`;
  const prisma = new PrismaClient({
    datasources: { db: { url: url } }
  });

  try {
    console.log(`Searching for ID/Token: ${id}`);
    const byId = await prisma.publisherOnboarding.findUnique({ where: { id } });
    const byToken = await prisma.publisherOnboarding.findUnique({ where: { token: id } });
    
    if (byId) console.log('Found by ID:', JSON.stringify(byId, null, 2));
    if (byToken) console.log('Found by Token:', JSON.stringify(byToken, null, 2));
    
    if (!byId && !byToken) {
      console.log('Not found in any field. Searching for similar IDs or emails...');
      const all = await prisma.publisherOnboarding.findMany();
      console.log('All IDs/Tokens present:');
      all.forEach(o => console.log(`- ID: ${o.id} | Token: ${o.token} | Email: ${o.email} | Status: ${o.status}`));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

const id = 'b982c7b6-b4e5-4bd7-9b57-16d5604d2f23';
searchAll(id);
