const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.article.count({
      where: { category: 'Environment' }
    });
    console.log(`Total Environment articles: ${count}`);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
