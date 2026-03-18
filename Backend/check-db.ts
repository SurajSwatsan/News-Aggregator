import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      sources: true
    }
  });

  console.log('--- LATEST USERS AND SOURCES ---');
  users.forEach(u => {
    console.log(`User: ${u.email} (${u.role})`);
    if (u.sources.length === 0) {
      console.log('  No sources found');
    } else {
      u.sources.forEach(s => {
        console.log(`  Source: ${s.name} | RSS: ${s.rssUrl} | Active: ${s.isActive}`);
      });
    }
  });

  const articles = await prisma.article.count();
  console.log(`--- TOTAL ARTICLES IN DB: ${articles} ---`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
