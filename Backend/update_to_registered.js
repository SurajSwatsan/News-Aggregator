const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateRecord() {
  const email = 'test@example.com';
  
  const record = await prisma.publisherOnboarding.findFirst({
    where: { email: email }
  });
  
  if (!record) {
    console.warn('Record not found for:', email);
    return;
  }
  
  const updated = await prisma.publisherOnboarding.update({
    where: { id: record.id },
    data: { 
      status: 'registered',
      orgName: 'Test Org',
      orgWebsite: 'https://test.com',
      orgDescription: 'Testing description'
    }
  });
  
  console.log('Successfully updated record to registered:', updated.id);
}

updateRecord()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
