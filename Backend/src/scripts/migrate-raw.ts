import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING RAW SQL MIGRATION ---');

  // 1. Update the publisher account specifically
  const result = await prisma.$executeRaw`
    UPDATE users 
    SET 
      name = 'Namrata',
      org_name = 'Times of India',
      org_website = 'https://timesofindia.indiatimes.com',
      phone = '9876543210',
      city = 'Mumbai',
      country = 'India'
    WHERE email = 'publisher@toi.com'
  `;

  console.log(`Updated ${result} user rows.`);

  // 2. Clear out existing onboarding artifacts for cleaner demo
  console.log('--- MIGRATION COMPLETED ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
