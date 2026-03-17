import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testAuth() {
  const email = 'admin@news.com';
  const pass = 'admin123';
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found!');
    return;
  }
  
  const isValid = await bcrypt.compare(pass, user.passwordHash);
  console.log(`Auth for ${email}: ${isValid ? 'SUCCESS' : 'FAILED'}`);
  console.log(`User ID (UUID): ${user.id}`);
}

testAuth().catch(console.error).finally(() => prisma.$disconnect());
