const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUser() {
  const email = 'Aryan@gmail.com';
  
  // 1. Find the onboarding record
  const onboarding = await prisma.publisherOnboarding.findFirst({
    where: { email }
  });

  if (!onboarding) {
    console.log('No onboarding record found for', email);
    return;
  }

  console.log('Found onboarding record:', onboarding.id);

  // 2. Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log('User already exists in users table:', existingUser.id);
    return;
  }

  // 3. Create the user
  const newUser = await prisma.user.create({
    data: {
      id: onboarding.id, // Use same ID for consistency
      email: onboarding.email,
      username: onboarding.username || email.split('@')[0],
      firstName: onboarding.firstName,
      lastName: onboarding.lastName,
      name: onboarding.firstName ? `${onboarding.firstName} ${onboarding.lastName || ''}`.trim() : (onboarding.orgName || 'Aryan'),
      role: onboarding.requestedRole === 'admin' ? 'admin' : (onboarding.requestedRole === 'publisher' ? 'publisher' : 'reader'),
      passwordHash: onboarding.passwordHash || '$2b$10$TmfqNu5N.55nZekPiS6apuvF46CfHAxg/BvLGeW959nnsceXg8BA2', // Default to admin@news.com password if missing (usually it's 123456)
      creditBalance: 10,
      isDeleted: false
    }
  });

  console.log('Successfully created user:', newUser.email);
}

fixUser()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
