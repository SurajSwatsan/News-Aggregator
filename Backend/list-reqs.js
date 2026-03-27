const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function list() {
  const reqs = await prisma.publisherOnboarding.findMany();
  console.log(JSON.stringify(reqs, null, 2));
}
list().finally(() => prisma.$disconnect());
