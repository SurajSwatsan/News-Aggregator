const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.$queryRawUnsafe(`
    SELECT 
      id, email, role::text as role, is_deleted as "isDeleted"
    FROM users
    UNION ALL
    SELECT 
      id, email, requested_role::text as role, false as "isDeleted"
    FROM publisher_onboarding
    WHERE email NOT IN (SELECT email FROM users)
  `);
  console.log('--- RAW USERS LIST ---');
  console.log(users);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
