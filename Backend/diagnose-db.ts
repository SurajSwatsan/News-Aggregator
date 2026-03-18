import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
  console.log('--- DIAGNOSIS START ---');

  // 1. Check all users and their roles
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  console.log(`\nFound ${users.length} total users.`);
  users.forEach(u => console.log(`- ${u.email} (${u.role}) ID: ${u.id}`));

  // 2. Check all sources and who owns them
  const sources = await prisma.source.findMany({
    include: {
      owner: { select: { email: true } },
      _count: { select: { articles: true } }
    }
  });
  console.log(`\nFound ${sources.length} total sources.`);
  sources.forEach(s => {
    console.log(`- Source: ${s.name} | RSS: ${s.rssUrl} | Owner: ${s.owner?.email || 'NONE'} | Articles: ${s._count.articles}`);
  });

  // 3. Check for "orphaned" articles (sourceId doesn't exist)
  const allSourceIds = sources.map(s => s.id);
  const articlesCount = await prisma.article.count();
  console.log(`\nFound ${articlesCount} total articles.`);
  
  if (articlesCount > 0) {
    const orphanedArticles = await prisma.article.findMany({
      where: { sourceId: { notIn: allSourceIds } },
      take: 5
    });
    console.log(`- Orphaned articles: ${orphanedArticles.length}`);
  }

  // 4. Check specific user from screenshot if possible
  // From screenshot Step 299: namratapatil8342@gmail.com
  const targetEmail = 'namratapatil8342@gmail.com';
  const targetUser = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: {
      sources: {
        include: { _count: { select: { articles: true } } }
      }
    }
  });

  if (targetUser) {
    console.log(`\nTarget User: ${targetEmail}`);
    if (targetUser.sources.length === 0) {
      console.log('- NO SOURCES FOUND for this user.');
    } else {
      targetUser.sources.forEach(s => {
        console.log(`- Source Owned: ${s.name} (ID: ${s.id}) | Articles Count: ${s._count.articles}`);
      });
    }
  } else {
    console.log(`\nUser ${targetEmail} not found in database.`);
  }

  console.log('\n--- DIAGNOSIS END ---');
}

diagnose()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
