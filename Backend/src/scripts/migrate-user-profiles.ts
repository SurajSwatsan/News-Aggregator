import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING USER PROFILE MIGRATION ---');

  // 1. Get all users who have null profile fields
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: null },
        { orgName: null },
        { city: null }
      ]
    }
  });

  console.log(`Found ${users.length} users with incomplete profile data.`);

  for (const user of users) {
    // 2. Find matching onboarding record
    let matchEmail = user.email;
    if (user.email === 'publisher@toi.com') matchEmail = 'namupatil3101@gmail.com';
    
    const onboarding = await prisma.publisherOnboarding.findFirst({
      where: { 
        email: matchEmail,
        status: { in: ['completed', 'approved', 'registered'] }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (onboarding) {
      console.log(`Migrating data for user: ${user.email}`);
      
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name || (onboarding.firstName ? `${onboarding.firstName} ${onboarding.lastName || ''}`.trim() : null) || onboarding.orgName || null,
          firstName: onboarding.firstName,
          lastName: onboarding.lastName,
          orgName: onboarding.orgName,
          orgWebsite: onboarding.orgWebsite,
          phone: onboarding.phone,
          city: onboarding.city,
          country: onboarding.country
        }
      });
    } else {
      console.log(`No onboarding record found for: ${user.email}. Skipping.`);
    }
  }

  console.log('--- MIGRATION COMPLETED ---');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
