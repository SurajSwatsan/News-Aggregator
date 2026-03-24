const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restoreRecord() {
  const id = 'b2ff57ba-e1b6-49fa-84ef-1cc7e3732e70';
  const email = 'ts.Patil@swatsan.com';
  const orgName = '4news';
  
  console.log('--- RESTORING RECORD ---');
  
  const existing = await prisma.publisherOnboarding.findUnique({
    where: { id: id }
  });
  
  if (existing) {
    console.log('Record already exists:', existing);
    return;
  }
  
  const record = await prisma.publisherOnboarding.create({
    data: {
      id: id,
      token: 'mock-token-' + Date.now(),
      email: email,
      orgName: orgName,
      status: 'registered',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      requestedRole: 'publisher'
    }
  });
  
  console.log('Successfully restored record:', record);
}

restoreRecord()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
