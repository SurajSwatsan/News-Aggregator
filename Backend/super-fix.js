const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Data Fix...');

  // 1. Fix Prathamesh's role - was "reader" due to previous bug
  const prathameshEmail = 'prathamesh@gmail.com';
  const onboarding = await prisma.publisherOnboarding.updateMany({
    where: { email: prathameshEmail },
    data: { requestedRole: 'publisher' }
  });
  console.log(`- Updated ${onboarding.count} onboarding records for ${prathameshEmail} to PUBLISHER.`);

  const userRes = await prisma.user.updateMany({
    where: { email: prathameshEmail },
    data: { role: 'publisher' }
  });
  console.log(`- Updated ${userRes.count} user records for ${prathameshEmail} to PUBLISHER.`);

  // 2. Ensure admin@news.com is an admin
  const adminRes = await prisma.user.updateMany({
    where: { email: 'admin@news.com' },
    data: { role: 'admin' }
  });
  console.log(`- Verified ${adminRes.count} admin accounts.`);

  console.log('✅ Data Fix Complete!');
}

main()
  .catch(e => {
    console.error('❌ Error during fix:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
