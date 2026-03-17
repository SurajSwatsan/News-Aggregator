import { PrismaClient, UserRole, OnboardingStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING UUID DATABASE ---');

  // 0. Clear existing data
  await prisma.article.deleteMany();
  await prisma.source.deleteMany();
  await prisma.publisherOnboarding.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('admin123', 10);

  // 1. Create Onboarding Record

  // 2. Create Active User (Admin)
  await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'admin@news.com',
      name: 'Admin',
      passwordHash,
      role: UserRole.admin,
      creditBalance: 1000
    }
  });

  // 3. Create Active User (Publisher)
  await prisma.user.create({
    data: {
      id: uuidv4(),
      email: 'publisher@toi.com',
      name: 'Namrata',
      orgName: 'Times of India',
      orgWebsite: 'https://timesofindia.indiatimes.com',
      phone: '9876543210',
      city: 'Mumbai',
      country: 'India',
      businessDoc: 'verify.pdf',
      newspaperLicense: 'license.png',
      passwordHash,
      role: UserRole.publisher,
      creditBalance: 0
    }
  });

  console.log('--- SEEDING COMPLETED ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
