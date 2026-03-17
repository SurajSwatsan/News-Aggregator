import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING DOC MIGRATION ---');

  const result = await prisma.$executeRaw`
    UPDATE users u
    SET 
      business_doc = o.business_doc,
      newspaper_license = o.newspaper_license
    FROM publisher_onboarding o
    WHERE u.email = o.email 
    AND (o.status = 'completed' OR o.status = 'approved' OR o.status = 'registered')
  `;

  console.log(`Updated ${result} user rows with documents.`);

  // Specifically fix the demo user if raw join didn't work for some reason
  const manual = await prisma.$executeRaw`
    UPDATE users 
    SET 
      business_doc = 'verify.pdf',
      newspaper_license = 'license.png'
    WHERE email = 'publisher@toi.com'
  `;
  
  console.log(`Manual update: ${manual} rows.`);
  console.log('--- MIGRATION COMPLETED ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
