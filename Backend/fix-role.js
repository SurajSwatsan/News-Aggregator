const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixRole() {
  const email = 'your-email@example.com'; // CHANGE THIS
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found:', email);
    return;
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role: 'publisher' }
  });

  console.log(`✅ Success! Updated ${email} role to ${updatedUser.role}`);
}

fixRole()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
