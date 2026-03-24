const { PrismaClient } = require('@prisma/client');

async function searchUser(id) {
  const url = `postgresql://postgres:123@localhost:5433/newsaggregator?schema=public`;
  const prisma = new PrismaClient({
    datasources: { db: { url: url } }
  });

  try {
    console.log(`Searching for ID in User table: ${id}`);
    const byId = await prisma.user.findUnique({ where: { id } });
    
    if (byId) console.log('Found in User table:', JSON.stringify(byId, null, 2));
    else console.log('Not found in User table.');
    
    const all = await prisma.user.findMany();
    console.log('All User IDs:');
    all.forEach(u => console.log(`- ID: ${u.id} | Email: ${u.email} | Role: ${u.role}`));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

const id = 'b982c7b6-b4e5-4bd7-9b57-16d5604d2f23';
searchUser(id);
