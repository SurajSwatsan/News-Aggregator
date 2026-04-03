import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const article = await prisma.article.findFirst({
    where: { title: { contains: 'Trump loyalists', mode: 'insensitive' } },
    include: { source: true }
  });

  if (!article) {
    console.log('Article not found.');
    return;
  }

  console.log('--- TARGET ARTICLE ---');
  console.log('ID:', article.id);
  console.log('Title:', article.title);
  console.log('Category:', article.category);
  console.log('ClusterID:', article.clusterId);
  console.log('Source:', article.source.name);

  // Check what related articles would be found
  const relatedByCluster = article.clusterId ? await prisma.article.findMany({
    where: { clusterId: article.clusterId, id: { not: article.id } },
    include: { source: true }
  }) : [];

  console.log('\n--- RELATED BY CLUSTER ---', relatedByCluster.length);

  const relatedByCategory = article.category ? await prisma.article.findMany({
    where: { category: article.category, id: { not: article.id }, sourceId: { not: article.sourceId } },
    include: { source: true },
    orderBy: { postedAt: 'desc' },
    take: 5
  }) : [];

  console.log('\n--- RELATED BY CATEGORY (OTHER SOURCES) ---', relatedByCategory.length);
  relatedByCategory.forEach(a => console.log(`- [${a.source.name}] ${a.title}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
