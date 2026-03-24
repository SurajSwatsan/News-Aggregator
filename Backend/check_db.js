const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = 'b2ff57ba-e1b6-49fa-84ef-1cc7e3732e70';
  const request = await prisma.publisherOnboarding.findUnique({
    where: { id: id }
  });
  
  if (request) {
    console.log('Request found:', JSON.stringify(request, null, 2));
  } else {
    console.warn('Request NOT found for ID:', id);
    const allRequests = await prisma.publisherOnboarding.findMany();
    console.log('All pending/registered requests count:', allRequests.length);
    console.log('Requests summary:', allRequests.map(r => ({ id: r.id, email: r.email, status: r.status })));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
