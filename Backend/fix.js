const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  await prisma.source.updateMany({
    where: { name: 'Reuters' },
    data: { rssUrl: 'https://www.aljazeera.com/xml/rss/all.xml' }
  });
  console.log('Successfully Migrated Reuters to Al Jazeera');
}

fix()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
