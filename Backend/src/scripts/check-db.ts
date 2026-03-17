import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('--- Current Users in DB ---');
  users.forEach(u => {
    console.log(`Email: ${u.email}, Role: ${u.role}, ID: ${u.id}`);
  });
  console.log('---------------------------');
}

check().catch(console.error).finally(() => prisma.$disconnect());
