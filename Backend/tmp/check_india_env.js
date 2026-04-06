const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const totalCount = await prisma.article.count({
      where: { 
        category: 'Environment',
        country: { contains: 'India', mode: 'insensitive' }
      }
    });
    
    console.log(`Total Environment articles in India: ${totalCount}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
