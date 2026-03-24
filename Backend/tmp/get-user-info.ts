import { PrismaClient } from '@prisma/client';

async function getUserInfo() {
  const prisma = new PrismaClient();
  const userId = 'b35fe020-398c-4b21-bd3e-955e76d7f1dd';
  
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });
  
  console.log('--- User Information ---');
  console.log(JSON.stringify(user, null, 2));
  
  await prisma.$disconnect();
}

getUserInfo();
